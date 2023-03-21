import * as core from '@actions/core'
import { registerSpeckleFunction } from './speckleautomate.js'

async function run(): Promise<void> {
  try {
    const speckleServerUrlRaw = core.getInput('speckle_server_url')
    const speckleTokenRaw = core.getInput('speckle_token')
    core.setSecret(speckleTokenRaw)
    const speckleFunctionPathRaw = core.getInput('speckle_function_path')
    const speckleFunctionIdRaw = core.getInput('speckle_function_id')
    const gitRefRaw = process.env.GITHUB_REF_NAME
    const gitCommitShaRaw = process.env.GITHUB_SHA

    const { imageName } = await registerSpeckleFunction({
      speckleServerUrl: speckleServerUrlRaw,
      speckleToken: speckleTokenRaw,
      speckleFunctionPath: speckleFunctionPathRaw,
      speckleFunctionId: speckleFunctionIdRaw,
      ref: gitRefRaw,
      commitsha: gitCommitShaRaw,
      logger: core
    })

    // core.setOutput('function_id', functionId)
    // core.setOutput('version_id', versionId)
    core.setOutput('image_name', imageName)
    // core.setOutput('dockerfile_path', dockerfilePath)
    // core.setOutput('docker_context_path', dockerContextPath)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
