import fs from 'fs'
import util from 'util';
import { ux, sdk } from '@cto.ai/sdk';
import { exec as oexec } from 'child_process';
const pexec = util.promisify(oexec);

async function run() {

  const STACK_TYPE = process.env.STACK_TYPE || 'aws-eks-ec2-asg';
  const STACK_TEAM = process.env.OPS_TEAM_NAME || 'private'

  sdk.log(`🛠 Loading up ${STACK_TYPE} stack...`)
  
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
    'dev': [`${STACK_REPO}`, `${STACK_ENV}-${STACK_TYPE}`, `${STACK_ENV}-${STACK_REPO}-${STACK_TYPE}`],
    'stg': [`${STACK_REPO}`, `${STACK_ENV}-${STACK_TYPE}`, `${STACK_ENV}-${STACK_REPO}-${STACK_TYPE}`],
    'prd': [`${STACK_REPO}`, `${STACK_ENV}-${STACK_TYPE}`, `${STACK_ENV}-${STACK_REPO}-${STACK_TYPE}`],
    'all': [
      `${STACK_REPO}`,
      'dev', 'stg', 'prd',
      `dev-${STACK_REPO}`,
      `stg-${STACK_REPO}`,
      `stg-${STACK_REPO}`
    ]
  }

  if(!STACKS[STACK_ENV].length) {
    return console.log('Please try again with environment set to <dev|stg|prd|all>')
  }
  
  sdk.log(`\n📦 Setting up the ${ux.colors.white(STACK_TYPE)} ${ux.colors.white(STACK_ENV)} stack for ${ux.colors.white(STACK_TEAM)} team...`)
  await exec(`./node_modules/.bin/cdk bootstrap`, { env: process.env })

  const deploy = await exec(`./node_modules/.bin/cdk deploy ${STACKS[STACK_ENV].join(' ')} --outputs-file outputs.json`, {
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

      const CONFIG_KEY = `${STACK_ENV}_${STACK_TYPE}_STATE`.toUpperCase().replace(/-/g,'_')
      sdk.setConfig(CONFIG_KEY, JSON.stringify(outputs))

      const STATE_KEY = `${STACK_ENV}-${STACK_TYPE}`
      const cmd = Object.keys(outputs[STATE_KEY])
        .find((k) => { return k.indexOf('ConfigCommand') > -1 })

      console.log('Running: ', outputs[STATE_KEY][cmd!])
      const aws = await exec(outputs[STATE_KEY][cmd!], process.env)
        .catch(err => { throw err })

      console.log(ux.colors.white('⚠️  Run this command to get your Kuberenetes Config locally'))
      console.log(ux.colors.green(outputs[STATE_KEY][cmd!]))

      const config = await pexec('cat ~/.kube/config')
      //console.log(config.stdout)

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
