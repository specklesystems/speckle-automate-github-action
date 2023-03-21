import * as core from '@actions/core'
import { processSpeckleFunction } from './speckleautomate.js'

async function run(): Promise<void> {
  try {
    const speckleServerUrlRaw: string = core.getInput('speckle_server_url')
    const speckleTokenRaw: string = core.getInput('speckle_token')
    core.setSecret(speckleTokenRaw)
    const speckleFunctionPathRaw: string = core.getInput('speckle_function_path')

    const { functionId, versionId, imageName, dockerfilePath, dockerContextPath } =
      await processSpeckleFunction({
        speckleServerUrl: speckleServerUrlRaw,
        speckleToken: speckleTokenRaw,
        speckleFunctionPath: speckleFunctionPathRaw,
        logger: core
      })

    core.setOutput('function_id', functionId)
    core.setOutput('version_id', versionId)
    core.setOutput('image_name', imageName)
    core.setOutput('dockerfile_path', dockerfilePath)
    core.setOutput('docker_context_path', dockerContextPath)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
