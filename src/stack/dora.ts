import * as cdk from 'aws-cdk-lib';
import * as eks from 'aws-cdk-lib/aws-eks'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs';
import { Exec, pexec } from '../utils'
import * as yaml from 'js-yaml'

interface StackProps {}

export default class Dora extends cdk.Stack {
  public readonly id: string

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id)
    this.id = id
  }

  async initialize() {
    if (!process.env.CLUSTER_ARN) {
      console.log('Cluster name is not provided')
      return
    }

    if (!process.env.KUBECTL_ROLE_URN) {
      console.log('kubectl role is not provided')
      return
    }

    if (!process.env.KUBECTL_PROVIDER_ROLE_URN) {
      console.log('kubectl provider role is not provided')
      return
    }

    if (!process.env.DORA_REMOTE_REG_USERNAME || !process.env.DORA_REMOTE_REG_PASSWORD) {
      console.log('You must provide a image pull secret for dora controller')
      return
    }

    if (!process.env.DORA_AUTH_TEAM || !process.env.DORA_AUTH_TOKEN) {
      console.log('You must provide a dora team id and token for dora controller')
      return
    }

    if (!process.env.DORA_WRITER_REPO) {
      console.log('You must provide a cto.ai credentials to push dora metrics')
      return
    }

    if (!process.env.DORA_CONTROLLER_RELEASE_TAG || !process.env.DORA_CONTROLLER_REPO) {
      console.log('You must provide a dora controller release tag and repo')
    }

    if (!process.env.DORA_WRITER_RELEASE_TAG || !process.env.DORA_WRITER_REPO) {
      console.log('You must provide a dora writer release tag and repo')
      return
    }

    const doraControllerReleaseTag = process.env.DORA_CONTROLLER_RELEASE_TAG
    const doraControllerRepo = process.env.DORA_CONTROLLER_REPO
    const doraWriterReleaseTag = process.env.DORA_WRITER_RELEASE_TAG
    const doraWriterRepo = process.env.DORA_WRITER_REPO

    const clusterArn = process.env.CLUSTER_ARN
    const clusterName = clusterArn.split('/')[1]
  
    const cluster = eks.Cluster.fromClusterAttributes(this, 'dora-controller-cluster', {
      clusterName: clusterName,
      kubectlRoleArn: process.env.KUBECTL_ROLE_URN,
      kubectlLambdaRole: iam.Role.fromRoleArn(this, 'kubectlLambdaRole', process.env.KUBECTL_PROVIDER_ROLE_URN)
    })

    // install dora controller
    const ghAuthCmd = `echo ${process.env.DORA_REMOTE_REG_PASSWORD} | gh auth login --with-token`
    await Exec(ghAuthCmd)
      .catch(err => { throw err })

    const namespace = 'dora-controller-system'
    const secretName = `${this.id}-image-secret`

    const doraCtlYmlCmd = `gh release download ${doraControllerReleaseTag} -R ${doraControllerRepo} -p 'install.yaml' -O -`
    const doraCtlManifests = await this.getYaml(doraCtlYmlCmd, namespace)
      .catch(err => { throw err })
    if (doraCtlManifests === undefined) {
      throw new Error('can not get dora controller manifest')
    }
    const doraCtl = cluster.addManifest(`${this.id}-dora-controller`,
      ...(this.setDeployImgSecret(doraCtlManifests, 'dora-controller-manager', secretName)))

    // add image pull secret to cluster
    const imgPullSecretYmlCmd = `kubectl create secret docker-registry ${secretName} --docker-username=${process.env.DORA_REMOTE_REG_USERNAME} --docker-password=${process.env.DORA_REMOTE_REG_PASSWORD} --docker-server=ghcr.io -n ${namespace} --dry-run=client -o yaml`
    const imgPullSecretManifest = await this.getYaml(imgPullSecretYmlCmd, namespace)
      .catch(err => { throw err })
    if (imgPullSecretManifest === undefined) {
      throw new Error('can not get dora image pull secret manifest')
    }
    const imgPullSecret = cluster.addManifest(`${this.id}-dora-controller-image-pull-secret`, ...imgPullSecretManifest)
    imgPullSecret.node.addDependency(doraCtl)

    // install dora metric writer
    const doraWriterSecretYmlCmd = `kubectl create secret generic cto-client-auth --from-literal=AUTH_TEAM=${process.env.DORA_AUTH_TEAM} --from-literal=AUTH_TOKEN=${process.env.DORA_AUTH_TOKEN} -n ${namespace} --dry-run=client -o yaml`
    const doraWriterSecretManifest = await this.getYaml(doraWriterSecretYmlCmd, namespace)
      .catch(err => { throw err })
    if (doraWriterSecretManifest === undefined) {
      throw new Error('can not get dora writer secret manifest')
    }
    const doraWriterSecret = cluster.addManifest(`${this.id}-dora-writer-image-secret`, ...doraWriterSecretManifest)
    doraWriterSecret.node.addDependency(doraCtl)

    const doraWriterApplyCmd = `gh release download ${doraWriterReleaseTag} -R ${doraWriterRepo} -p 'install.yaml' -O -`
    const doraWriterManifests = await this.getYaml(doraWriterApplyCmd, namespace)
      .catch(err => { throw err })
    if (doraWriterManifests === undefined) {
      throw new Error('can not get dora writer manifest')
    }
    const doraWriter = cluster.addManifest(`${this.id}-dora-writer`, ...(this.setDeployImgSecret(doraWriterManifests, 'workflows-sh-dora-writer', secretName)))
    doraWriter.node.addDependency(doraCtl)
    doraWriter.node.addDependency(doraWriterSecret)
  }

  private async getYaml(ymlCmd: string, namespace: string): Promise<[Record<string, any>] | undefined> {
    try {
      const ymlCmdRes = await pexec(ymlCmd)
      const yml = ymlCmdRes.stdout

      const manifests = yaml.loadAll(yml) as [Record<string, any>];
      for (let manifest of manifests) {
        manifest['metadata']['namespace'] = namespace
      }
      return Promise.resolve(manifests)
    } catch (err) {
      return Promise.reject(err)
    }
  }

  private setDeployImgSecret(manifests: [Record<string, any>], deploymentName: string, imagePullSecretName: string): [Record<string, any>] {
    for (let manifest of manifests) {
      if (manifest['kind'] == 'Deployment' && manifest['metadata']['name'] == deploymentName) {
        manifest['spec']['template']['spec']['imagePullSecrets'] = [
          {
            name: imagePullSecretName
          }
        ]
      }
    }
    return manifests
  }
}