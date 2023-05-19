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
      it('should respond to client with image name, function id, and version id', async () => {
        server.use(
          rest.post(
            'https://success.automate.speckle.example.org/api/v1/functions/functionid/versions',
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
                  versionId: 'minimalversionid'
                })
              )
              return response
            }
          )
        )

        const test = httpClient.postManifest(
          'https://success.automate.speckle.example.org',
          'supersecret',
          'functionid',
          {
            versionTag: 'main',
            commitId: '1234567890',
            inputSchema: {},
            steps: [],
            annotations: getMinimalSpeckleFunctionExample()?.metadata?.annotations
          },
          getLogger(),
          fetch,
          fakeErrorHandler
        )

        await expect(test).resolves.toStrictEqual({
          versionId: 'minimalversionid'
        })
      })
    })
    describe('server responds with a 500 HTTP Status Code', () => {
      it('should throw an error', async () => {
        server.use(
          rest.post(
            'https://failure.automate.speckle.example.org/api/v1/functions/functionid/versions',
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
            'functionid',
            {
              versionTag: '',
              commitId: '',
              steps: [],
              inputSchema: {},
              annotations: getMinimalSpeckleFunctionExample()?.metadata?.annotations
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
            'https://unexpectedresponse.automate.speckle.example.org/api/v1/functions/functionid/versions',
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
            'functionid',
            {
              versionTag: '',
              commitId: '',
              steps: [],
              inputSchema: {},
              annotations: getMinimalSpeckleFunctionExample()?.metadata?.annotations
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
          await expect(
            httpClient.postManifest(
              '',
              'supersecret',
              'functionid',
              {
                versionTag: 'main',
                commitId: '1234567890',
                steps: [],
                inputSchema: {},
                annotations: getMinimalSpeckleFunctionExample()?.metadata?.annotations
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
          await expect(
            httpClient.postManifest(
              'https://example.org',
              '',
              'functionid',
              {
                versionTag: 'main',
                commitId: '1234567890',
                inputSchema: {},
                steps: [],
                annotations: getMinimalSpeckleFunctionExample()?.metadata?.annotations
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
      expect(context.aborted).toBeFalsy()
      defaultClientErrorHandler('🚨', context)
      expect(context.aborted).toBeTruthy()
    })
    it('aborts when the error is a fetch abort error', () => {
      const context = createFakeContext()
      expect(context.aborted).toBeFalsy()
      defaultClientErrorHandler(new AbortError('aborting'), context)
      expect(context.aborted).toBeTruthy()
    })
    it('aborts when the error is a fetch error', () => {
      const context = createFakeContext()
      expect(context.aborted).toBeFalsy()
      defaultClientErrorHandler(new FetchError('not found', 'ENOTFOUND'), context)
      expect(context.aborted).toBeTruthy()
    })
    it('does not abort when the error is a retryable error', () => {
      const context = createFakeContext()
      expect(context.aborted).toBeFalsy()
      defaultClientErrorHandler(new RetryableError('retryable'), context)
      expect(context.aborted).toBeFalsy()
    })
  })
  describe('throwErrorOnClientErrorStatusCode', () => {
    it('does not throw an error on 2xx', async () => {
      const result = throwErrorOnClientErrorStatusCode(async () => {
        return { body: '', status: 200 }
      })()
      await expect(result).resolves.toStrictEqual({ body: '', status: 200 })
    })
    it('does not throw an error on 3xx', async () => {
      const result = throwErrorOnClientErrorStatusCode(async () => {
        return { body: '', status: 300 }
      })()
      await expect(result).resolves.toStrictEqual({ body: '', status: 300 })
    })
    it('throws an error on 4xx', async () => {
      const result = throwErrorOnClientErrorStatusCode(async () => {
        return { body: '', status: 400 }
      })()
      await expect(result).rejects.toThrow(NonRetryableError)
    })
    it('throws an error on 5xx', async () => {
      const result = throwErrorOnClientErrorStatusCode(async () => {
        return { body: '', status: 500 }
      })()
      await expect(result).rejects.toThrow(RetryableError)
    })
    it('fetch errors are passed through', async () => {
      const result = throwErrorOnClientErrorStatusCode(async () => {
        throw new FetchError('not found', 'ENOTFOUND')
      })()
      await expect(result).rejects.toThrow(FetchError)
    })
    it('abort errors are passed through', async () => {
      const result = throwErrorOnClientErrorStatusCode(async () => {
        throw new AbortError('aborting error')
      })()
      await expect(result).rejects.toThrow(AbortError)
    })
    it('unknown errors are passed through', async () => {
      const result = throwErrorOnClientErrorStatusCode(async () => {
        throw new Error('unknown error')
      })()
      await expect(result).rejects.toThrow(Error)
    })
  })
})
