import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import { rest } from 'msw'
import { registerSpeckleFunction } from '../registerspecklefunction.js'
import { getLogger } from './logger.js'
import { getMinimalSpeckleFunctionExample } from '../schema/specklefunction.spec.js'
import { ValidationError } from 'zod-validation-error'

describe('integration', () => {
  const server = setupServer()

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })
  afterAll(() => {
    server.close()
  })
  afterEach(() => {
    server.resetHandlers()
  })

  describe('Load from ./examples directory', () => {
    describe('registerSpeckleAutomate', () => {
      describe('valid input', () => {
        it('should respond with image name, function id, and version id', async () => {
          server.use(
            rest.post(
              'https://integration1.automate.speckle.example.org/api/v1/functions/functionid/versions',
              async (req, res, ctx) => {
                expect(await req.json()).toStrictEqual({
                  versionTag: 'main',
                  commitId: '1234567890',
                  steps: [],
                  inputSchema: {},
                  annotations: getMinimalSpeckleFunctionExample().metadata?.annotations
                })
                expect(req.headers.get('Authorization')).toBe('Bearer supersecret')
                const response = await res(
                  ctx.status(201),
                  ctx.json({
                    functionId: 'minimalfunctionid',
                    versionId: 'minimalversionid',
                    imageName: 'speckle/minimalfunctionid:minimalversionid'
                  })
                )
                return response
              }
            )
          )
          const result = registerSpeckleFunction({
            speckleFunctionId: 'functionid',
            speckleServerUrl: 'https://integration1.automate.speckle.example.org',
            speckleToken: 'supersecret',
            speckleFunctionPath: 'examples/minimal',
            versionTag: 'main',
            commitId: '1234567890',
            logger: getLogger(),
            fileSystem: {
              loadYaml: async () => getMinimalSpeckleFunctionExample()
            }
          })
          await expect(result).resolves.toStrictEqual({
            functionId: 'minimalfunctionid',
            versionId: 'minimalversionid',
            imageName: 'speckle/minimalfunctionid:minimalversionid'
          })
        })
      })
      describe('invalid input', () => {
        it('should throw an error', async () => {
          await expect(async () =>
            registerSpeckleFunction({
              speckleFunctionId: 'functionid',
              speckleServerUrl: 'https://integration1.automate.speckle.example.org',
              speckleToken: '',
              speckleFunctionPath: undefined,
              versionTag: '',
              commitId: '',
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
