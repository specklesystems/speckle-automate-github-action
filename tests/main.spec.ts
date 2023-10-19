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
  versionTag: z.string(),
  inputSchema: z.record(z.string(), z.unknown()).nullable(),
  command: z.array(z.string().nonempty()),
  annotations: z.object({}).optional()
})
