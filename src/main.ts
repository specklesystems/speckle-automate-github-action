import * as core from '@actions/core'
import { ZodError, z } from 'zod'
import fetch from 'node-fetch'
import { retry } from '@lifeomic/attempt'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const InputVariablesSchema = z.object({
  speckleAutomateUrl: z.string().url().nonempty(),
  speckleToken: z.string().nonempty(),
  speckleFunctionId: z.string().nonempty(),
  speckleFunctionInputSchema: z.record(z.string().nonempty(), z.unknown()).nullable(),
  speckleFunctionCommand: z.string().nonempty().array(),
  speckleFunctionReleaseTag: z.string().max(10).nonempty()
})

type InputVariables = z.infer<typeof InputVariablesSchema>

const parseInputs = (): InputVariables => {
  let speckleFunctionInputSchema: Record<string, unknown> | null = null
  let speckleTokenRaw: string
  try {
    speckleTokenRaw = core.getInput('speckle_token', { required: true })
    core.setSecret(speckleTokenRaw)
  } catch (err) {
    core.setFailed(`Parsing the token failed with: ${err}`)
    throw err
  }
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
      .split(' '),
    speckleFunctionReleaseTag: core.getInput('speckle_function_release_tag', {
      required: true
    })
  }
  const inputParseResult = InputVariablesSchema.safeParse(rawInputs)
  if (inputParseResult.success) return inputParseResult.data
  throw inputParseResult.error
}

const RequiredEnvVarsSchema = z.object({
  gitCommitSha: z.string().nonempty()
})

type RequiredEnvVars = z.infer<typeof RequiredEnvVarsSchema>

const parseEnvVars = (): RequiredEnvVars => {
  const parseResult = RequiredEnvVarsSchema.safeParse({
    gitCommitSha: process.env.GITHUB_SHA
  } as RequiredEnvVars)
  if (parseResult.success) return parseResult.data
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
    speckleToken,
    speckleFunctionReleaseTag
  }: InputVariables,
  commitId: string
  // { gitCommitSha, gitRefName, gitRefType }: RequiredEnvVars
): Promise<FunctionVersionResponseBody> => {
  try {
    const requestBody: FunctionVersionRequestBody = {
      commitId,
      versionTag: speckleFunctionReleaseTag,
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
    const parsedResult = FunctionVersionResponseBodySchema.safeParse(response)
    if (parsedResult.success) return parsedResult.data
    throw parsedResult.error
  } catch (err) {
    core.setFailed(
      `Failed to register new function version to the automate server: ${err}`
    )
    throw err
  }
}

export async function run(): Promise<void> {
  core.info('Start registering a new version on the automate instance')
  let inputVariables: InputVariables = {} as InputVariables
  try {
    inputVariables = parseInputs()
  } catch (e: unknown) {
    if (e instanceof ZodError || e instanceof Error) {
      core.setFailed(e.message)
      return Promise.reject(e.message)
    }
    core.setFailed('Failed to parse the input variables')
    return Promise.reject(e)
  }
  core.info(`Parsed input variables to: ${JSON.stringify(inputVariables)}`)
  let requiredEnvVars: RequiredEnvVars = {} as RequiredEnvVars
  try {
    requiredEnvVars = parseEnvVars()
  } catch (e: unknown) {
    if (e instanceof ZodError || e instanceof Error) {
      core.setFailed(e.message)
      return Promise.reject(e.message)
    }
    core.setFailed('Failed to parse the required environment variables')
    return Promise.reject(e)
  }

  const { gitCommitSha } = requiredEnvVars
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

  const { versionId } = await registerNewVersionForTheSpeckleAutomateFunction(
    inputVariables,
    commitId
  )
  core.info(
    `Registered function version tagged as ${inputVariables.speckleFunctionReleaseTag} with new id: ${versionId}`
  )
  core.setOutput('speckle_automate_function_release_id', versionId)
}

run()
