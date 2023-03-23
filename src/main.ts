import * as core from '@actions/core'
import { registerSpeckleFunction } from './registerspecklefunction.js'
import fileUtil from './filesystem/files.js'

async function run(): Promise<void> {
  try {
    const speckleServerUrlRaw = core.getInput('speckle_server_url')
    const speckleTokenRaw = core.getInput('speckle_token')
    core.setSecret(speckleTokenRaw)
    const speckleFunctionPathRaw = core.getInput('speckle_function_path')
    const speckleFunctionIdRaw = core.getInput('speckle_function_id')
    const gitServerUrl = process.env.GITHUB_SERVER_URL
    const gitRepository = process.env.GITHUB_REPOSITORY
    const gitRefRaw = process.env.GITHUB_REF_NAME
    const gitCommitShaRaw = process.env.GITHUB_SHA

    const { imageName, functionId, versionId } = await registerSpeckleFunction({
      speckleServerUrl: speckleServerUrlRaw,
      speckleToken: speckleTokenRaw,
      speckleFunctionRepositoryUrl: `${gitServerUrl}/${gitRepository}.git`,
      speckleFunctionPath: speckleFunctionPathRaw,
      speckleFunctionId: speckleFunctionIdRaw,
      ref: gitRefRaw,
      commitsha: gitCommitShaRaw,
      logger: core,
      fileSystem: fileUtil
    })

    core.setOutput('function_id', functionId)
    core.setOutput('version_id', versionId)
    core.setOutput('image_name', imageName)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
