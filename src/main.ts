import * as core from '@actions/core'
import { registerSpeckleFunction } from './registerspecklefunction.js'
import fileUtil from './filesystem/files.js'

async function run(): Promise<void> {
  try {
    const speckleAutomateUrlRaw = core.getInput('speckle_automate_url')
    const speckleTokenRaw = core.getInput('speckle_token')
    core.setSecret(speckleTokenRaw)
    const speckleFunctionIdRaw = core.getInput('speckle_function_id')
    const speckleFunctionInputSchema = core.getInput('speckle_function_input_schema')
    const speckleFunctionCommand = core.getInput('speckle_function_command')
    const gitRefName = process.env.GITHUB_REF_NAME
    const gitRefType = process.env.GITHUB_REF_TYPE
    const gitCommitShaRaw = process.env.GITHUB_SHA

    if (!gitCommitShaRaw) throw new Error('GITHUB_REF_NAME is not defined')
    if (!gitRefName) throw new Error('GITHUB_REF_NAME is not defined')
    if (!gitRefType) throw new Error('GITHUB_REF_TYPE is not defined')

    const speckleAutomateHost = new URL(speckleAutomateUrlRaw).host

    const { versionId } = await registerSpeckleFunction({
      speckleServerUrl: speckleAutomateUrlRaw,
      speckleToken: speckleTokenRaw,
      speckleFunctionId: speckleFunctionIdRaw,
      speckleFunctionInputSchema,
      speckleFunctionCommand,
      versionTag: gitRefType === 'tag' ? gitRefName : gitCommitShaRaw,
      commitId: gitCommitShaRaw,
      logger: core,
      fileSystem: fileUtil
    })

    core.setOutput('version_id', versionId)
    core.setOutput('speckle_automate_host', speckleAutomateHost)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
