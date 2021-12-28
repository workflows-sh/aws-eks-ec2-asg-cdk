import util from 'util';
import { ux, sdk } from '@cto.ai/sdk';
import { exec as oexec } from 'child_process';
const pexec = util.promisify(oexec);

async function run() {

  const STACK_TYPE = process.env.STACK_TYPE || 'aws-eks-ec2-asg';

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
    'dev': [`${STACK_ENV}-${STACK_REPO}`],
    'stg': [`${STACK_ENV}-${STACK_REPO}`],
    'prd': [`${STACK_ENV}-${STACK_REPO}`],
    'all': [
      `dev-${STACK_REPO}`,
      `stg-${STACK_REPO}`,
      `stg-${STACK_REPO}`
    ]
  }

  if(!STACKS[STACK_ENV].length) {
    return console.log('Please try again with environment set to <dev|stg|prd|all>')
  }

  sdk.log(`📦 Deploying ${STACK_TAG} to ${STACK_ENV}`)

  // /*const synth =*/ await exec(`npm run cdk synth ${STACK_ENV}`, {
  //   env: { 
  //     ...process.env, 
  //     STACK_TYPE: STACK_TYPE, 
  //     STACK_ENV: STACK_ENV,
  //     STACK_REPO: STACK_REPO,
  //     STACK_TAG: STACK_TAG
  //   }
  // })
  // // synth.stdout.pipe(process.stdout)
  // // synth.stderr.pipe(process.stdout)
  const deploy = await exec(`npm run cdk deploy ${STACKS[STACK_ENV].join(' ')}`, {
    env: { 
      ...process.env, 
      STACK_TYPE: STACK_TYPE, 
      STACK_ENV: STACK_ENV, 
      STACK_REPO: STACK_REPO, 
      STACK_TAG: STACK_TAG
    }
  }).catch((err) => {
    console.log(err)
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
    child.on('close', (code) => { code ? reject(child) : resolve(child) })
  })
}

run()
