import { ux } from '@cto.ai/sdk';
import { execSync } from 'child_process';
import { stackEnvPrompt, stackRepoPrompt, stackTagPrompt } from './prompts';
import { Exec, pexec, Sleep } from './utils'

async function run() {

  const STACK_TYPE = process.env.STACK_TYPE || 'aws-eks-ec2-asg';
  const STACK_TEAM = process.env.OPS_TEAM_NAME || 'private'

  const { SRV_TYPE } = await ux.prompt<{
    SRV_TYPE: string
  }>({
    type: 'list',
    name: 'SRV_TYPE',
    choices: ['app', 'util'],
    default: 'app',
    message: 'Which type of application?'
  })

  const doraController = 'dora-controller'
  let UTIL_NAME: string = '';
  let STACK_REPO: string = '';
  let STACK_TAG: string = ''
  if (SRV_TYPE === "util") {
    ({ UTIL_NAME } = await ux.prompt<{
      UTIL_NAME: string
    }>({
      type: 'list',
      name: 'UTIL_NAME',
      choices: [doraController],
      default: doraController,
      message: 'Select the Service to install'
    }))
  }

  const isApp = (SRV_TYPE === "util") ? false : true;
  const { STACK_ENV } = await stackEnvPrompt()

  if (isApp) {
    ({ STACK_REPO } = await stackRepoPrompt())

    const ecrRepoName: string = `${STACK_REPO}-${STACK_TYPE}`

    // Validate if the AWS Creds are set.
    try {
      const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

      if (accessKeyId && secretAccessKey) {
        console.log('AWS credentials are set.');
        // Proceed with the rest of the deployment logic
      } else {
        console.log('AWS credentials are not set.');
        return;
      }
    } catch (error) {
      console.error('Invalid credentials:', error);
      return;
    }

    await ux.print(`\n🛠 Loading the latest tags for ${ux.colors.green(STACK_TYPE)} environment and ${ux.colors.green(STACK_REPO)} service...`)

    // TODO: Write function to return currently running image name and display it to the user.
    //
    // async function retrieveCurrentlyDeployedImage(env: string, service: string): Promise<string> {
    //   return ""
    // }
    // const currentImage = await retrieveCurrentlyDeployedImage(STACK_ENV, STACK_REPO)
    // await ux.print(`\n🖼️  Currently deployed image - ${ux.colors.green(currentImage)}\n`)

    const ecrImages: string[] = JSON.parse(execSync(
      `aws ecr describe-images --region=$AWS_REGION --repository-name ${ecrRepoName} --query "reverse(sort_by(imageDetails,& imagePushedAt))[*].imageTags[0]"`,
      {
        env: process.env
      }
    ).toString().trim()) || []


    const defaultImage = ecrImages.length ? ecrImages[0] : undefined
    const imageTagLimit = 20

    const { STACK_TAG_CUSTOM } = await ux.prompt<{
      STACK_TAG_CUSTOM: boolean
    }>({
      type: 'confirm',
      name: 'STACK_TAG_CUSTOM',
      default: false,
      message: 'Do you want to deploy a custom image?'
    });

    if (STACK_TAG_CUSTOM) {
      ({ STACK_TAG } = await ux.prompt<{
        STACK_TAG: string
      }>({
        type: 'input',
        name: 'STACK_TAG',
        message: 'What is the name of the tag or branch?',
        allowEmpty: false
      }))
    } else {
      ({ STACK_TAG } = await stackTagPrompt(
        ecrImages.slice(0, ecrImages.length < imageTagLimit ? ecrImages.length : imageTagLimit),
        defaultImage
      ))
    }
  }

  await ux.print(`\n🛠 Loading the ${ux.colors.white(STACK_TYPE)} stack for the ${ux.colors.white(STACK_TEAM)}...\n`)
  let STACKS: any = {
    'dev': [`${STACK_REPO}-${STACK_TYPE}`, `${STACK_ENV}-${STACK_TYPE}`, `${STACK_ENV}-${STACK_REPO}-${STACK_TYPE}`],
    'stg': [`${STACK_REPO}-${STACK_TYPE}`, `${STACK_ENV}-${STACK_TYPE}`, `${STACK_ENV}-${STACK_REPO}-${STACK_TYPE}`],
    'prd': [`${STACK_REPO}-${STACK_TYPE}`, `${STACK_ENV}-${STACK_TYPE}`, `${STACK_ENV}-${STACK_REPO}-${STACK_TYPE}`],
    'all': [
      `${STACK_REPO}-${STACK_TYPE}`,

      `dev-${STACK_TYPE}`,
      `stg-${STACK_TYPE}`,
      `prd-${STACK_TYPE}`,

      `dev-${STACK_REPO}-${STACK_TYPE}`,
      `stg-${STACK_REPO}-${STACK_TYPE}`,
      `prd-${STACK_REPO}-${STACK_TYPE}`
    ]
  }

  if (!isApp) {
    STACKS[STACK_ENV] = [`${STACK_ENV}-${UTIL_NAME}-${STACK_TYPE}`]
  }

  if (!STACKS[STACK_ENV].length) {
    return console.log('Please try again with environment set to <dev|stg|prd|all>')
  }

  let deployMsg = `📦 Deploying ${ux.colors.white(STACK_REPO)}:${ux.colors.white(STACK_TAG)} to ${ux.colors.white(STACK_ENV)} cluster`
  if (!isApp) {
    deployMsg = `📦 Deploying ${ux.colors.white(UTIL_NAME)} to ${ux.colors.white(STACK_ENV)} cluster`
  }
  console.log('')
  await ux.print(deployMsg)
  console.log('')

  const STATE_PREFIX = `${STACK_ENV}_${STACK_TYPE}`.replace(/-/g, '_').toUpperCase()
  const BOOT_STATE_KEY = `${STACK_ENV}-${STACK_TYPE}`
  const BOOT_STATE = process?.env[`${STATE_PREFIX}_STATE`] || ''
  const BOOT_CONFIG = JSON.parse(BOOT_STATE)

  const bootStateKeys = Object.keys(BOOT_CONFIG[BOOT_STATE_KEY!])
  const cmd = bootStateKeys
    .find((k) => { return k.indexOf('ConfigCommand') > -1 })

  console.log(`\n🔐 Configuring access to ${ux.colors.white(STACK_ENV)} cluster`)
  await Exec(BOOT_CONFIG[BOOT_STATE_KEY!][cmd!], process.env)
    .catch(err => { throw err })

  console.log(`\n⚡️ Confirming connection to ${ux.colors.white(STACK_ENV)} cluster:`)
  await Exec('kubectl get nodes')
    .catch(err => { throw err })

  const getKubeConfig = await pexec('cat ~/.kube/config')
  process.env.KUBE_CONFIG = getKubeConfig.stdout;

  const clusterArnKey = bootStateKeys
    .find((k) => { return k.indexOf('ClusterArn') > -1 })
  process.env.CLUSTER_ARN = BOOT_CONFIG[BOOT_STATE_KEY!][clusterArnKey!]

  const kubectlRoleArnKey = bootStateKeys
    .find((k) => { return k.indexOf('ClusterKubectlRoleArn') > -1 })
  process.env.KUBECTL_ROLE_URN = BOOT_CONFIG[BOOT_STATE_KEY!][kubectlRoleArnKey!]

  const kubectlProviderRoleArnKey = bootStateKeys
    .find((k) => { return k.indexOf('ClusterKubectlProviderHandlerRole') > -1 })
  process.env.KUBECTL_PROVIDER_ROLE_URN = BOOT_CONFIG[BOOT_STATE_KEY!][kubectlProviderRoleArnKey!]
  
  await Exec(`./node_modules/.bin/cdk deploy ${STACKS[STACK_ENV].join(' ')}`, {
    env: {
      ...process.env,
      STACK_TYPE: STACK_TYPE,
      STACK_ENV: STACK_ENV,
      STACK_REPO: STACK_REPO,
      STACK_TAG: STACK_TAG
    }
  }).then(async () => {
    if (!isApp) {
      console.log('\n Waiting for 10 seconds...')
      await Sleep(10000)
      await Exec('kubectl get ns')
        .catch(err => { throw err })
      console.log(`\n⚡️ Check Dora Controller Resources:`)
      await Exec('kubectl get pods -n dora-controller-system')
        .catch(err => { throw err })
    }
  })
    .catch((err) => {
      if (!isApp) {
        ux.print(`⚠️  The Dora Controller failed to deploy successfully and will automatically rollback.`)
      } else {
        ux.print(`⚠️  The deployment failed to complete successfully and will automatically rollback.`)
      }
      console.log(err)
      process.exit(1)

    })

}


run()
