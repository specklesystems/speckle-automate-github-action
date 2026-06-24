import { run } from '../src/main.js'
import * as core from '@actions/core'
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
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { z } from 'zod'

const automateUrl = 'http://myfakeautomate.speckle.internal'
const versionsUrl = (functionId: string): string =>
  `${automateUrl}/api/v1/functions/${functionId}/versions`

// The full set of environment variables a successful run requires. Individual
// tests spread this and override (or null-out) the variables relevant to them.
const baseEnv = (homeDir: string): Record<string, string> => ({
  INPUT_SPECKLE_FUNCTION_ID: 'fake_function_id',
  INPUT_SPECKLE_TOKEN: '{token}',
  INPUT_SPECKLE_FUNCTION_COMMAND: 'echo "hello automate"',
  HOME: homeDir, // the input schema file path is assumed to be relative to the home directory
  INPUT_SPECKLE_FUNCTION_INPUT_SCHEMA_FILE_PATH: './schema.json',
  INPUT_SPECKLE_FUNCTION_RELEASE_TAG: 'v1.0.0',
  INPUT_SPECKLE_AUTOMATE_URL: automateUrl,
  GITHUB_SHA: 'commitSha',
  GITHUB_REF_TYPE: 'commit',
  GITHUB_REF_NAME: 'version'
})

// Stub each provided environment variable. A value of `null` means "leave this
// variable unset", which lets a test simulate an omitted optional input.
const applyEnv = (env: Record<string, string | null>): void => {
  for (const [key, value] of Object.entries(env)) {
    if (value === null) continue
    vi.stubEnv(key, value)
  }
}

