import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { rest } from 'msw'
import { registerSpeckleFunction } from '../speckleautomate.js'
import { getLogger } from './logger.js'

describe('integration', () => {
  const restHandlers = [
    rest.post(
      'https://automate.speckle.example.org/api/v1/functions',
      async (req, res, ctx) => {
        return res(
          ctx.status(201),
          ctx.json({
            functionId: 'minimalfunctionid',
            versionId: 'minimalversionid',
            imageName: 'speckle/minimalfunctionid:minimalversionid'
          })
        )
      }
    )
  ]

  const server = setupServer(...restHandlers)

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })
  afterAll(() => {
    server.close()
  })
  afterEach(() => {
    server.resetHandlers()
    vi.restoreAllMocks()
  })

  describe('Load from ./examples directory', () => {
    describe('registerSpeckleAutomate', () => {
      it('should respond with Function name and id', async () => {
        const result = await registerSpeckleFunction({
          speckleFunctionId: undefined,
          speckleServerUrl: 'https://automate.speckle.example.org', // should default to 'https://automate.speckle.xyz',
          speckleToken: 'token',
          speckleFunctionPath: 'examples/minimal',
          ref: 'main',
          commitsha: '1234567890',
          logger: getLogger()
        })

        expect(result.functionId).to.equal('minimalfunctionid')
        expect(result.versionId).to.equal('minimalversionid')
        expect(result.imageName).to.equal('speckle/minimalfunctionid:minimalversionid')
      })
    })
  })
})
