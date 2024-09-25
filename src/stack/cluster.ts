import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as eks from 'aws-cdk-lib/aws-eks'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import { KubectlV30Layer } from '@aws-cdk/lambda-layer-kubectl-v30';
import * as elasticache from './redis'
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling'
import { Construct } from 'constructs';

interface StackProps {
  org: string
  env: string
  repo: string
  tag: string
  key: string
  entropy: string
}

export default class Cluster extends cdk.Stack {

  public readonly id: string
  public readonly org: string
  public readonly env: string
  public readonly repo: string
  public readonly tag: string
  public readonly key: string
  public readonly entropy: string

  public readonly vpc: ec2.Vpc
  public readonly cluster: eks.Cluster
  public readonly db: rds.ServerlessCluster
  public readonly mq: sqs.Queue
  public readonly redis: Construct
  public readonly bastion: ec2.BastionHostLinux

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id)
    this.id = id
    this.org = props?.org ?? 'cto-ai'
    this.env = props?.env ?? 'dev'
    this.key = props?.key ?? 'aws-eks-stack'
    this.repo = props?.repo ?? 'sample-expressjs-app'
    this.tag = props?.tag ?? 'main'
    this.entropy = props?.entropy ?? '01012022'

    // todo @kc make AZ a StackProp
    const vpc = new ec2.Vpc(this, `${this.id}-vpc`, {
      cidr: '10.0.0.0/16',
      natGateways: 1,
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        }
      ],
    });

    const bastionSecurityGroup = new ec2.SecurityGroup(this, `${this.id}-bastion-sg`, {
      vpc: vpc,
      allowAllOutbound: true,
      description: `bastion security group for ${this.id} cluster`,
      securityGroupName: `${this.id}-bastion-sg`
    });
    bastionSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'SSH access');

    const bastion = new ec2.BastionHostLinux(this, `${this.id}-bastion`, {
      vpc: vpc,
      instanceName: `${this.id}-bastion`,
      securityGroup: bastionSecurityGroup,
      subnetSelection: {
        subnetType: ec2.SubnetType.PUBLIC
      }
    });

    const cluster = new eks.Cluster(this, `${this.id}-eks`, {
      vpc: vpc,
      defaultCapacity: 0,
      defaultCapacityInstance: ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.XLARGE),
      version: eks.KubernetesVersion.V1_30,
      kubectlLayer: new KubectlV30Layer(this, 'kubectl'),
      mastersRole: new iam.Role(this, 'MastersRole', { assumedBy: new iam.AccountRootPrincipal() })
    });

    const rootVolume: autoscaling.BlockDevice = {
      deviceName: '/dev/xvda', // define the root volume
      volume: autoscaling.BlockDeviceVolume.ebs(100), // override volume size
    };

    // IAM role for our EC2 worker nodes
    const workerRole = new iam.Role(this, `${this.id}-workers`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
    });

    const onDemandASG = new autoscaling.AutoScalingGroup(this, `${this.id}-asg`, {
      vpc: vpc,
      role: workerRole,
      minCapacity: 1,
      maxCapacity: 10,
      desiredCapacity: 1,
      blockDevices: [rootVolume],
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.XLARGE),
      machineImage: new eks.EksOptimizedImage({
        kubernetesVersion: '1.30',
        nodeType: eks.NodeType.STANDARD  // without this, incorrect SSM parameter for AMI is resolved
      }),
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate()
    });

    cluster.connectAutoScalingGroupCapacity(onDemandASG, {});

    const dbSecurityGroup = new ec2.SecurityGroup(this, `${this.id}-db-sg`, {
      vpc: vpc,
      allowAllOutbound: true,
      description: `db security group for ${this.id} db`,
      securityGroupName: `${this.id}-db-sg`
    });
    dbSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3306), 'MySQL access');

    const db = new rds.ServerlessCluster(this, `${this.id}-db`, {
      vpc: vpc,
      defaultDatabaseName: `${this.env}`,
      engine: rds.DatabaseClusterEngine.AURORA_MYSQL,
      scaling: { autoPause: cdk.Duration.seconds(0) },
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromGeneratedSecret('root')
    });

    const redis = new elasticache.Cluster(this, `${this.id}-redis`, { vpc: vpc });
    const mq = new sqs.Queue(this, `${this.id}-sqs`);

    this.vpc = vpc;
    this.cluster = cluster;
    this.bastion = bastion;
    this.redis = redis;
    this.db = db;
    this.mq = mq;

    new cdk.CfnOutput(this, `${this.id}VpcId`, { value: this.vpc.vpcId })
    new cdk.CfnOutput(this, `${this.id}ClusterArn`, { value: this.cluster.clusterArn })
    if (this.cluster.kubectlRole) {
      new cdk.CfnOutput(this, `${this.id}ClusterKubectlRoleArn`, { value: this.cluster.kubectlRole.roleArn })
    }
    const kubectlProvider = this.cluster.stack.node.tryFindChild('@aws-cdk--aws-eks.KubectlProvider') as eks.KubectlProvider;
    new cdk.CfnOutput(this, 'ClusterKubectlProviderHandlerRole', { value: kubectlProvider.handlerRole.roleArn });
    new cdk.CfnOutput(this, `${this.id}DbArn`, { value: this.db?.clusterArn })

  }
}

