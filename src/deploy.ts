import util from 'util';
import { ux, sdk } from '@cto.ai/sdk';
import { exec as oexec } from 'child_process';
const pexec = util.promisify(oexec);

async function run() {

  const STACK_TYPE = process.env.STACK_TYPE || 'aws-eks-ec2-asg';
  const STACK_TEAM = process.env.OPS_TEAM_NAME || 'private'

  sdk.log(`🛠  Loading the ${ux.colors.white(STACK_TYPE)} stack for the ${ux.colors.white(STACK_TEAM)}...`)

  const { STACK_ENV } = await ux.prompt<{
    STACK_ENV: string
  }>({
      type: 'input',
      name: 'STACK_ENV',
      default: 'dev',
      message: 'What is the name of the environment?'
    })

  const { STACK_REPO } = await ux.prompt<{
    STACK_REPO: string
  }>({
      type: 'input',
      name: 'STACK_REPO',
      default: 'sample-app',
      message: 'What is the name of the application repo?'
    })

  const { STACK_TAG } = await ux.prompt<{
    STACK_TAG: string
  }>({
      type: 'input',
      name: 'STACK_TAG',
      default: 'main',
      message: 'What is the name of the tag or branch?'
    })

  const STACKS:any = {
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

  if(!STACKS[STACK_ENV].length) {
    return console.log('Please try again with environment set to <dev|stg|prd|all>')
  }

  console.log('')
  await ux.print(`📦 Deploying ${ux.colors.white(STACK_REPO)}:${ux.colors.white(STACK_TAG)} to ${ux.colors.white(STACK_ENV)} cluster`)
  console.log('')

  const STATE_PREFIX = `${STACK_ENV}_${STACK_TYPE}`.replace(/-/g, '_').toUpperCase()
  const BOOT_STATE_KEY = `${STACK_ENV}-${STACK_TYPE}`
  const BOOT_STATE = process?.env[`${STATE_PREFIX}_STATE`] || ''
  const BOOT_CONFIG = JSON.parse(BOOT_STATE)

  const cmd = Object.keys(BOOT_CONFIG[BOOT_STATE_KEY!])
    .find((k) => { return k.indexOf('ConfigCommand') > -1 })

  console.log(`\n🔐 Configuring access to ${ux.colors.white(STACK_ENV)} cluster`)
  await exec(BOOT_CONFIG[BOOT_STATE_KEY!][cmd!], process.env)
    .catch(err => { throw err })

  console.log(`\n⚡️ Confirming connection to ${ux.colors.white(STACK_ENV)} cluster:`)
  await exec('kubectl get nodes')
    .catch(err => { throw err })

  const getKubeConfig = await pexec('cat ~/.kube/config')
  process.env.KUBE_CONFIG = getKubeConfig.stdout;

  await exec(`npm run cdk deploy ${STACKS[STACK_ENV].join(' ')}`, {
    env: { 
      ...process.env, 
      STACK_TYPE: STACK_TYPE, 
      STACK_ENV: STACK_ENV, 
      STACK_REPO: STACK_REPO, 
      STACK_TAG: STACK_TAG
    }
  }).catch((err) => {
    ux.print(`⚠️  The deployment failed to complete successfully and will automatically rollback.`)
    process.exit(1)

  })

  sdk.track([], {
    event_name: 'deployment',
    event_action: 'succeeded',
    environment: STACK_ENV,
    repo: STACK_REPO,
    branch: STACK_TAG,
    commit: STACK_TAG,
    image: STACK_TAG
  })
}

// custom promisify exec that pipes stdout too
async function exec(cmd, env?: any | null) {
  return new Promise(function(resolve, reject) {
    const child = oexec(cmd, env)
    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)
    child.on('close', (code) => { code ? reject(child.stderr) : resolve(child.stdout) })
  })
}

run()
