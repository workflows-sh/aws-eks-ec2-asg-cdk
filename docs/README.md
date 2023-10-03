![aws-eks-ec2 Banner Image](https://raw.githubusercontent.com/wiki/workflows-sh/aws-eks-ec2-asg-cdk/_assets/banner.svg)

## AWS-EKS-EC2-ASG-CDK Workflow Stack Documentation

This repo contains a complete, functional PaaS workflow with integrated GitOps and ChatOps features. Designed for deployment to AWS infrastructure, this workflow supports EKS on EC2, Aurora, SQS, Redis, and Autoscaling—all orchestrated by CDK.

## Prerequisites

### Add environment variables to Secrets Store

> Resource: [Using Secrets and Configs via Dashboard](https://cto.ai/docs/secrets-and-configs-dashboard)

Create new environment variables via your Secrets Store on the CTO.ai Dashboard, one for each of the following keys:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ACCOUNT_NUMBER`
- `GITHUB_TOKEN`

This wiki has more information on [generating your AWS and GitHub credentials](https://github.com/workflows-sh/aws-eks-ec2-asg-cdk/wiki/Generating-access-tokens).

### Install the repo locally

Clone the GitHub repository for this workflow stack locally, then change in to the directory:

```bash
git clone https://github.com/workflows-sh/aws-eks-ec2-asg-cdk.git
cd aws-eks-ec2-asg-cdk
```

## Usage

### Build Pipelines locally with CTO.ai CLI

Run the following CLI command to build the repo's Pipelines workflow locally:

```bash
ops build .
```

Then, when prompted, select the `sample-app-pipeline` workflow from the list. This will build the workflow locally (for use or sharing) and build the workflow's Docker image from its `Dockerfile`.

The resulting Docker image will be tagged with the name and version specified in the workflow's `ops.yml` file.

### Run Pipelines locally with CTO.ai CLI

Run the following CLI command to run the repo's Pipelines workflow locally:

```bash
ops run .
```

Then, when prompted, select the `sample-app-pipeline` workflow from the list. This will run the workflow locally, using the Docker image built in the previous step.
