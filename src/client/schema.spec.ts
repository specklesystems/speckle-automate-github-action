import { beforeEach, describe, expect, it } from 'vitest'
import { SpeckleFunctionPostRequestBodySchema } from './schema.js'
import { ZodError } from 'zod'
import {
  getMinimalSpeckleFunctionExample,
  NonConformantSpeckleFunction
} from '../schema/specklefunction.spec.js'

type NonConformanSpeckleFunctionPostRequestBody = {
  functionId: string | null | undefined
  url: string | undefined
  path: string | undefined
  ref: string | undefined
  commitSha: string | undefined
  manifest: NonConformantSpeckleFunction | undefined
}

function getMinimumRequestBody(): NonConformanSpeckleFunctionPostRequestBody {
  return {
    functionId: null,
    url: 'https://example.org',
    path: '.',
    ref: 'main',
    commitSha: 'sha123',
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
      expect(() => SpeckleFunctionPostRequestBodySchema.parse('')).toThrow(ZodError)
    })
    describe('functionId', () => {
      it('can be null', () => {
        minimal.functionId = null
        expect(() => SpeckleFunctionPostRequestBodySchema.parse(minimal)).not.toThrow(
          ZodError
        )
      })
      it('cannot be an empty string', () => {
        minimal.functionId = ''
        expect(() => SpeckleFunctionPostRequestBodySchema.parse(minimal)).toThrow(
          ZodError
        )
      })
    })
    describe('url', () => {
      it('cannot be missing', () => {
        minimal.url = ''
        expect(() => SpeckleFunctionPostRequestBodySchema.parse(minimal)).toThrow(
          ZodError
        )
      })
      it('cannot be a url with a username', () => {
        minimal.url = 'https://user@example.org'
        expect(() => SpeckleFunctionPostRequestBodySchema.parse(minimal)).toThrow(
          ZodError
        )
      })
      it('cannot be a url with a password', () => {
        minimal.url = 'https://:password@example.org'
        expect(() => SpeckleFunctionPostRequestBodySchema.parse(minimal)).toThrow(
          ZodError
        )
      })
      it('cannot have a url and password', () => {
        minimal.url = 'https://user:password@example.org'
        expect(() => SpeckleFunctionPostRequestBodySchema.parse(minimal)).toThrow(
          ZodError
        )
      })
    })
    describe('path', () => {
      it('cannot be empty', () => {
        minimal.path = ''
        expect(() => SpeckleFunctionPostRequestBodySchema.parse(minimal)).toThrow(
          ZodError
        )
      })
    })
    describe('ref', () => {
      it('cannot be empty', () => {
        minimal.ref = ''
        expect(() => SpeckleFunctionPostRequestBodySchema.parse(minimal)).toThrow(
          ZodError
        )
      })
    })
    describe('commitSha', () => {
      it('cannot be empty', () => {
        minimal.commitSha = ''
        expect(() => SpeckleFunctionPostRequestBodySchema.parse(minimal)).toThrow(
          ZodError
        )
      })
    })
  })
})
