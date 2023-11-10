import { run } from '../src/main.js'
import {
  describe,
  it,
  vi,
  afterEach,
  beforeEach,
  expect,
  beforeAll,
  afterAll
} from 'vitest'
import { mkdtempSync, writeFileSync, rmdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { setupServer } from 'msw/node'
import { rest } from 'msw'
import { z } from 'zod'

describe('Register new version', () => {
  let tmpDir: string
  let countHappyPath = 0
  let count500Errors = 0

  const server = setupServer(
    rest.post(
      'http://myfakeautomate.speckle.internal/api/v1/functions/fake_function_id/versions',
      async (req, res, ctx) => {
        const parseResult = FunctionVersionRequestSchema.safeParse(await req.json())
        expect(parseResult.success).to.be.true
        countHappyPath++
        return res(ctx.status(201), ctx.json({ versionId: 'fake_version_id' }))
      }
    ),
    rest.post(
      'http://myfakeautomate.speckle.internal/api/v1/functions/network_error/versions',
      async (req, res, ctx) => {
        const parseResult = FunctionVersionRequestSchema.safeParse(await req.json())
        expect(parseResult.success).to.be.true
        return res.networkError('Failed to connect to server')
      }
    ),
    rest.post(
      'http://myfakeautomate.speckle.internal/api/v1/functions/500_response/versions',
      async (req, res, ctx) => {
        const parseResult = FunctionVersionRequestSchema.safeParse(await req.json())
        expect(parseResult.success).to.be.true
        count500Errors++
        return res(ctx.status(500))
      }
    )
  )

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

  afterAll(() => server.close())

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'speckle-automate-github-action-test-'))
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true })
    vi.unstubAllEnvs()
    server.resetHandlers()
  })

  it('sends the request', async () => {
    writeFileSync(join(tmpDir, 'schema.json'), '{}')
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_ID', 'fake_function_id')
    vi.stubEnv('INPUT_SPECKLE_TOKEN', '{token}')
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_COMMAND', 'echo "hello automate"')
    vi.stubEnv('HOME', tmpDir) // the input schema file path is assumed to be relative to the home directory
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_INPUT_SCHEMA_FILE_PATH', './schema.json')
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_RELEASE_TAG', 'v1.0.0')
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_RECOMMENDED_CPU_M', '1000')
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_RECOMMENDED_MEMORY_MI', '500')
    vi.stubEnv('INPUT_SPECKLE_AUTOMATE_URL', 'http://myfakeautomate.speckle.internal')
    vi.stubEnv('GITHUB_SHA', 'commitSha')
    vi.stubEnv('GITHUB_REF_TYPE', 'commit')
    vi.stubEnv('GITHUB_REF_NAME', 'version')
    await expect(run()).resolves.not.toThrow()
    expect(countHappyPath).to.equal(1)
    countHappyPath = 0
  })
  it('handles network errors', async () => {
    writeFileSync(join(tmpDir, 'schema.json'), '{}')
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_ID', 'network_error')
    vi.stubEnv('INPUT_SPECKLE_TOKEN', '{token}')
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_COMMAND', 'echo "hello automate"')
    vi.stubEnv('HOME', tmpDir) // the input schema file path is assumed to be relative to the home directory
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_INPUT_SCHEMA_FILE_PATH', './schema.json')
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_RELEASE_TAG', 'v1.0.0')
    vi.stubEnv('INPUT_SPECKLE_AUTOMATE_URL', 'http://myfakeautomate.speckle.internal')
    vi.stubEnv('GITHUB_SHA', 'commitSha')
    vi.stubEnv('GITHUB_REF_TYPE', 'commit')
    vi.stubEnv('GITHUB_REF_NAME', 'version')
    await expect(run()).rejects.toThrow(
      'Failed to register new function version to the automate server'
    )
  })
  it('handles 500 responses', async () => {
    writeFileSync(join(tmpDir, 'schema.json'), '{}')
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_ID', '500_response')
    vi.stubEnv('INPUT_SPECKLE_TOKEN', '{token}')
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_COMMAND', 'echo "hello automate"')
    vi.stubEnv('HOME', tmpDir) // the input schema file path is assumed to be relative to the home directory
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_INPUT_SCHEMA_FILE_PATH', './schema.json')
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_RELEASE_TAG', 'v1.0.0')
    vi.stubEnv('INPUT_SPECKLE_AUTOMATE_URL', 'http://myfakeautomate.speckle.internal')
    vi.stubEnv('GITHUB_SHA', 'commitSha')
    vi.stubEnv('GITHUB_REF_TYPE', 'commit')
    vi.stubEnv('GITHUB_REF_NAME', 'version')
    await expect(run()).rejects.toThrow(
      'Failed to register new function version to the automate server'
    )
    expect(count500Errors).to.toBeGreaterThan(1) // we expect the action to retry the request
    count500Errors = 0
  })
  it('errors if the token is empty', async () => {
    writeFileSync(join(tmpDir, 'schema.json'), '{}')
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_ID', 'fake_function_id')
    vi.stubEnv('INPUT_SPECKLE_TOKEN', '')
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_COMMAND', 'echo "hello automate"')
    vi.stubEnv('HOME', tmpDir) // the input schema file path is assumed to be relative to the home directory
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_INPUT_SCHEMA_FILE_PATH', './schema.json')
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_RELEASE_TAG', 'v1.0.0')
    vi.stubEnv('INPUT_SPECKLE_AUTOMATE_URL', 'http://myfakeautomate.speckle.internal')
    vi.stubEnv('GITHUB_SHA', 'commitSha')
    vi.stubEnv('GITHUB_REF_TYPE', 'commit')
    vi.stubEnv('GITHUB_REF_NAME', 'version')
    await expect(run()).rejects.toThrow(
      'Input required and not supplied: speckle_token'
    )
  })
  it('errors if the environment variable is empty', async () => {
    writeFileSync(join(tmpDir, 'schema.json'), '{}')
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_ID', 'fake_function_id')
    vi.stubEnv('INPUT_SPECKLE_TOKEN', '{token}')
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_COMMAND', 'echo "hello automate"')
    vi.stubEnv('HOME', tmpDir) // the input schema file path is assumed to be relative to the home directory
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_INPUT_SCHEMA_FILE_PATH', './schema.json')
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_RELEASE_TAG', 'v1.0.0')
    vi.stubEnv('INPUT_SPECKLE_AUTOMATE_URL', 'http://myfakeautomate.speckle.internal')
    vi.stubEnv('GITHUB_SHA', '')
    vi.stubEnv('GITHUB_REF_TYPE', 'commit')
    vi.stubEnv('GITHUB_REF_NAME', 'version')
    await expect(run()).rejects.toThrow('gitCommitSha')
  })
})

