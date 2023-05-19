import { eventHandler, createApp, createRouter, H3Event, toNodeListener } from 'h3'
import { listen } from 'listhen'
import { getPort } from 'get-port-please'
import { SpeckleFunctionPostResponseBody } from '../client/schema.js'

async function run() {
  const hostname = '127.0.0.1'
  const app = createApp({ debug: false })
  const router = createRouter().post(
    '/api/v1/functions/functionid/versions',
    eventHandler((event: H3Event): SpeckleFunctionPostResponseBody => {
      event.node.res.statusCode = 201
      event.node.res.statusMessage = 'Created'
      event.node.res.setHeader('Content-Type', 'application/json')
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
