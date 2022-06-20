
![aws-eks-ec2](https://user-images.githubusercontent.com/24816990/174409888-488bb9b1-a200-4afd-aeb3-320680f49274.svg)


# Overview

This repo includes a complete repo with the PaaS workflow with GitOps / ChatOps features that supports EKS on EC2, Aurora, SQS, Redis, Autoscaling via CDK. 

---
## Table of contents

- [Overview](#overview)
  - [Table of contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Demo](#demo)
  - [Latest Version](#latest-version)
  - [Getting Started](#getting-started)
    - [Set Up your Account on CTO.ai](#set-up-your-account-on-ctoai)
    - [Create Secrets from Settings](#create-secrets-from-settings)
  - [Usage](#usage)
    - [Build and Run Pipelines](#build-and-run-pipelines)
    - [Run and Setup your Infrastructure](#run-and-setup-your-infrastructure)
    - [View changes on CloudFormation](#view-changes-on-cloudformation)
    - [View EC2 instances on AWS](#view-ec2-instances-on-aws)
    - [View Elastic Kubernetes Service Cluster](#view-elastic-kubernetes-service-cluster)
    - [View Auto Scaling groups](#view-auto-scaling-groups)
  - [Getting help](#getting-help)
  - [Reporting bugs and Contributing](#reporting-bugs-and-contributing)
  - [Learn more](#learn-more)
  - [Other questions?](#other-questions)
  - [License](#license)

---

## Prerequisites

- [A local NodeJS programming environment and Workflow CLI installed on your machine](https://cto.ai/docs/install-cli)
- [An AWS Personal Access key and Secret Key, which you can create via the AWS Console](https://cto.ai/docs/aws-ecs-fargate#create-secrets-from-settings)
- [Docker](https://docs.docker.com/get-docker/), [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html), and [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed on your machine.
- [NVM Installed](https://github.com/nvm-sh/nvm)

---

## Demo 

You can run and deploy the AWS-ECS-Fargate Workflow directly on our [Platform](https://cto.ai/), kindly follow the steps below to get started 🚀

## Latest Version 

The AWS EC2 Auto Scaling group Workflow is running on the latest version


## Getting Started 

```
git clone https://github.com/workflows-sh/aws-eks-ec2-asg.git

cd aws-eks-ec2-asg
```

### Set Up your Account on CTO.ai

Before you can deploy this Workflow, you need to [Setup your account on CTO.ai](https://cto.ai/docs/setup-flow)

### Create Secrets from Settings 

Secrets are encrypted environment variables that CTO.ai utilizes within your workflow to build and run your application and deployments. [Follow this guide to create secrets from settings.](https://cto.ai/docs/aws-eks-ec2#create-secret-from-settings), and also [generate your Github token](https://cto.ai/docs/aws-eks-ec2#generate-github-token)

---

## Usage 

Follow the following steps below to configure and deploy your AWS EC2-Elastic Kubernetes Service Workflow

### Build and Run Pipelines 

- [Build Pipelines locally with the Workflow CLI](https://cto.ai/docs/aws-eks-ec2#build-pipelines-locally-with-the-ctoai-cli)


- [Run Pipelines locally with the Workflow CLI](https://cto.ai/docs/aws-eks-ec2#run-pipelines-locally-with-the-ctoai-cli)


### Run and Setup your Infrastructure

In your AWS EKS EC2 workflow, [build and set up your infrastructure using the `ops run -b .` command. This will provision your AWS-EKS EC2 stacks using Cloud Formation](https://cto.ai/docs/aws-eks-ec2#run-and-setup-your-infrastructure)

### View changes on CloudFormation 

- [Get a detailed overview of your entire Stack on CloudFormation](https://cto.ai/docs/aws-eks-ec2#view-changes-on-aws-cloudformation)



### View EC2 instances on AWS 

Get insights to your EC2 instances on AWS. [View EC2 instances on AWS](https://cto.ai/docs/aws-eks-ec2#view-ec2-instances-on-aws)


### View Elastic Kubernetes Service Cluster

See your [EKS Cluster resources, deployments, and authentication](https://cto.ai/docs/aws-eks-ec2#view-elastic-kubernetes-service-cluster)



### View Auto Scaling groups

Schedule the scaling [actions that proactively increases and decreases capacity to match the load forecast](https://cto.ai/docs/aws-eks-ec2#view-auto-scaling-groups)


---

## Getting help 

CTO.ai AWS-EC2-ASG Workflow is an open-source project and is supported by the community. 

Learn more about CTO.ai community support channels [here](https://cto.ai/community)

- Slack: https://cto.ai/community


## Reporting bugs and Contributing 

Feel free to submit PRs or to fill issues. Every kind of help is appreciated.

Kindly check our [Contributing guide](https://github.com/workflows-sh/aws-eks-ec2-asg/blob/main/Contributing.md) on how to propose bugfixes and improvements, and submitting pull requests to the project.


- View issues related to this image in our [GitHub repository issues tracker](https://github.com/workflows-sh/aws-eks-ec2-asg/issues)


## Learn more 

- Read the manual on our [Docs](https://cto.ai/docs/aws-eks-ec2)

---

## Other questions?

Check out our [FAQ](https://cto.ai/docs/faq), send us an [email](https://cto.ai/docs/contact-support), or open an issue with your question. We'd love to hear from you!


## License 

&copy; CTO.ai, Inc., 2022

Distributed under MIT License (`The MIT License`).

See [LICENSE](License) for more information.