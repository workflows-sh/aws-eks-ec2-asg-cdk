import util from 'util';
import { ux, sdk } from '@cto.ai/sdk';
import { exec as oexec } from 'child_process';
const pexec = util.promisify(oexec);

const ARGS = process.argv.slice(3);
const OPTIONS = require('simple-argv')

const STACK_TYPE = process.env.STACK_TYPE || 'aws-eks-ec2-asg';
const STACK_TEAM = process.env.OPS_TEAM_NAME || 'private'



async function init() {


  sdk.log(`🛠 Loading the ${ux.colors.white(STACK_TYPE)} stack for the ${ux.colors.white(STACK_TEAM)} team...`)

  const { STACK_ENV } = await ux.prompt<{
    STACK_ENV: string
  }>({
      type: 'input',
      name: 'STACK_ENV',
      default: 'dev',
      message: 'What is the name of the environment?'
    })

  try {

    const secrets = {}
    const PREFIX = `${STACK_ENV}_${STACK_TYPE}`.replace(/-/g, '_').toUpperCase()
    const VAULT_KEY = `${STACK_ENV}-${STACK_TYPE}`
    const STATE_KEY = `${PREFIX}_STATE`
    const STATE = process.env[`${STATE_KEY}`]

    if(!STATE) {
      console.log('')
      await ux.print(`⚠️  Cannot find your ${ux.colors.white(STACK_ENV)} cluster state in ${ux.colors.white(STACK_TEAM)} team config store.`)
      await ux.print(`You may need to run the setup workflow to populate the state into your team config.`)
      console.log('')
      process.exit()
    }

    const outputs = JSON.parse(STATE || '')
    const cmd = Object.keys(outputs[VAULT_KEY])
      .find((k) => { return k.indexOf('ConfigCommand') > -1 })
    const cluster = Object.keys(outputs[VAULT_KEY])
      .find((k) => { return k.indexOf('ClusterArn') > -1 })

    console.log(`\n🔒 Configuring a secure connection with ${ux.colors.white(cluster || 'cluster')}:`)
    const aws = await exec(outputs[VAULT_KEY][cmd!], process.env)
      .catch(err => { throw err })

    const config = await pexec('cat ~/.kube/config')
    //console.log(config.stdout)
    
    console.log(`\n⚡️ Confirming connection to ${ux.colors.white(cluster || 'cluster')}:`)
    await exec('kubectl get nodes')
      .catch(err => console.log(err))

    const vault = await pexec(`kubectl create secret generic ${VAULT_KEY} --from-literal=PORT='3000'`) 
    console.log(vault.stdout)

  } catch (e) {
    console.log('there was an error:', e)
  }

}

async function create() {

  sdk.log(`🛠 Loading the ${ux.colors.white(STACK_TYPE)} stack for the ${ux.colors.white(STACK_TEAM)} team...`)

  const { STACK_ENV } = await ux.prompt<{
    STACK_ENV: string
  }>({
      type: 'input',
      name: 'STACK_ENV',
      default: 'dev',
      message: 'What is the name of the environment?'
    })

  try {

    const PREFIX = `${STACK_ENV}_${STACK_TYPE}`.replace(/-/g, '_').toUpperCase()
    const VAULT_KEY = `${STACK_ENV}-${STACK_TYPE}`
    const STATE_KEY = `${PREFIX}_STATE`
    const STATE = process.env[`${STATE_KEY}`]

    if(!STATE) {
      console.log('')
      await ux.print(`⚠️  Cannot find your ${ux.colors.white(STACK_ENV)} cluster state in ${ux.colors.white(STACK_TEAM)} team config store.`)
      await ux.print(`You may need to run the setup workflow to populate the state into your team config.`)
      console.log('')
      process.exit()
    }

    const { confirmation } = await ux.prompt<{
      confirmation: boolean
    }>({
      type: 'confirm',
      name: 'confirmation',
      message: `Are you sure you want to set ${OPTIONS.k} to ${OPTIONS.v} in the ${VAULT_KEY}?`
    })

    if(!confirmation) {
      return console.log('Exiting...')
    }

    const outputs = JSON.parse(STATE || '')
    const cmd = Object.keys(outputs[VAULT_KEY])
      .find((k) => { return k.indexOf('ConfigCommand') > -1 })
    const cluster = Object.keys(outputs[VAULT_KEY])
      .find((k) => { return k.indexOf('ClusterArn') > -1 })

    console.log(`\n🔒 Configuring a secure connection with ${ux.colors.white(cluster || 'cluster')}:`)
    const aws = await exec(outputs[VAULT_KEY][cmd!], process.env)
      .catch(err => { throw err })

    const config = await pexec('cat ~/.kube/config')
    //console.log(config.stdout)
    
    console.log(`\n⚡️ Confirming connection to ${ux.colors.white(cluster || 'cluster')}:`)
    await exec('kubectl get nodes')
      .catch(err => console.log(err))

    const vault = await pexec(`kubectl get secret ${VAULT_KEY} -o json`) 
    //console.log(vault.stdout)

    const encode = (str: string):string => Buffer.from(str, 'binary').toString('base64');
    const data = JSON.parse(vault.stdout); 

    console.log(`\n🔐 Setting ${OPTIONS.k} to ${OPTIONS.v} on the ${VAULT_KEY} with type ${typeof OPTIONS.v}`)
    data.data[OPTIONS.k] = encode(OPTIONS.v.toString())

    // not sure why but k8s breaks annotations json with \n
    // so delete last applied annotations before applying
    delete data?.metadata?.annotations
    const payload = JSON.stringify(data)
    await pexec(`echo '${payload}' | kubectl apply -f -`) 
    console.log(`✅ ${OPTIONS.k} set to ${OPTIONS.v} in the ${VAULT_KEY} vault\n`)
    
  } catch (e) {
    console.log('there was an error:', e)
  }

}

