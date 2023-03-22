import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import { rest } from 'msw'
import { registerSpeckleFunction } from '../registerspecklefunction.js'
import { getLogger } from './logger.js'
import { getMinimalSpeckleFunctionExample } from '../schema/specklefunction.spec.js'
import { ValidationError } from 'zod-validation-error'

describe('integration', () => {
  const restHandlers = [
    rest.post(
      'https://integration1.automate.speckle.example.org/api/v1/functions',
      async (req, res, ctx) => {
        expect(req.body).toStrictEqual({
          functionId: null,
          url: 'https://github.com/specklesystems/speckle-automate-examples.git',
          path: 'examples/minimal',
          ref: 'main',
          commitSha: '1234567890',
          manifest: getMinimalSpeckleFunctionExample()
        })
        expect(req.headers.get('Authorization')).toBe('Bearer supersecret')
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
  })

  describe('Load from ./examples directory', async () => {
    describe('registerSpeckleAutomate', async () => {
      describe('valid input', async () => {
        it('should respond with image name, function id, and version id', async () => {
          const result = await registerSpeckleFunction({
            speckleFunctionId: undefined,
            speckleServerUrl: 'https://integration1.automate.speckle.example.org',
            speckleToken: 'supersecret',
            speckleFunctionRepositoryUrl:
              'https://github.com/specklesystems/speckle-automate-examples.git',
            speckleFunctionPath: 'examples/minimal',
            ref: 'main',
            commitsha: '1234567890',
            logger: getLogger(),
            fileSystem: {
              loadYaml: async () => getMinimalSpeckleFunctionExample()
            }
          })

          expect(result.functionId).to.equal('minimalfunctionid')
          expect(result.versionId).to.equal('minimalversionid')
          expect(result.imageName).to.equal(
            'speckle/minimalfunctionid:minimalversionid'
          )
        })
      })
      describe('invalid input', async () => {
        it('should throw an error', async () => {
          expect(async () =>
            registerSpeckleFunction({
              speckleFunctionId: undefined,
              speckleServerUrl: undefined,
              speckleToken: '',
              speckleFunctionRepositoryUrl: '',
              speckleFunctionPath: undefined,
              ref: undefined,
              commitsha: undefined,
              logger: getLogger(),
              fileSystem: {
                loadYaml: async () => getMinimalSpeckleFunctionExample()
              }
            })
          ).rejects.toThrow(ValidationError)
        })
      })
    })
  })
})
