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
    const gitRefName = process.env.GITHUB_REF_NAME
    const gitCommitShaRaw = process.env.GITHUB_SHA

    if (!gitCommitShaRaw) throw new Error('GITHUB_REF_NAME is not defined')
    if (!gitRefName) throw new Error('GITHUB_REF_NAME is not defined')

    const { versionId } = await registerSpeckleFunction({
      speckleServerUrl: speckleServerUrlRaw,
      speckleToken: speckleTokenRaw,
      speckleFunctionPath: speckleFunctionPathRaw,
      speckleFunctionId: speckleFunctionIdRaw,
      versionTag: gitRefName,
      commitId: gitCommitShaRaw,
      logger: core,
      fileSystem: fileUtil
    })

    core.setOutput('version_id', versionId)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