async function list() {

  sdk.log(`🛠 Loading the ${ux.colors.white(STACK_TYPE)} stack for the ${ux.colors.white(STACK_TEAM)} team...`)

  const { STACK_ENV } = await ux.prompt<{
    STACK_ENV: string
  }>({
      type: 'input',
      name: 'STACK_ENV',
      default: 'dev',
      message: 'What is the name of the environment?'
    })

  try {

    const PREFIX = `${STACK_ENV}_${STACK_TYPE}`.replace(/-/g, '_').toUpperCase()
    const VAULT_KEY = `${STACK_ENV}-${STACK_TYPE}`
    const STATE_KEY = `${PREFIX}_STATE`
    const STATE = process.env[`${STATE_KEY}`]

    if(!STATE) {
      console.log('')
      await ux.print(`⚠️  Cannot find your ${ux.colors.white(STACK_ENV)} cluster state in ${ux.colors.white(STACK_TEAM)} team config store.`)
      await ux.print(`You may need to run the setup workflow to populate the state into your team config.`)
      console.log('')
      process.exit()
    }

    const outputs = JSON.parse(STATE || '')
    const cmd = Object.keys(outputs[VAULT_KEY])
      .find((k) => { return k.indexOf('ConfigCommand') > -1 })
    const cluster = Object.keys(outputs[VAULT_KEY])
      .find((k) => { return k.indexOf('ClusterArn') > -1 })

    console.log(`\n🔒 Configuring a secure connection with ${ux.colors.white(cluster || 'cluster')}:`)
    const aws = await exec(outputs[VAULT_KEY][cmd!], process.env)
      .catch(err => { throw err })

    const config = await pexec('cat ~/.kube/config')
    //console.log(config.stdout)
    
    console.log(`\n⚡️ Confirming connection to ${ux.colors.white(cluster || 'cluster')}:`)
    await exec('kubectl get nodes')
      .catch(err => console.log(err))

    const vault = await pexec(`kubectl get secret ${VAULT_KEY} -o json`) 
    //console.log(vault.stdout)

    const data = JSON.parse(vault.stdout); 
    const secrets = data.data

    console.log(`\n🔐 ${VAULT_KEY} has the following secrets: \n`)
    const decode = (str: string):string => Buffer.from(str, 'base64').toString('binary');

    for(let k in secrets) {
      console.log(`${ux.colors.bold(k)}: ${ux.colors.white(decode(secrets[k]))}`)
    }

    console.log("")

  } catch (e) {
    console.log('there was an error:')
    throw e;
  }

}

async function remove() {

  sdk.log(`🛠 Loading the ${ux.colors.white(STACK_TYPE)} stack for the ${ux.colors.white(STACK_TEAM)} team...`)

  const { STACK_ENV } = await ux.prompt<{
    STACK_ENV: string
  }>({
      type: 'input',
      name: 'STACK_ENV',
      default: 'dev',
      message: 'What is the name of the environment?'
    })

  try {

    const PREFIX = `${STACK_ENV}_${STACK_TYPE}`.replace(/-/g, '_').toUpperCase()
    const VAULT_KEY = `${STACK_ENV}-${STACK_TYPE}`
    const STATE_KEY = `${PREFIX}_STATE`
    const STATE = process.env[`${STATE_KEY}`]

    if(!STATE) {
      console.log('')
      await ux.print(`⚠️  Cannot find your ${ux.colors.white(STACK_ENV)} cluster state in ${ux.colors.white(STACK_TEAM)} team config store.`)
      await ux.print(`You may need to run the setup workflow to populate the state into your team config.`)
      console.log('')
      process.exit()
    }

    const { confirmation } = await ux.prompt<{
      confirmation: boolean
    }>({
      type: 'confirm',
      name: 'confirmation',
      message: `Are you sure you want to remove ${OPTIONS.k} from the ${VAULT_KEY} vault?`
    })

    if(!confirmation) {
      return console.log('Exiting...')
    }

    const outputs = JSON.parse(STATE || '')
    const cmd = Object.keys(outputs[VAULT_KEY])
      .find((k) => { return k.indexOf('ConfigCommand') > -1 })
    const cluster = Object.keys(outputs[VAULT_KEY])
      .find((k) => { return k.indexOf('ClusterArn') > -1 })

    console.log(`\n🔒 Configuring a secure connection with ${ux.colors.white(cluster || 'cluster')}:`)
    const aws = await exec(outputs[VAULT_KEY][cmd!], process.env)
      .catch(err => { throw err })

    const config = await pexec('cat ~/.kube/config')
    //console.log(config.stdout)
    
    console.log(`\n⚡️ Confirming connection to ${ux.colors.white(cluster || 'cluster')}:`)
    await exec('kubectl get nodes')
      .catch(err => console.log(err))

    const vault = await pexec(`kubectl get secret ${VAULT_KEY} -o json`) 
    //console.log(vault.stdout)

    const encode = (str: string):string => Buffer.from(str, 'binary').toString('base64');
    const data = JSON.parse(vault.stdout); 

    console.log(`\n🔐 Deleting ${OPTIONS.k} from the ${VAULT_KEY} vault`)

    // not sure why but k8s breaks annotations json with \n
    // so delete last applied annotations before applying
    delete data?.metadata?.annotations
    delete data.data[OPTIONS.k]

    const payload = JSON.stringify(data)
    await pexec(`echo '${payload}' | kubectl apply -f -`) 
    console.log(`✅ ${OPTIONS.k} removed from the ${VAULT_KEY} vault\n`)

  } catch (e) {
    console.log('there was an error:')
    throw e;
  }

}

