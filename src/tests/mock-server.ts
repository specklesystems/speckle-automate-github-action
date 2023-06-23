import {
  eventHandler,
  createApp,
  createRouter,
  H3Event,
  toNodeListener,
  readBody,
  sendError,
  createError
} from 'h3'
import { listen } from 'listhen'
import { getPort } from 'get-port-please'
import { z } from 'zod'
import { SpeckleFunctionPostResponseBody } from '../client/schema.js'

async function run() {
  const hostname = '127.0.0.1'
  const app = createApp({ debug: false })
  const router = createRouter().post(
    '/api/v1/functions/functionid/versions',
    eventHandler(async (event: H3Event): Promise<SpeckleFunctionPostResponseBody> => {
      try {
        const body = await readBody(event)
        FunctionVersionRequestSchema.parse(body) // throw error if invalid
        event.node.res.statusCode = 201
        event.node.res.statusMessage = 'Created'
        event.node.res.setHeader('Content-Type', 'application/json')
      } catch (err) {
        sendError(
          event,
          createError({
            status: 422,
            statusText: 'Unprocessable Entity'
          })
        )
      }

      return {
        versionId: 'minimalversionid'
      }
    })
  )
  app.use(router)
  const port = await getPort(3000)
  listen(toNodeListener(app), {
    hostname,
    port
  })
}

run()

// copied as of commit 2e04a81dea7f9ee079d17617d4e5fed6b2192211
export const FunctionVersionRequestSchema = z.object({
  commitId: z.string(),
  versionTag: z.string(),
  inputSchema: z.record(z.string(), z.unknown()),
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
    .optional()
})
