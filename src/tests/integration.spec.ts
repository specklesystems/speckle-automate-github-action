import chai from './chai-config.js'
import sinon from 'sinon'
import { describe, it, afterEach, beforeEach } from 'vitest'
import {
  App,
  eventHandler,
  createApp,
  createRouter,
  H3Event,
  Router,
  toNodeListener
} from 'h3'
import { listen } from 'listhen'
import { getRandomPort } from 'get-port-please'
import { registerSpeckleFunction } from '../speckleautomate.js'
import { getLogger } from './logger.js'
import { SpeckleFunctionPostResponseBody } from '../client/schema.js'

const expect = chai.expect

describe('integration', () => {
  afterEach(() => {
    sinon.restore()
  })

  describe('Load from ./examples directory', () => {
    let app: App
    let router: Router
    let port: number
    const hostname = '127.0.0.1'

    beforeEach(() => {
      app = createApp({ debug: false })
    })

    describe('registerSpeckleAutomate', () => {
      it('should respond with Function name and id', async () => {
        // set up the fake server
        router = createRouter().post(
          '/api/v1/functions',
          eventHandler((event: H3Event): SpeckleFunctionPostResponseBody => {
            event.node.res.statusCode = 201
            event.node.res.statusMessage = 'Created'
            event.node.res.setHeader('Content-Type', 'application/json')
            return {
              functionId: 'minimalfunctionid',
              versionId: 'minimalversionid',
              imageName: 'speckle/minimalfunctionid:minimalversionid'
            }
          })
        )
        app.use(router)
        port = await getRandomPort(hostname)
        listen(toNodeListener(app), {
          hostname,
          port
        })

        const result = await registerSpeckleFunction({
          speckleFunctionId: undefined,
          speckleServerUrl: `http://${hostname}:${port}`,
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