async function destroy() {

  sdk.log(`🛠 Loading the ${ux.colors.white(STACK_TYPE)} stack for the ${ux.colors.white(STACK_TEAM)} team...`)

  const { STACK_ENV } = await ux.prompt<{
    STACK_ENV: string
  }>({
      type: 'input',
      name: 'STACK_ENV',
      default: 'dev',
      message: 'What is the name of the environment?'
    })

  try {

    const PREFIX = `${STACK_ENV}_${STACK_TYPE}`.replace(/-/g, '_').toUpperCase()
    const VAULT_KEY = `${STACK_ENV}-${STACK_TYPE}`
    const STATE_KEY = `${PREFIX}_STATE`
    const STATE = process.env[`${STATE_KEY}`]

    if(!STATE) {
      console.log('')
      await ux.print(`⚠️  Cannot find your ${ux.colors.white(STACK_ENV)} cluster state in ${ux.colors.white(STACK_TEAM)} team config store.`)
      await ux.print(`You may need to run the setup workflow to populate the state into your team config.`)
      console.log('')
      process.exit()
    }

    const { confirmation } = await ux.prompt<{
      confirmation: boolean
    }>({
      type: 'confirm',
      name: 'confirmation',
      message: `⛔️ Are you sure you want to delete the ${VAULT_KEY} vault?`
    })

    if(!confirmation) {
      return console.log('Exiting...')
    }

    const outputs = JSON.parse(STATE || '')
    const cmd = Object.keys(outputs[VAULT_KEY])
      .find((k) => { return k.indexOf('ConfigCommand') > -1 })
    const cluster = Object.keys(outputs[VAULT_KEY])
      .find((k) => { return k.indexOf('ClusterArn') > -1 })

    console.log(`\n🔒 Configuring a secure connection with ${ux.colors.white(cluster || 'cluster')}:`)
    const aws = await exec(outputs[VAULT_KEY][cmd!], process.env)
      .catch(err => { throw err })

    const config = await pexec('cat ~/.kube/config')
    //console.log(config.stdout)
    
    console.log(`\n⚡️ Confirming connection to ${ux.colors.white(cluster || 'cluster')}:`)
    await exec('kubectl get nodes')
      .catch(err => console.log(err))

    console.log(`\n🔐 Destroying the vault...`)
    await pexec(`kubectl delete secret ${VAULT_KEY}`) 
    console.log(`✅ ${VAULT_KEY} has been destroyed\n`)


  } catch (e) {
    console.log('there was an error:')
    throw e;
  }

}

switch(ARGS[0]) {

  case "init":

    init()

  break;

  case "set":

    create()

  break;

  case "ls":

    list()

  break;

  case "rm":

    remove()

  break;

  case "destroy":

    destroy()

  break;
  case "help":
  default:
    console.log("\n ⛔️ No sub command provided. See available subcommands:\n")
    console.log("ops run vault <cmd> [arguments]")
    console.log("")
    console.log("Available subcommands:")
    console.log("   ops run vault init")
    console.log("   ops run vault set")
    console.log("   ops run vault ls")
    console.log("   ops run vault rm")
    console.log("   ops run vault destroy")
    console.log("")
  break;
}

async function exec(cmd, env?: any | null) {
  return new Promise(function(resolve, reject) {
    const child = oexec(cmd, env)
    child?.stdout?.pipe(process.stdout)
    child?.stderr?.pipe(process.stderr)
    child.on('close', (code) => { code ? reject(child.stdout) : resolve(child.stderr) })
  })
}
