import { beforeEach, describe, expect, it } from 'vitest'
import { ZodError } from 'zod'
import {
  getMinimalSpeckleFunctionExample,
  NonConformantSpeckleFunction
} from '../schema/specklefunction.spec.js'
import { FunctionVersionRequestSchema } from './schema.js'

type NonConformanSpeckleFunctionPostRequestBody = {
  versionTag: string | undefined
  commitId: string | undefined
  steps: []
  inputSchema: object
  manifest: NonConformantSpeckleFunction | undefined
}

function getMinimumRequestBody(): NonConformanSpeckleFunctionPostRequestBody {
  return {
    versionTag: 'main',
    commitId: 'sha123',
    steps: [],
    inputSchema: {},
    manifest: getMinimalSpeckleFunctionExample()
  }
}

describe('schema', () => {
  let minimal: NonConformanSpeckleFunctionPostRequestBody

  beforeEach(() => {
    minimal = getMinimumRequestBody()
  })

  describe('Speckle Function Post Request Body Schema', () => {
    it('cannot be empty', async () => {
      expect(() => FunctionVersionRequestSchema.parse('')).toThrow(ZodError)
    })
    describe('versionTag', () => {
      it('cannot be empty', () => {
        minimal.versionTag = ''
        expect(() => FunctionVersionRequestSchema.parse(minimal)).toThrow(ZodError)
      })
    })
    describe('commitId', () => {
      it('cannot be empty', () => {
        minimal.commitId = ''
        expect(() => FunctionVersionRequestSchema.parse(minimal)).toThrow(ZodError)
      })
    })
  })
})