//This must be updated to align with the schema in speckle automate
const FunctionVersionRequestSchema = z.object({
  commitId: z
    .string()
    .trim()
    .min(6)
    .transform((arg: string) => arg.substring(0, 10)),
  versionTag: z
    .string()
    .regex(
      new RegExp('^[a-zA-Z0-9_][a-zA-Z0-9._-]{0,127}$'),
      'A maximum of 128 characters are permitted. The first character must be alphanumeric (of lower or upper case) or an underscore, the subsequent characters may be alphanumeric (or lower or upper case), underscore, hyphen, or period.'
    ), // regex as per OCI distribution spec https://github.com/opencontainers/distribution-spec/blob/main/spec.md#pulling-manifests
  inputSchema: z.record(z.string(), z.unknown()).nullable(), // TODO:  we need to validate the jsonschema somehow
  command: z.array(z.string().nonempty()),
  annotations: z
    .object({
      'speckle.systems/v1alpha1/publishing/status': z
        .enum(['publish', 'draft', 'archive'], {
          description:
            'Whether this Function is published (and should appear in the library), a draft, or archived.'
        })
        .default('draft'),
      'speckle.systems/v1alpha1/author': z
        .string({
          description:
            'The name of the authoring organization or individual of this Function.'
        })
        .optional(),
      'speckle.systems/v1alpha1/license': z
        .enum(['MIT', 'BSD', 'Apache-2.0', 'MPL', 'CC0', 'Unlicense'], {
          description:
            'The license under under which this Function is made available. This must match the license in the source code repository.'
        })
        .optional(), //TODO match the specification for license names
      'speckle.systems/v1alpha1/website': z
        .string({
          description: 'The marketing website for this Function or its authors.'
        })
        .url()
        .optional(),
      'speckle.systems/v1alpha1/documentation': z
        .string({
          description:
            'The documentation website for this function. For example, this could be a url to the README in the source code repository.'
        })
        .url()
        .optional(),
      'speckle.systems/v1alpha1/keywords': z
        .string({
          description:
            'Comma separated list of keywords used for categorizing this function.'
        })
        .optional(),
      'speckle.systems/v1alpha1/description': z.string().optional()
    })
    .optional(),
  recommendedCPUm: z.number().gte(100).lte(16000).finite().optional().default(1000),
  recommendedMemoryMi: z.number().gte(1).lte(8000).finite().optional().default(100)
})
