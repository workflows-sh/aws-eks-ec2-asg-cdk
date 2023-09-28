
![aws-eks-ec2](https://user-images.githubusercontent.com/24816990/174409888-488bb9b1-a200-4afd-aeb3-320680f49274.svg)

# Workflow Stack: AWS-EKS-EC2-ASG-CDK via CTO.ai

This repo contains a complete, functional PaaS workflow with integrated GitOps and ChatOps features. Designed for deployment to AWS infrastructure, this workflow supports EKS on EC2, Aurora, SQS, Redis, and Autoscaling—all orchestrated by CDK.

<!-- ---

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
  - [License](#license) -->

## Prerequisites

- [A local NodeJS programming environment and Workflow CLI installed on your machine](https://cto.ai/docs/install-cli)
- [An AWS Personal Access key and Secret Key, which you can create via the AWS Console](https://cto.ai/docs/aws-ecs-fargate#create-secrets-from-settings)
- [Docker](https://docs.docker.com/get-docker/), [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html), and [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed on your machine.
- [NVM Installed](https://github.com/nvm-sh/nvm)

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

### View Auto Scaling groups

Schedule the scaling [actions that proactively increases and decreases capacity to match the load forecast](https://cto.ai/docs/aws-eks-ec2#view-auto-scaling-groups)

## Usage

The following steps describe key features of this workflow and how to interact with them.

## Support and Community

### Getting help

This `aws-eks-ec2-asg` workflow, built for the CTO.ai platform, is an open-source project and is supported by the community. Our documentation also contains a guide for [using this workflow](https://cto.ai/docs/aws-eks-ec2-asg). If these resources are unable to lead you to the answers you need, please feel free to [open an issue](https://github.com/workflows-sh/aws-eks-ec2-asg-cdk/issues) on this repository describing the question or problem you're facing.

If you need further help using the our platform, the [Contact Us](https://cto.ai/docs/contact-us) page in our docs lists our current support channels and contact information. We'd love to hear from you!

### Contributing

If you've encountered a bug, have a suggestion for improving this stack, or would like to contribute to this project, we'd love to hear from you! Feel free to open an issue or [submit a Pull Request](https://github.com/workflows-sh/aws-eks-ec2-asg-cdk/pulls) to this project. Before contributing, please refer to our [Contributing](Contributing.md) guide to understand our standards and processes.

## License

Copyright &copy; 2022-2023, Hack Capital Ventures Inc. *d/b/a* CTO.ai

Distributed under the MIT License. See [LICENSE](License) for more information.
