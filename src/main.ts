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
    const speckleFunctionInputSchema = core.getInput('speckle_function_input_schema')
    const speckleFunctionCommand = core.getInput('speckle_function_command')
    const gitCommitShaRaw = process.env.GITHUB_SHA

    if (!gitCommitShaRaw) throw new Error('GITHUB_REF_NAME is not defined')

    const { versionId } = await registerSpeckleFunction({
      speckleServerUrl: speckleServerUrlRaw,
      speckleToken: speckleTokenRaw,
      speckleFunctionPath: speckleFunctionPathRaw,
      speckleFunctionId: speckleFunctionIdRaw,
      speckleFunctionInputSchema,
      speckleFunctionCommand,
      versionTag: gitCommitShaRaw,
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