describe('Register new version', () => {
  let tmpDir: string
  let countHappyPath = 0
  let count500Errors = 0
  let count422Errors = 0

  const error422 = {
    type: 'H3Error',
    message: 'Body parsing failed',
    stack: `Error: Body parsing failed
            at createError...`,
    statusCode: 422,
    fatal: false,
    unhandled: false,
    statusMessage: 'Body parsing failed',
    data: {
      type: 'ZodError',
      message:
        '[\n  {\n    "code": "custom",\n    "message": "Invalid JSON schema: strict mode: unknown keyword: \\"IAmInvalid\\"",\n    "path": [\n      "inputSchema"\n    ]\n  }\n]',
      stack: {
        ZodError: [
          {
            code: 'custom',
            message: 'Invalid JSON schema: strict mode: unknown keyword: "IAmInvalid"',
            path: ['inputSchema']
          }
        ]
      },
      aggregateErrors: [
        {
          type: 'Object',
          message: 'Invalid JSON schema: strict mode: unknown keyword: "IAmInvalid"',
          stack: {},
          code: 'custom',
          path: ['inputSchema']
        }
      ],
      issues: [
        {
          code: 'custom',
          message: 'Invalid JSON schema: strict mode: unknown keyword: "IAmInvalid"',
          path: ['inputSchema']
        }
      ],
      name: 'ZodError'
    }
  }

  const server = setupServer(
    http.post(versionsUrl('fake_function_id'), async ({ request }) => {
      const parseResult = FunctionVersionRequestSchema.safeParse(await request.json())
      expect(parseResult.success).toBe(true)
      countHappyPath++
      return new HttpResponse(JSON.stringify({ versionId: 'fake_version_id' }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }),
    http.post(versionsUrl('network_error'), async ({ request }) => {
      const parseResult = FunctionVersionRequestSchema.safeParse(await request.json())
      expect(parseResult.success).toBe(true)
      return HttpResponse.error() // simulates a network error
    }),
    http.post(versionsUrl('422_response'), async ({ request }) => {
      const parseResult = FunctionVersionRequestSchema.safeParse(await request.json())
      expect(parseResult.success).toBe(true)
      count422Errors++
      return HttpResponse.json(error422, {
        status: 422
      })
    }),
    http.post(versionsUrl('500_response'), async ({ request }) => {
      const parseResult = FunctionVersionRequestSchema.safeParse(await request.json())
      expect(parseResult.success).toBe(true)
      count500Errors++
      return HttpResponse.json(
        {},
        {
          status: 500
        }
      )
    })
  )

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

  afterAll(() => server.close())

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'speckle-automate-github-action-test-'))
    // Reset the request counters here rather than at the end of each test so
    // that a test failing midway cannot poison the counts seen by later tests.
    countHappyPath = 0
    count500Errors = 0
    count422Errors = 0
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true })
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    server.resetHandlers()
  })

  it('sends the request', async () => {
    writeFileSync(join(tmpDir, 'schema.json'), '{}')
    applyEnv({
      ...baseEnv(tmpDir),
      INPUT_SPECKLE_FUNCTION_RECOMMENDED_CPU_M: '1000',
      INPUT_SPECKLE_FUNCTION_RECOMMENDED_MEMORY_MI: '500'
    })
    await expect(run()).resolves.not.toThrow()
    expect(countHappyPath).toBe(1)
  })

  it('sends the expected request body and sets the action outputs', async () => {
    let capturedBody: Record<string, unknown> | undefined
    server.use(
      http.post(versionsUrl('fake_function_id'), async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ versionId: 'fake_version_id' }, { status: 201 })
      })
    )
    const setOutput = vi.spyOn(core, 'setOutput')
    const setSecret = vi.spyOn(core, 'setSecret')

    writeFileSync(join(tmpDir, 'schema.json'), '{"type":"object"}')
    applyEnv({
      ...baseEnv(tmpDir),
      INPUT_SPECKLE_FUNCTION_RECOMMENDED_CPU_M: '1000',
      INPUT_SPECKLE_FUNCTION_RECOMMENDED_MEMORY_MI: '500'
    })

    await expect(run()).resolves.not.toThrow()

    expect(capturedBody).toMatchObject({
      // GITHUB_SHA 'commitSha' is truncated to the first 7 characters
      commitId: 'commitS',
      versionTag: 'v1.0.0',
      // NOTE: the command is naively split on spaces, so a quoted argument is
      // broken apart. This assertion documents that (arguably buggy) behaviour.
      command: ['echo', '"hello', 'automate"'],
      inputSchema: { type: 'object' },
      recommendedCPUm: 1000,
      recommendedMemoryMi: 500
    })

    // the token must be registered as a secret so it is masked in the logs
    expect(setSecret).toHaveBeenCalledWith('{token}')
    expect(setOutput).toHaveBeenCalledWith(
      'speckle_automate_function_release_id',
      'fake_version_id'
    )
    expect(setOutput).toHaveBeenCalledWith(
      'speckle_automate_host',
      'myfakeautomate.speckle.internal'
    )
  })

  it('omits the recommended CPU and memory from the request body when not provided', async () => {
    let capturedBody: Record<string, unknown> | undefined
    server.use(
      http.post(versionsUrl('fake_function_id'), async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ versionId: 'fake_version_id' }, { status: 201 })
      })
    )

    writeFileSync(join(tmpDir, 'schema.json'), '{}')
    applyEnv(baseEnv(tmpDir)) // deliberately no CPU / memory inputs

    await expect(run()).resolves.not.toThrow()

    // JSON.stringify drops `undefined` values, so the keys should be absent
    expect(capturedBody).toBeDefined()
    expect('recommendedCPUm' in (capturedBody as object)).toBe(false)
    expect('recommendedMemoryMi' in (capturedBody as object)).toBe(false)
  })

  it('handles network errors', async () => {
    writeFileSync(join(tmpDir, 'schema.json'), '{}')
    applyEnv({ ...baseEnv(tmpDir), INPUT_SPECKLE_FUNCTION_ID: 'network_error' })
    await expect(run()).rejects.toThrow(
      'Failed to register new function version to the automate server'
    )
  })

  it('handles 500 responses', async () => {
    writeFileSync(join(tmpDir, 'schema.json'), '{}')
    applyEnv({ ...baseEnv(tmpDir), INPUT_SPECKLE_FUNCTION_ID: '500_response' })
    await expect(run()).rejects.toThrow(
      'Failed to register new function version to the automate server'
    )
    expect(count500Errors).toBeGreaterThan(1) // we expect the action to retry the request
  })

  it('retries exactly maxAttempts (5) times on repeated 500 responses', async () => {
    let attempts = 0
    server.use(
      http.post(versionsUrl('fake_function_id'), async () => {
        attempts++
        return HttpResponse.json({}, { status: 500 })
      })
    )
    writeFileSync(join(tmpDir, 'schema.json'), '{}')
    applyEnv(baseEnv(tmpDir))
    await expect(run()).rejects.toThrow(
      'Failed to register new function version to the automate server'
    )
    // `maxAttempts: 5` in the retry configuration means the initial attempt plus
    // four retries: five requests in total.
    expect(attempts).toBe(5)
  })

  it('handles 422 responses', async () => {
    writeFileSync(join(tmpDir, 'schema.json'), '{}')
    applyEnv({ ...baseEnv(tmpDir), INPUT_SPECKLE_FUNCTION_ID: '422_response' })
    await expect(run()).rejects.toThrow(
      'Failed to register new function version to the automate server'
    )
    expect(count422Errors).toBe(1) // we expect the action not to retry the request
  })

  it('does not retry on a 401 unauthorized response', async () => {
    let attempts = 0
    server.use(
      http.post(versionsUrl('fake_function_id'), async () => {
        attempts++
        return HttpResponse.json({ message: 'unauthorized' }, { status: 401 })
      })
    )
    writeFileSync(join(tmpDir, 'schema.json'), '{}')
    applyEnv(baseEnv(tmpDir))
    await expect(run()).rejects.toThrow(
      'Failed to register new function version to the automate server'
    )
    // a 4xx is a client error; retrying it would be pointless, so we expect a
    // single attempt
    expect(attempts).toBe(1)
  })

  it('fails when the response is missing the versionId', async () => {
    server.use(
      http.post(versionsUrl('fake_function_id'), async () =>
        // a 2xx with an empty body should still be rejected by the response schema
        HttpResponse.json({}, { status: 201 })
      )
    )
    writeFileSync(join(tmpDir, 'schema.json'), '{}')
    applyEnv(baseEnv(tmpDir))
    await expect(run()).rejects.toThrow(/versionId/)
  })

  it('fails when the input schema file does not exist', async () => {
    // deliberately do NOT create schema.json
    applyEnv(baseEnv(tmpDir))
    await expect(run()).rejects.toThrow(/ENOENT/)
  })

  it('fails when the input schema file contains malformed JSON', async () => {
    writeFileSync(join(tmpDir, 'schema.json'), 'this is not valid json')
    applyEnv(baseEnv(tmpDir))
    await expect(run()).rejects.toThrow(/JSON/)
  })

  it('fails when HOME is undefined and the schema path is relative', async () => {
    writeFileSync(join(tmpDir, 'schema.json'), '{}')
    applyEnv({ ...baseEnv(tmpDir), HOME: '' }) // an empty HOME is treated as undefined
    await expect(run()).rejects.toThrow('The home directory is not defined')
  })

  it('accepts an absolute input schema file path', async () => {
    let capturedBody: Record<string, unknown> | undefined
    server.use(
      http.post(versionsUrl('fake_function_id'), async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ versionId: 'fake_version_id' }, { status: 201 })
      })
    )
    const absoluteSchemaPath = join(tmpDir, 'absolute-schema.json')
    writeFileSync(absoluteSchemaPath, '{"absolute":true}')
    applyEnv({
      ...baseEnv(tmpDir),
      // an absolute path must be used verbatim, ignoring HOME entirely
      HOME: '/this/home/should/be/ignored',
      INPUT_SPECKLE_FUNCTION_INPUT_SCHEMA_FILE_PATH: absoluteSchemaPath
    })
    await expect(run()).resolves.not.toThrow()
    expect(capturedBody).toMatchObject({ inputSchema: { absolute: true } })
  })

  it('fails when the optional schema path is omitted (documents EISDIR bug)', async () => {
    // An empty input path is what GitHub supplies for an omitted optional input.
    // Because `isAbsolute('')` is false, the code joins it onto HOME and ends up
    // trying to read the home directory itself, which throws EISDIR. This test
    // documents that the "optional" schema input currently cannot be omitted.
    applyEnv({ ...baseEnv(tmpDir), INPUT_SPECKLE_FUNCTION_INPUT_SCHEMA_FILE_PATH: '' })
    await expect(run()).rejects.toThrow(/EISDIR/)
  })

  it('rejects an invalid automate url', async () => {
    writeFileSync(join(tmpDir, 'schema.json'), '{}')
    applyEnv({ ...baseEnv(tmpDir), INPUT_SPECKLE_AUTOMATE_URL: 'not-a-valid-url' })
    await expect(run()).rejects.toThrow(/speckleAutomateUrl/)
  })

  it('rejects a release tag that violates the OCI tag format', async () => {
    writeFileSync(join(tmpDir, 'schema.json'), '{}')
    // a leading hyphen is not permitted by the regex (first char must be
    // alphanumeric or underscore)
    applyEnv({ ...baseEnv(tmpDir), INPUT_SPECKLE_FUNCTION_RELEASE_TAG: '-invalid-tag' })
    await expect(run()).rejects.toThrow(/speckleFunctionReleaseTag/)
  })

  it('accepts a release tag of exactly 128 characters', async () => {
    writeFileSync(join(tmpDir, 'schema.json'), '{}')
    const tag = `a${'b'.repeat(127)}` // 128 characters, the documented maximum
    applyEnv({ ...baseEnv(tmpDir), INPUT_SPECKLE_FUNCTION_RELEASE_TAG: tag })
    await expect(run()).resolves.not.toThrow()
    expect(countHappyPath).toBe(1)
  })

  it('rejects a recommended CPU below the allowed minimum', async () => {
    writeFileSync(join(tmpDir, 'schema.json'), '{}')
    applyEnv({ ...baseEnv(tmpDir), INPUT_SPECKLE_FUNCTION_RECOMMENDED_CPU_M: '50' })
    await expect(run()).rejects.toThrow(/speckleFunctionRecommendedCPUm/)
  })

  it('rejects a recommended memory above the allowed maximum', async () => {
    writeFileSync(join(tmpDir, 'schema.json'), '{}')
    applyEnv({
      ...baseEnv(tmpDir),
      INPUT_SPECKLE_FUNCTION_RECOMMENDED_MEMORY_MI: '99999'
    })
    await expect(run()).rejects.toThrow(/speckleFunctionRecommendedMemoryMi/)
  })

  it('sends a memory value the client accepts but the server rejects (client/server bound mismatch)', async () => {
    // The client schema permits recommendedMemoryMi up to 60000, but the server
    // schema (mirrored by FunctionVersionRequestSchema) only permits up to 8000.
    // A value in that gap passes client validation and is sent, but the server
    // rejects it with a 422. This documents the divergent validation bounds.
    server.use(
      http.post(versionsUrl('fake_function_id'), async ({ request }) => {
        const parseResult = FunctionVersionRequestSchema.safeParse(await request.json())
        if (!parseResult.success) {
          return HttpResponse.json(parseResult.error, { status: 422 })
        }
        return HttpResponse.json({ versionId: 'fake_version_id' }, { status: 201 })
      })
    )
    writeFileSync(join(tmpDir, 'schema.json'), '{}')
    applyEnv({
      ...baseEnv(tmpDir),
      INPUT_SPECKLE_FUNCTION_RECOMMENDED_MEMORY_MI: '50000'
    })
    await expect(run()).rejects.toThrow(
      'Failed to register new function version to the automate server'
    )
  })

  it('errors if the token is empty', async () => {
    writeFileSync(join(tmpDir, 'schema.json'), '{}')
    applyEnv({ ...baseEnv(tmpDir), INPUT_SPECKLE_TOKEN: '' })
    await expect(run()).rejects.toThrow(
      'Input required and not supplied: speckle_token'
    )
  })

  it('errors if the environment variable is empty', async () => {
    writeFileSync(join(tmpDir, 'schema.json'), '{}')
    applyEnv({ ...baseEnv(tmpDir), GITHUB_SHA: '' })
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
