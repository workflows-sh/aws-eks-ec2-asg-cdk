import fs from 'fs'
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
  
  sdk.log(`\n📦 Setting up the ${ux.colors.white(STACK_TYPE)} ${ux.colors.white(STACK_ENV)} stack for ${ux.colors.white(STACK_TEAM)} team...`)
  await exec(`./node_modules/.bin/cdk bootstrap`, { env: process.env })

  try {

    console.log(`\n🛰  Attempting to bootstrap ${ux.colors.white(STACK_ENV)} state...`)
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

  } catch (e) {
    console.log(`⚠️  Could not boostrap ${ux.colors.white(STACK_ENV)} state. Proceeding with setup...`)
  }

  await exec(`./node_modules/.bin/cdk deploy ${STACKS[STACK_ENV].join(' ')} --outputs-file outputs.json`, {
    env: { 
      ...process.env, 
      STACK_ENV: STACK_ENV,
      STACK_TYPE: STACK_TYPE, 
      STACK_REPO: STACK_REPO, 
      STACK_TAG: STACK_TAG
    }
  })
  // Get the AWS command to retrieve kube config
  .then(async () => {

    try {

      const json = await fs.readFileSync('./outputs.json', 'utf8')
      const outputs = JSON.parse(json)
      // console.log(outputs)

      const STATE_KEY = `${STACK_ENV}-${STACK_TYPE}`
      const cmd = Object.keys(outputs[STATE_KEY])
        .find((k) => { return k.indexOf('ConfigCommand') > -1 })
      const cluster = Object.keys(outputs[STATE_KEY])
        .find((k) => { return k.indexOf('ClusterArn') > -1 })

      console.log(`\n🔒 Configuring a secure connection with ${ux.colors.white(cluster || 'cluster')}:`)
      const aws = await exec(outputs[STATE_KEY][cmd!], process.env)
        .catch(err => { throw err })

      console.log(`${ux.colors.white('⚠️  Run this command to setup your Kuberenetes configuration locally:')}`)
      console.log(ux.colors.green(outputs[STATE_KEY][cmd!]))

      const config = await pexec('cat ~/.kube/config')
      // console.log(config.stdout)
      
      console.log(`\n⚡️ Confirming connection to ${ux.colors.white(cluster || 'cluster')}:`)
      await exec('kubectl get nodes')
        .catch(err => console.log(err))

      const CONFIG_KEY = `${STACK_ENV}_${STACK_TYPE}_STATE`.toUpperCase().replace(/-/g,'_')
      if(!process.env[CONFIG_KEY]) {

        // install helm charts here

      }

      console.log(`\n🔒 Syncing infrastructure state with ${ux.colors.white(STACK_TEAM)} team...`)
      sdk.setConfig(CONFIG_KEY, JSON.stringify(outputs))
      console.log(`✅ Saved the following state in your ${ux.colors.white(STACK_TEAM)} config as ${ux.colors.white(CONFIG_KEY)}:`)
      console.log(outputs)

      console.log('\n🚀 Deploying a hello world application to cluster to finalize setup...')
      await exec('kubectl apply -f src/kubectl/hello-world/')
        .catch(err => console.log(err))

      console.log('\n✅ Deployed. Load Balancer is provisioning...')
      console.log(`👀 Check your ${ux.colors.white('AWS')} dashboard or Lens for status.`)
      console.log(`\n${ux.colors.italic.white('Happy Workflowing!')}\n`)


    } catch (e) {
      throw e
    }

  })
  .catch((err) => {
    console.log(err)
    process.exit(1)
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
