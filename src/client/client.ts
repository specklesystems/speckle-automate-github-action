import {
  SpeckleFunctionPostResponseBody,
  SpeckleFunctionPostResponseBodySchema,
  SpeckleFunctionPostRequestBody
} from './schema.js'
import { URL } from 'url'
import { handleZodError } from '../schema/errors.js'
import { Logger } from '../logging/logger.js'
import fetch from 'node-fetch'

export default {
  postManifest: async (
    url: string,
    token: string,
    body: SpeckleFunctionPostRequestBody,
    logger: Logger
  ): Promise<SpeckleFunctionPostResponseBody> => {
    if (!url) throw new Error('Speckle Server URL is required')
    if (!token) throw new Error('Speckle Token is required')
    if (!body) throw new Error('Speckle Function Post Request Body is required')
    if (!logger) throw new Error('Logger is required')

    const endpointUrl = new URL('/api/v1/functions', url)
    const response = await fetch(endpointUrl.href, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error(
        `Failed to register Speckle Function. Status Code: ${
          response.status
        }. Status Text: ${response.statusText}. Response Body: ${await response.text()}`
      ) //FIXME use a more specific error type
    }

    let responseBody: SpeckleFunctionPostResponseBody
    try {
      responseBody = SpeckleFunctionPostResponseBodySchema.parse(await response.json())
    } catch (err) {
      throw handleZodError(err, logger)
    }

    return responseBody
  }
}
