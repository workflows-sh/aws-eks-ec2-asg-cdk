import { ux, sdk } from '@cto.ai/sdk';
import { Exec, pexec, Sleep } from './utils'

async function run() {

  const STACK_TYPE = process.env.STACK_TYPE || 'aws-eks-stack';

  const { STACK_ENV } = await ux.prompt<{
    STACK_ENV: string
  }>({
    type: 'list',
    name: 'STACK_ENV',
    default: 'dev',
    message: 'What is the name of the environment?',
    choices: ['dev', 'stg', 'prd', 'all']
  })

  const doraController = 'dora-controller'
  const { OPERATION } = await ux.prompt<{
    OPERATION: string,
  }>({
    type: 'list',
    name: 'OPERATION',
    default: doraController,
    choices: [doraController, 'cluster'],
    message: 'Do you want to destroy cluster or a service?'
  })

  sdk.log(`⚠️  Destroying ${OPERATION} stack...`)

  let STACK_REPO = 'cluster'

  if (OPERATION === 'cluster') {
    ({ STACK_REPO } = await ux.prompt<{
      STACK_REPO: string
    }>({
      type: 'input',
      name: 'STACK_REPO',
      default: 'sample-expressjs-app',
      message: 'What is the name of the application repo?'
    }))
  }

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

  if (OPERATION === "dora-controller") {
    STACKS[STACK_ENV] = [`${STACK_ENV}-${OPERATION}-${STACK_TYPE}`]
  }

  if (!STACKS[STACK_ENV].length) {
    return console.log('Please try again with environment set to <dev|stg|prd|all>')
  }

  sdk.log(`📦 Setting up the stack`)
  if (OPERATION === doraController) {
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
    await Exec('kubectl get ns')
      .catch(err => { throw err })

    const clusterArnKey = bootStateKeys
      .find((k) => { return k.indexOf('ClusterArn') > -1 })
    process.env.CLUSTER_ARN = BOOT_CONFIG[BOOT_STATE_KEY!][clusterArnKey!]

    const kubectlRoleArnKey = bootStateKeys
      .find((k) => { return k.indexOf('ClusterKubectlRoleArn') > -1 })
    process.env.KUBECTL_ROLE_URN = BOOT_CONFIG[BOOT_STATE_KEY!][kubectlRoleArnKey!]

    const kubectlProviderRoleArnKey = bootStateKeys
      .find((k) => { return k.indexOf('ClusterKubectlProviderHandlerRole') > -1 })
    process.env.KUBECTL_PROVIDER_ROLE_URN = BOOT_CONFIG[BOOT_STATE_KEY!][kubectlProviderRoleArnKey!]
  }

  await Exec(`./node_modules/.bin/cdk destroy -f -e true ${STACKS[STACK_ENV].reverse().join(' ')}`, {
    env: {
      ...process.env,
      STACK_TYPE: STACK_TYPE,
      STACK_ENV: STACK_ENV,
      STACK_REPO: STACK_REPO,
      STACK_TAG: 'main'
    }
  }).then(async () => {
    if (OPERATION === doraController) {
      console.log('\n Waiting for 10 seconds...')
      await Sleep(10000)
      console.log(`\n⚡️ Dora Controller Namespace Should not exist:`)
      await Exec('kubectl get ns')
        .catch(err => { throw err })
    }
  })
    .catch(err => { throw err })
}

run()
