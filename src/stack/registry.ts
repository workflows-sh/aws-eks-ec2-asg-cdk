import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

interface StackProps {
  org: string
  env: string
  repo: string
  tag: string
  key: string
  entropy: string
}

export default class Registry extends cdk.Stack {

  public readonly id: string
  public readonly org: string
  public readonly env: string
  public readonly repo: string
  public readonly tag: string
  public readonly key: string
  public readonly entropy: string

  public readonly repository: ecr.Repository

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id)
    this.id = id
    this.org = props?.org ?? 'cto-ai'
    this.env = props?.env ?? 'dev'
    this.key = props?.key ?? 'aws-eks-ec2-asg'
    this.repo = props?.repo ?? 'sample-expressjs-app'
    this.tag = props?.tag ?? 'main'
    this.entropy = props?.entropy ?? '01012022'

    const repository = new ecr.Repository(this, `${this.repo}-${this.key}`, {
      repositoryName: `${this.repo}-${this.key}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    })

    this.repository = repository
    new cdk.CfnOutput(this, `${this.id}Registry`, { value: repository.repositoryUri })
  }
}

