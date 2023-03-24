import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import { rest } from 'msw'
import { getMinimalSpeckleFunctionExample } from '../schema/specklefunction.spec.js'
import httpClient, {
  defaultClientErrorHandler,
  throwErrorOnClientErrorStatusCode,
  NonRetryableError,
  RetryableError
} from './client.js'
import { getLogger } from '../tests/logger.js'
import { SpeckleFunction } from '../schema/specklefunction.js'
import { ValidationError } from 'zod-validation-error'
import { AttemptContext } from '@lifeomic/attempt'
import fetch, { AbortError, FetchError } from 'node-fetch'

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

  function createFakeContext(): AttemptContext {
    return {
      attemptNum: 0,
      attemptsRemaining: 0,
      aborted: false,
      abort() {
        this.aborted = true
      }
    }
  }

  function fakeErrorHandler(error: unknown, context: AttemptContext) {
    const fakeContext = createFakeContext()
    defaultClientErrorHandler(error, createFakeContext())
    context.aborted = fakeContext.aborted
  }

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
          getLogger(),
          fetch,
          fakeErrorHandler
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
            getLogger(),
            fetch,
            fakeErrorHandler
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
            getLogger(),
            fetch,
            fakeErrorHandler
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
              getLogger(),
              fetch,
              fakeErrorHandler
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
              getLogger(),
              fetch,
              fakeErrorHandler
            )
          ).rejects.toThrow(Error)
        })
      })
    })
  })
  describe('defaultClientErrorHandler', () => {
    it('aborts unknown errors', () => {
      const context = createFakeContext()
      expect(context.aborted).to.be.false
      defaultClientErrorHandler('🚨', context)
      expect(context.aborted).to.be.true
    })
    it('aborts when the error is a fetch abort error', () => {
      const context = createFakeContext()
      expect(context.aborted).to.be.false
      defaultClientErrorHandler(new AbortError('aborting'), context)
      expect(context.aborted).to.be.true
    })
    it('aborts when the error is a fetch error', () => {
      const context = createFakeContext()
      expect(context.aborted).to.be.false
      defaultClientErrorHandler(new FetchError('not found', 'ENOTFOUND'), context)
      expect(context.aborted).to.be.true
    })
    it('does not abort when the error is a retryable error', () => {
      const context = createFakeContext()
      expect(context.aborted).to.be.false
      defaultClientErrorHandler(new RetryableError('retryable'), context)
      expect(context.aborted).to.be.false
    })
  })
  describe('throwErrorOnClientErrorStatusCode', () => {
    it('does not throw an error on 2xx', async () => {
      const result = throwErrorOnClientErrorStatusCode(async () => {
        return { body: '', status: 200 }
      })()
      expect(result).resolves.toStrictEqual({ body: '', status: 200 })
    })
    it('does not throw an error on 3xx', async () => {
      const result = throwErrorOnClientErrorStatusCode(async () => {
        return { body: '', status: 300 }
      })()
      expect(result).resolves.toStrictEqual({ body: '', status: 300 })
    })
    it('throws an error on 4xx', async () => {
      const result = throwErrorOnClientErrorStatusCode(async () => {
        return { body: '', status: 400 }
      })()
      expect(result).rejects.toThrow(NonRetryableError)
    })
    it('throws an error on 5xx', async () => {
      const result = throwErrorOnClientErrorStatusCode(async () => {
        return { body: '', status: 500 }
      })()
      expect(result).rejects.toThrow(RetryableError)
    })
    it('fetch errors are passed through', async () => {
      const result = throwErrorOnClientErrorStatusCode(async () => {
        throw new FetchError('not found', 'ENOTFOUND')
      })()
      expect(result).rejects.toThrow(FetchError)
    })
    it('abort errors are passed through', async () => {
      const result = throwErrorOnClientErrorStatusCode(async () => {
        throw new AbortError('aborting error')
      })()
      expect(result).rejects.toThrow(AbortError)
    })
    it('unknown errors are passed through', async () => {
      const result = throwErrorOnClientErrorStatusCode(async () => {
        throw new Error('unknown error')
      })()
      expect(result).rejects.toThrow(Error)
    })
  })
})
