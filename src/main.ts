import * as core from '@actions/core'

async function run(): Promise<void> {
  try {
    const speckleServerUrl: string = core.getInput('speckle_server_url')
    const speckleServerToken: string = core.getInput('speckle_server_token')
    core.setSecret(speckleServerToken)
    const speckleFunctionPath: string = core.getInput('speckle_function_path')

    core.info(`Speckle Server URL: ${speckleServerUrl}`)
    core.debug(`Speckle Server Token: ${speckleServerToken}`) //this should be masked in the logs?
    core.info(`Speckle Function Path: ${speckleFunctionPath}`)

    core.setOutput('function_id', new Date().toTimeString())
    core.setOutput('version_id', new Date().toTimeString())
    core.setOutput('image_name', new Date().toTimeString())
    core.setOutput('dockerfile_path', new Date().toTimeString())
    core.setOutput('docker_context_path', new Date().toTimeString())
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
