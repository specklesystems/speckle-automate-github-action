import * as core from '@actions/core'
import { z } from 'zod'
import fetch from 'node-fetch'
import { retry } from '@lifeomic/attempt'

async function run(): Promise<void> {
  core.info('Start registering a new version on the automate instance')
  const inputVariables = parseInputs()
  core.info(`Parsed input variables to: ${inputVariables}`)
  const requiredEnvVars = parseEnvVars()
  core.info(`Parsed required environment variables to: ${requiredEnvVars}`)

  const { speckleAutomateUrl, speckleFunctionId } = inputVariables
  core.setOutput('speckle_automate_host', new URL(speckleAutomateUrl).host)
  core.info(
    `Sending a new function version definition for function ${speckleFunctionId} to the automate server: ${speckleAutomateUrl}`
  )

  const { versionId } = await registerNewVersionForTheSpeckleAutomateFunction(
    inputVariables,
    requiredEnvVars
  )
  core.setOutput('version_id', versionId)
  core.info(`Registered function version with new id: ${versionId}`)
}

run()

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
    const rawInputSchema = core.getInput('speckle_function_input_schema')
    if (rawInputSchema) speckleFunctionInputSchema = JSON.parse(rawInputSchema)
  } catch (err) {
    core.setFailed(`Parsing the function input schema failed with: ${err}`)
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
    `The provided inputs do not match the required schema, ${inputParseResult.error}`
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
    `The current execution environment does not have the required variables: ${parseResult.error}`
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
  { gitCommitSha, gitRefName, gitRefType }: RequiredEnvVars
): Promise<FunctionVersionResponseBody> => {
  try {
    const requestBody: FunctionVersionRequestBody = {
      commitId: gitCommitSha,
      versionTag: gitRefType === 'tag' ? gitRefName : gitCommitSha,
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
      },
      {
        delay: 200,
        factor: 2,
        maxAttempts: 5,
        minDelay: 100,
        maxDelay: 500,
        jitter: true,
        handleError: (err, context) => {
          if (err !== retryFlag) context.abort()
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
