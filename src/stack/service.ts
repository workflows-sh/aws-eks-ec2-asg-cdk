import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecr from '@aws-cdk/aws-ecr'
import * as eks from '@aws-cdk/aws-eks'
import * as rds from '@aws-cdk/aws-rds';
import * as sm from "@aws-cdk/aws-secretsmanager";
import * as s3 from '@aws-cdk/aws-s3';
import * as s3Deploy from '@aws-cdk/aws-s3-deployment';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as sqs from '@aws-cdk/aws-sqs';
import * as elasticache from './redis'
import { createTemplates } from './templates';
import * as k8s from '@kubernetes/client-node'
import { sdk } from '@cto.ai/sdk'
import ecsPatterns = require('@aws-cdk/aws-ecs-patterns')
import { Stack } from '@aws-cdk/core';

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

  constructor(scope: cdk.Construct, id: string, props?: StackProps) {
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
    this.repo = props?.repo ?? 'sample-app'
    this.tag = props?.tag ?? 'main'
    this.entropy = props?.entropy ?? '01012022'

    this.cluster = props.cluster
    this.registry = props.registry
    this.db = props.db
    this.redis = props.redis
    this.mq = props.mq
  }

  async initialize() {

    // S3
    const bucket = new s3.Bucket(this, `${this.id}-bucket`, {
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      websiteIndexDocument: "index.html"
    });

    // We can enable deployment from the local system using this
    const src = new s3Deploy.BucketDeployment(this, `${this.id}-deployment`, {
      sources: [s3Deploy.Source.asset("./sample-app/dist")],
      destinationBucket: bucket
    });

    // Cloudfront
    const cf = new cloudfront.CloudFrontWebDistribution(this, `${this.id}-cloudfront`, {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: bucket
          },
          behaviors: [{isDefaultBehavior: true}]
        },
      ]
    });

    const db_secrets = sm.Secret.fromSecretAttributes(this, 'host', {
      secretArn: this.db?.secret?.secretArn
    });

    try {

      const KUBE_CONFIG = process.env.KUBE_CONFIG

      if (KUBE_CONFIG) {

        const kc = new k8s.KubeConfig();
        kc.loadFromString(KUBE_CONFIG)

        const k8sApiCoreV1Api = kc.makeApiClient(k8s.CoreV1Api);
        const k8sApiAppsV1Api = kc.makeApiClient(k8s.AppsV1Api);
        const { deployment, service } = createTemplates(this.repo, this.tag)

        const deploymentExists = await k8sApiAppsV1Api.readNamespacedDeployment(deployment.metadata.name, 'default').catch((err) => {
          return false
        })

        const serviceExists = await k8sApiCoreV1Api.readNamespacedService(service.metadata.name, 'default').catch((err) => {
          return false
        })

        if (deploymentExists) {
          await k8sApiAppsV1Api.patchNamespacedDeployment(deployment.metadata.name, 'default', deployment, undefined, undefined, undefined, undefined, { headers: { 'content-type': 'application/strategic-merge-patch+json' }})
        } else {
          await k8sApiAppsV1Api.createNamespacedDeployment('default', deployment)
        }

        if (serviceExists) {
          await k8sApiCoreV1Api.patchNamespacedService(service.metadata.name, 'default', service, undefined, undefined, undefined, undefined, { headers: { 'content-type': 'application/strategic-merge-patch+json' }})
        } else {
          await k8sApiCoreV1Api.createNamespacedService('default', service)
        }
      }
    } catch (err) {
      console.log('err :', err)
    }
  }
}
