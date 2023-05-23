import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import * as eks from 'aws-cdk-lib/aws-eks'
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

import util from 'util';
import { exec as oexec } from 'child_process';
import { ux } from '@cto.ai/sdk'
const pexec = util.promisify(oexec);
const convert = require('string-type-convertor');

interface StackProps {
  org: string
  env: string
  repo: string
  tag: string
  key: string
  entropy: string

  cluster: eks.Cluster | undefined
  registry: ecr.Repository | undefined
  redis: any | undefined // todo @kc - fix this
  db: rds.ServerlessCluster | undefined
  mq: sqs.Queue | undefined
 }

export default class Service extends cdk.Stack {

  public readonly id: string
  public readonly org: string
  public readonly env: string
  public readonly repo: string
  public readonly tag: string
  public readonly key: string
  public readonly entropy: string

  public readonly vpc: ec2.Vpc
  public readonly cluster: eks.Cluster
  public readonly registry: ecr.Repository
  public readonly db: rds.ServerlessCluster
  public readonly mq: sqs.Queue
  public readonly redis: any | undefined // todo @kc - fix this

  public URL: string

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id)

    if(!props?.cluster) {
      throw new Error('You must provide a Cluster for Service')
    }
    if(!props?.registry) {
      throw new Error('You must provide a Registry for Service')
    }
    if(!props?.db) {
      throw new Error('You must provide a db for Service')
    }
    if(!props?.redis) {
      throw new Error('You must provide a redis for Service')
    }
    if(!props?.mq) {
      throw new Error('You must provide a mq for Service')
    }

    this.id = id
    this.org = props?.org ?? 'cto-ai'
    this.env = props?.env ?? 'dev'
    this.key = props?.key ?? 'aws-eks-ec2-asg'
    this.repo = props?.repo ?? 'sample-expressjs-aws-eks-ec2-asg-cdk'
    this.tag = props?.tag ?? 'main'
    this.entropy = props?.entropy ?? '01012022'

    this.cluster = props.cluster
    this.registry = props.registry
    this.db = props.db
    this.redis = props.redis
    this.mq = props.mq
  }

  async initialize() {

    const CLUSTER_VAULT = sm.Secret.fromSecretAttributes(this, 'host', {
      secretArn: this.db?.secret?.secretArn
    } as sm.SecretAttributes);

    let secrets = {}
    const decode = (str: string):string => Buffer.from(str, 'base64').toString('binary');

    try {
      const VAULT_KEY = `${this.env}-${this.key}`
      const vault = await pexec(`kubectl get secret ${VAULT_KEY} -o json`) 
      const data = JSON.parse(vault.stdout); 
      for(let index of Object.keys(data.data)){
          let e = decode(data.data[index])
          secrets[index] = e
      }
    } catch(e) {
      //console.log('There was an error fetching secrets from the cluster vault:', e)
    }

    const environment = Object.assign({
      PORT: "3000",
      DB_HOST: CLUSTER_VAULT.secretValueFromJson('host').toString(),
      DB_PORT: CLUSTER_VAULT.secretValueFromJson('port').toString(),
      DB_USER: CLUSTER_VAULT.secretValueFromJson('username').toString(),
      REDIS_HOST: this.redis?.cluster?.attrRedisEndpointAddress,
      REDIS_PORT: this.redis?.cluster?.attrRedisEndpointPort,
      MQ_URL: this.mq?.queueUrl,
      MQ_NAME: this.mq?.queueName,
    }, { ...secrets })

    const env = Object.keys(environment).map((e) => {
      return { name: e, value: environment[e] }
    })

    try {

      const dManifest = {
        apiVersion: 'apps/v1',
        kind: 'Deployment', 
        metadata: {
          name: `${this.repo}`,
          labels: {
            'app.kubernetes.io/name': `load-balancer-${this.repo}`
          },
        },
        spec: {
          replicas: 1,
          selector: {
            matchLabels: {
              'app.kubernetes.io/name': `load-balancer-${this.repo}`
            }
          },
          template: {
            metadata: {
              labels: {
                'app.kubernetes.io/name': `load-balancer-${this.repo}`
              },
            },
            spec: {
              containers: [{
                image: `${process.env.AWS_ACCOUNT_NUMBER}.dkr.ecr.${process.env.AWS_REGION}.amazonaws.com/${this.repo}-${this.key}:${this.tag}`,
                name: `${this.repo}`,
                env: env,
                ports: [{
                  containerPort: convert(environment.PORT) || 3000
                }]
              }]
            }
          }
        }
      }

      const sManifest = {
        apiVersion: 'v1',
          kind: 'Service',
          metadata: {
            name: `${this.repo}-service`,
            labels: {
              'app.kubernetes.io/name': `load-balancer-${this.repo}`
            },
          },
          spec: {
            selector: {
              'app.kubernetes.io/name': `load-balancer-${this.repo}`
            },
            ports: [{
              'protocol': 'TCP',
              'port': 80,
              'targetPort': convert(environment.PORT) || 3000
            }],
            type: 'LoadBalancer'
          }
      }

      // deployment
      const deployment = this.cluster.addManifest(`${this.id}-deployment-manifest`, dManifest)
      const service = this.cluster.addManifest(`${this.id}-service-manifest`, sManifest)
      service.node.addDependency(deployment)

    } catch (err) {

      await ux.print(`⚠️  The deployment failed to complete successfully and will automatically rollback.`)

    }
  }
}
