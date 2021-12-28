import * as cdk from '@aws-cdk/core';
import Cluster from './cluster'
import Service from './service'
import Registry from './registry'
//import RDS from '../stacks/rds'
import * as rds from '@aws-cdk/aws-rds';

interface StackProps {
  repo: string,
  tag: string,
  key: string
}

export class Stack{
  public readonly repo: string
  public readonly tag: string
  public readonly key: string
  constructor(props?: StackProps) {
    this.repo = props?.repo ?? 'sample-app'
    this.tag = props?.tag ?? 'main'
    this.key = props?.key ?? 'eks'
  }
  async initialize() {
    // setup app
    const app = new cdk.App();

    // create a shared ECR Registry
    const registry = new Registry(app, `${this.repo}`, {
      repo: this.repo
    })

    // create each vpc, cluster & db
    const dev = new Cluster(app, `dev-${this.key}`, {
      repo: this.repo,
      tag: this.tag
    }); 
    const stg = new Cluster(app, `stg-${this.key}`, {
      repo: this.repo,
      tag: this.tag
    }); 
    const prd = new Cluster(app, `prd-${this.key}`, {
      repo: this.repo,
      tag: this.tag
    }); 
    // instantiate a service in dev cluster
    const devService = new Service(app, `dev-${this.repo}-${this.key}`, {
      repo: this.repo,
      tag: this.tag,
      db: dev.db,
      cluster: dev.cluster,
      redis: dev.redis,
      mq: dev.mq,
      registry: registry.repo,
    })
    await devService.initialize()
    // instantiate a service in stg cluster
    const stgService = new Service(app, `stg-${this.repo}-${this.key}`, {
      repo: this.repo,
      tag: this.tag,
      db: stg.db,
      cluster: stg.cluster,
      redis: stg.redis,
      mq: stg.mq,
      registry: registry.repo
    })
    await stgService.initialize()
    // instantiate a service in prd cluster
    const prdService = new Service(app, `prd-${this.repo}-${this.key}`,{
      repo: this.repo,
      tag: this.tag,
      db: prd.db,
      cluster: prd.cluster,
      redis: prd.redis,
      mq: prd.mq,
      registry: registry.repo
    })
    await prdService.initialize()
  }
}

export default Stack
