import {
  SpeckleFunctionPostResponseBody,
  SpeckleFunctionPostResponseBodySchema,
  FunctionVersionRequest
} from './schema.js'
import { URL } from 'url'
import { handleZodError } from '../schema/errors.js'
import { Logger } from '../logging/logger.js'
import fetch, { Response } from 'node-fetch'
import { AttemptContext, HandleError, retry } from '@lifeomic/attempt'

export default {
  postManifest: async (
    url: string,
    token: string,
    functionId: string,
    body: FunctionVersionRequest,
    logger: Logger,
    _fetch: typeof fetch = fetch,
    errorHandler = defaultClientErrorHandler
  ): Promise<SpeckleFunctionPostResponseBody> => {
    if (!url) throw new Error('Speckle Server URL is required')
    if (!token) throw new Error('Speckle Token is required')

    const endpointUrl = new URL(`/api/v1/functions/${functionId}/versions`, url)
    let responseBodyStream: NodeJS.ReadableStream | null
    try {
      responseBodyStream = await retryAPIRequest(
        throwErrorOnClientErrorStatusCode(async () =>
          _fetch(endpointUrl.href, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              authorization: `Bearer ${token}`
            },
            body: JSON.stringify(body)
          })
        ),
        errorHandler
      )
    } catch (err) {
      throw new Error(`Failed to register Speckle Function: ${err}`, { cause: err }) //FIXME use a more specific error type
    }

    const response = new Response(responseBodyStream)
    let responseBody: SpeckleFunctionPostResponseBody
    try {
      responseBody = SpeckleFunctionPostResponseBodySchema.parse(await response.json())
    } catch (err) {
      throw handleZodError(err, logger)
    }

    return responseBody
  }
}

export function defaultClientErrorHandler(
  error: unknown,
  context: AttemptContext
): void {
  if (isNonRetryableError(error)) {
    context.abort()
  }
}

function isNonRetryableError(error: unknown) {
  return !(error instanceof RetryableError)
}

export function throwErrorOnClientErrorStatusCode<T>(
  apiRequest: () => Promise<{ body: T; status: number }>
): () => Promise<{ body: T; status: number }> {
  return async () => {
    const response = await apiRequest()
    // do not retry our failures
    if (response.status >= 400 && response.status < 500)
      throw new NonRetryableError(
        `Status code indicates a client error. Not retrying. (${
          response.status
        }; ${JSON.stringify(response.body)})`
      )
    if (response.status >= 500)
      throw new RetryableError(
        `Status code indicates a server error. Retrying. (${
          response.status
        }; ${JSON.stringify(response.body)})`
      )
    return response
  }
}

export async function retryAPIRequest<T>(
  apiRequest: () => Promise<{ body: T; status: number }>,
  errorHandler: HandleError<{ body: T; status: number }>
): Promise<T> {
  const { body } = await retry(apiRequest, {
    delay: 200,
    factor: 2,
    maxAttempts: 5,
    minDelay: 100,
    maxDelay: 500,
    jitter: true,
    handleError: errorHandler
  })
  return body
}

export class RetryableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RetryableError'
  }
}

export class NonRetryableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NonRetryableError'
  }
}
