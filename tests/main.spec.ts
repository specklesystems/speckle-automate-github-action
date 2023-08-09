import { run } from '../src/main.js'
import { describe, it, vi } from 'vitest'

describe('Register new version', () => {
  it('send the request', async () => {
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_ID', '{fake}')
    vi.stubEnv('INPUT_SPECKLE_TOKEN', '{token}')
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_COMMAND', 'echo "hello automate"')
    vi.stubEnv('INPUT_SPECKLE_FUNCTION_INPUT_SCHEMA', '{}')
    vi.stubEnv('INPUT_SPECKLE_AUTOMATE_URL', 'http://automate.speckle.internal:3030')
    vi.stubEnv('GITHUB_SHA', 'commitSha')
    vi.stubEnv('GITHUB_REF_TYPE', 'commit')
    vi.stubEnv('GITHUB_REF_NAME', 'version')
    await run()
  })
})
