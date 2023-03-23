import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import { rest } from 'msw'
import { getMinimalSpeckleFunctionExample } from '../schema/specklefunction.spec.js'
import httpClient from './client.js'
import { getLogger } from '../tests/logger.js'
import { SpeckleFunction } from '../schema/specklefunction.js'
import { ValidationError } from 'zod-validation-error'

describe('client', () => {
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
  describe('postManifest', () => {
    describe('valid input', () => {
      it('should respond with image name, function id, and version id', async () => {
        server.use(
          rest.post(
            'https://success.automate.speckle.example.org/api/v1/functions',
            async (req, res, ctx) => {
              expect(await req.json()).toStrictEqual({
                functionId: null,
                url: 'https://github.com/specklesystems/speckle-automate-examples',
                path: 'examples/minimal',
                ref: 'main',
                commitSha: '1234567890',
                manifest: getMinimalSpeckleFunctionExample()
              })
              expect(req.headers.get('Authorization')).to.equal('Bearer supersecret')
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

        const test = httpClient.postManifest(
          'https://success.automate.speckle.example.org',
          'supersecret',
          {
            functionId: null,
            path: 'examples/minimal',
            url: 'https://github.com/specklesystems/speckle-automate-examples',
            ref: 'main',
            commitSha: '1234567890',
            manifest: getMinimalSpeckleFunctionExample() as SpeckleFunction
          },
          getLogger()
        )

        await expect(test).resolves.toStrictEqual({
          functionId: 'minimalfunctionid',
          versionId: 'minimalversionid',
          imageName: 'speckle/minimalfunctionid:minimalversionid'
        })
      })
    })
    describe('server responds with a 500 HTTP Status Code', () => {
      it('should throw an error', async () => {
        server.use(
          rest.post(
            'https://failure.automate.speckle.example.org/api/v1/functions',
            async (req, res, ctx) => {
              const response = await res(ctx.status(500))
              return response
            }
          )
        )
        await expect(
          httpClient.postManifest(
            'https://failure.automate.speckle.example.org',
            'sometoken',
            {
              functionId: null,
              path: '',
              url: '',
              ref: '',
              commitSha: '',
              manifest: getMinimalSpeckleFunctionExample() as SpeckleFunction
            },
            getLogger()
          )
        ).rejects.toThrow()
      })
    })
    describe('server responds with an unexpected response body', () => {
      it('should throw an error', async () => {
        server.use(
          rest.post(
            'https://unexpectedresponse.automate.speckle.example.org/api/v1/functions',
            async (req, res, ctx) => {
              const response = await res(
                ctx.status(201),
                ctx.json({
                  unexpected: 'unexpected'
                })
              )
              return response
            }
          )
        )

        await expect(
          httpClient.postManifest(
            'https://unexpectedresponse.automate.speckle.example.org',
            'sometoken',
            {
              functionId: null,
              path: '',
              url: '',
              ref: '',
              commitSha: '',
              manifest: getMinimalSpeckleFunctionExample() as SpeckleFunction
            },
            getLogger()
          )
        ).rejects.toThrow(ValidationError)
      })
    })
    describe('invalid input', () => {
      describe('empty url', () => {
        it('should throw an error', async () => {
          expect(
            httpClient.postManifest(
              '',
              'supersecret',
              {
                functionId: null,
                path: 'examples/minimal',
                url: 'https://github.com/specklesystems/speckle-automate-examples',
                ref: 'main',
                commitSha: '1234567890',
                manifest: getMinimalSpeckleFunctionExample() as SpeckleFunction
              },
              getLogger()
            )
          ).rejects.toThrow(Error)
        })
      })
      describe('empty token', () => {
        it('should throw an error', async () => {
          expect(
            httpClient.postManifest(
              'https://example.org',
              '',
              {
                functionId: null,
                path: 'examples/minimal',
                url: 'https://github.com/specklesystems/speckle-automate-examples',
                ref: 'main',
                commitSha: '1234567890',
                manifest: getMinimalSpeckleFunctionExample() as SpeckleFunction
              },
              getLogger()
            )
          ).rejects.toThrow(Error)
        })
      })
    })
  })
})
