import * as core from '@actions/core'
import { ZodError, z } from 'zod'
import fetch from 'node-fetch'
import { retry } from '@lifeomic/attempt'
import { readFileSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'

const InputVariablesSchema = z.object({
  speckleAutomateUrl: z.string().url().min(1),
  speckleToken: z.string().min(1),
  speckleFunctionId: z.string().min(1),
  speckleFunctionInputSchema: z.record(z.string().min(1), z.unknown()).nullable(),
  speckleFunctionCommand: z.array(z.string().min(1)),
  speckleFunctionReleaseTag: z
    .string()
    .regex(
      new RegExp('^[a-zA-Z0-9_][a-zA-Z0-9._-]{0,127}$'),
      'A maximum of 128 characters are permitted. The first character must be alphanumeric (of lower or upper case) or an underscore, the subsequent characters may be alphanumeric (or lower or upper case), underscore, hyphen, or period.'
    ),
  speckleFunctionRecommendedCPUm: z
    .number()
    .int()
    .finite()
    .gte(100)
    .lte(16000)
    .optional(),
  speckleFunctionRecommendedMemoryMi: z
    .number()
    .int()
    .finite()
    .gte(1)
    .lte(8000)
    .optional()
})

type InputVariables = z.infer<typeof InputVariablesSchema>

const parseInputs = (): InputVariables => {
  const speckleTokenRaw = core.getInput('speckle_token', { required: true })
  core.setSecret(speckleTokenRaw)

  const rawInputSchemaPath = core.getInput('speckle_function_input_schema_file_path')

  let rawInputSchemaPathAbsolute = rawInputSchemaPath
  if (!isAbsolute(rawInputSchemaPath)) {
    const homeDir = process.env['HOME']
    if (!homeDir)
      throw new Error('The home directory is not defined, cannot load inputSchema')
    rawInputSchemaPathAbsolute = join(homeDir, rawInputSchemaPath)
  }

  let speckleFunctionInputSchema: Record<string, unknown> | null = null
  if (rawInputSchemaPathAbsolute) {
    const rawInputSchema = readFileSync(rawInputSchemaPathAbsolute, 'utf-8')
    speckleFunctionInputSchema = JSON.parse(rawInputSchema)
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
    }),
    speckleFunctionRecommendedCPUm:
      parseInt(
        core.getInput('speckle_function_recommended_cpu_m', {
          required: false
        })
      ) || undefined,
    speckleFunctionRecommendedMemoryMi:
      parseInt(
        core.getInput('speckle_function_recommended_memory_mi', { required: false })
      ) || undefined
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
  recommendedCPUm?: number
  recommendedMemoryMi?: number
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
    speckleFunctionReleaseTag,
    speckleFunctionRecommendedCPUm,
    speckleFunctionRecommendedMemoryMi
  }: InputVariables,
  commitId: string
  // { gitCommitSha, gitRefName, gitRefType }: RequiredEnvVars
): Promise<FunctionVersionResponseBody> => {
  try {
    const requestBody: FunctionVersionRequestBody = {
      commitId,
      versionTag: speckleFunctionReleaseTag,
      command: speckleFunctionCommand,
      inputSchema: speckleFunctionInputSchema,
      recommendedCPUm: speckleFunctionRecommendedCPUm,
      recommendedMemoryMi: speckleFunctionRecommendedMemoryMi
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
    if (err instanceof Error) {
      throw Error(
        `Failed to register new function version to the automate server. ${err.message}`,
        {
          cause: err
        }
      )
    }
    throw Error(
      `Failed to register new function version to the automate server. ${err}`,
      {
        cause: err
      }
    )
  }
}

const failAndReject = async (
  e: unknown,
  errorMessageForUnknownObjectType: string
): Promise<never> => {
  if (e instanceof ZodError || e instanceof Error) {
    core.setFailed(e.message)
    return Promise.reject(e.message)
  }
  core.setFailed(errorMessageForUnknownObjectType)
  return Promise.reject(e)
}

export async function run(): Promise<void> {
  core.info('Start registering a new version on the automate instance')
  let inputVariables: InputVariables = {} as InputVariables
  try {
    inputVariables = parseInputs()
  } catch (e: unknown) {
    return failAndReject(e, 'Failed to parse the input variables')
  }
  core.info(`Parsed input variables to: ${JSON.stringify(inputVariables)}`)
  let requiredEnvVars: RequiredEnvVars = {} as RequiredEnvVars
  try {
    requiredEnvVars = parseEnvVars()
  } catch (e: unknown) {
    return failAndReject(e, 'Failed to parse the required environment variables')
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

  let versionId = ''
  try {
    const registrationResponse = await registerNewVersionForTheSpeckleAutomateFunction(
      inputVariables,
      commitId
    )
    versionId = registrationResponse.versionId
  } catch (e: unknown) {
    return failAndReject(e, 'Failed to register the new function version')
  }
  core.info(
    `Registered function version tagged as ${inputVariables.speckleFunctionReleaseTag} with new id: ${versionId}. Recommended CPU: ${inputVariables.speckleFunctionRecommendedCPUm}m, recommended memory: ${inputVariables.speckleFunctionRecommendedMemoryMi}Mi.`
  )
  core.setOutput('speckle_automate_function_release_id', versionId)
}

run()
