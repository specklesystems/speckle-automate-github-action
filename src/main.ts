import * as core from '@actions/core'
import { z } from 'zod'
import fetch from 'node-fetch'
import { retry } from '@lifeomic/attempt'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const InputVariablesSchema = z.object({
  speckleAutomateUrl: z.string().url().nonempty(),
  speckleToken: z.string().nonempty(),
  speckleFunctionId: z.string().nonempty(),
  speckleFunctionInputSchema: z.record(z.string().nonempty(), z.unknown()).nullable(),
  speckleFunctionCommand: z.string().nonempty().array()
})

type InputVariables = z.infer<typeof InputVariablesSchema>

const parseInputs = (): InputVariables => {
  const speckleTokenRaw = core.getInput('speckle_token', { required: true })
  core.setSecret(speckleTokenRaw)

  let speckleFunctionInputSchema: Record<string, unknown> | null = null
  try {
    const rawInputSchemaPath = core.getInput('speckle_function_input_schema_file_path')
    const homeDir = process.env['HOME']
    if (!homeDir)
      throw new Error('The home directory is not defined, cannot load inputSchema')
    if (rawInputSchemaPath) {
      const rawInputSchema = readFileSync(join(homeDir, rawInputSchemaPath), 'utf-8')
      speckleFunctionInputSchema = JSON.parse(rawInputSchema)
    }
  } catch (err) {
    core.setFailed(`Parsing the function input schema failed with: ${err}`)
    throw err
  }
  const rawInputs: InputVariables = {
    speckleAutomateUrl: core.getInput('speckle_automate_url', { required: true }),
    speckleToken: speckleTokenRaw,
    speckleFunctionId: core.getInput('speckle_function_id', { required: true }),
    speckleFunctionInputSchema,
    speckleFunctionCommand: core
      .getInput('speckle_function_command', { required: true })
      .split(' ')
  }
  const inputParseResult = InputVariablesSchema.safeParse(rawInputs)
  if (inputParseResult.success) return inputParseResult.data
  core.setFailed(
    `The provided inputs do not match the required schema, ${inputParseResult.error.message}`
  )
  throw inputParseResult.error
}

const RequiredEnvVarsSchema = z.object({
  gitRefName: z.string().nonempty(),
  gitRefType: z.string().nonempty(),
  gitCommitSha: z.string().nonempty()
})

type RequiredEnvVars = z.infer<typeof RequiredEnvVarsSchema>

const parseEnvVars = (): RequiredEnvVars => {
  const parseResult = RequiredEnvVarsSchema.safeParse({
    gitCommitSha: process.env.GITHUB_SHA,
    gitRefType: process.env.GITHUB_REF_TYPE,
    gitRefName: process.env.GITHUB_REF_NAME
  } as RequiredEnvVars)
  if (parseResult.success) return parseResult.data
  core.setFailed(
    `The current execution environment does not have the required variables: ${parseResult.error.message}`
  )
  throw parseResult.error
}

type FunctionVersionRequestBody = {
  commitId: string
  versionTag: string
  command: string[]
  inputSchema: Record<string, unknown> | null
}

const FunctionVersionResponseBodySchema = z.object({
  versionId: z.string().nonempty()
})

type FunctionVersionResponseBody = z.infer<typeof FunctionVersionResponseBodySchema>

const registerNewVersionForTheSpeckleAutomateFunction = async (
  {
    speckleAutomateUrl,
    speckleFunctionCommand,
    speckleFunctionId,
    speckleFunctionInputSchema,
    speckleToken
  }: InputVariables,
  { commitId, versionTag }: { commitId: string; versionTag: string }
  // { gitCommitSha, gitRefName, gitRefType }: RequiredEnvVars
): Promise<FunctionVersionResponseBody> => {
  try {
    const requestBody: FunctionVersionRequestBody = {
      commitId,
      versionTag,
      command: speckleFunctionCommand,
      inputSchema: speckleFunctionInputSchema
    }
    const versionRegisterUrl = new URL(
      `/api/v1/functions/${speckleFunctionId}/versions`,
      speckleAutomateUrl
    )
    const retryFlag = 'RETRY THIS'
    const response = await retry(
      async () => {
        const res = await fetch(versionRegisterUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${speckleToken}`
          },
          body: JSON.stringify(requestBody)
        })
        if (res.ok) return await res.json()
        if (res.status >= 500) {
          core.warning(
            `RETRYING Version creation request since it failed with: ${await res.text()}`
          )
          throw retryFlag
        }
        throw Error(
          `Request failed with status ${res.status}. Reason: ${await res.text()} `
        )
      },
      {
        delay: 200,
        factor: 2,
        maxAttempts: 5,
        minDelay: 100,
        maxDelay: 500,
        jitter: true,
        handleError: (err, context) => {
          if (err !== retryFlag) {
            context.abort()
            throw err
          }
        }
      }
    )
    return FunctionVersionResponseBodySchema.parse(response)
  } catch (err) {
    core.setFailed(
      `Failed to register new function version to the automate server: ${err}`
    )
    throw err
  }
}

export async function run(): Promise<void> {
  core.info('Start registering a new version on the automate instance')
  const inputVariables = parseInputs()
  core.info(`Parsed input variables to: ${JSON.stringify(inputVariables)}`)
  const requiredEnvVars = parseEnvVars()
  const { gitCommitSha, gitRefName, gitRefType } = requiredEnvVars
  core.info(
    `Parsed required environment variables to: ${JSON.stringify(requiredEnvVars)}`
  )

  const { speckleAutomateUrl, speckleFunctionId } = inputVariables
  core.setOutput('speckle_automate_host', new URL(speckleAutomateUrl).host)
  core.info(
    `Sending a new function version definition for function ${speckleFunctionId} to the automate server: ${speckleAutomateUrl}`
  )

  // github uses 7 chars to identify commits
  const commitId = gitCommitSha.substring(0, 7)
  const versionTag = gitRefType === 'tag' ? gitRefName : commitId

  const { versionId } = await registerNewVersionForTheSpeckleAutomateFunction(
    inputVariables,
    { versionTag, commitId }
  )
  core.info(`Registered function version with new id: ${versionId}`)
  core.setOutput('version_tag', versionTag)
}

run()
