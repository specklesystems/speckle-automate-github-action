import { beforeEach, describe, expect, it } from 'vitest'
import { SpeckleFunctionAnnotations, SpeckleFunctionSchema } from './specklefunction.js'
import { ZodError } from 'zod'

export type NonConformantSpeckleFunction = {
  apiVersion: string | undefined
  kind: string | undefined
  metadata:
    | {
        name: string | undefined
        annotations: SpeckleFunctionAnnotations | undefined
      }
    | undefined
  spec: object | undefined
}

export function getMinimalSpeckleFunctionExample(): NonConformantSpeckleFunction {
  return {
    apiVersion: 'speckle.systems/v1alpha1',
    kind: 'SpeckleFunction',
    metadata: {
      name: 'minimal',
      annotations: {
        'speckle.systems/v1alpha1/publishing/status': 'draft'
      }
    },
    spec: {}
  }
}

describe('speckle function schema', () => {
  let minimal: NonConformantSpeckleFunction

  beforeEach(() => {
    minimal = getMinimalSpeckleFunctionExample()
  })

  describe('Speckle Function', () => {
    it('cannot be empty', async () => {
      expect(() => SpeckleFunctionSchema.parse({})).toThrow(ZodError)
    })

    describe('apiVersion', () => {
      it('cannot be missing-', async () => {
        minimal.apiVersion = ''
        expect(() => SpeckleFunctionSchema.parse('{}')).toThrow(ZodError)
      })
      it('cannot be invalid', async () => {
        minimal.apiVersion = 'invalid'
        expect(() => SpeckleFunctionSchema.parse(minimal)).toThrow(ZodError)
      })
    })

    describe('kind', () => {
      it('cannot be missing', async () => {
        minimal.kind = ''
        expect(() => SpeckleFunctionSchema.parse('/')).toThrow(ZodError)
      })
      it('cannot be invalid', async () => {
        minimal.kind = 'invalid'
        expect(() => SpeckleFunctionSchema.parse(minimal)).toThrow(ZodError)
      })
    })

    describe('metadata', () => {
      it('cannot be missing a metadata', async () => {
        minimal.metadata = undefined
        expect(() => SpeckleFunctionSchema.parse(minimal)).toThrow(ZodError)
      })
      describe('name', () => {
        it('cannot be missing', async () => {
          if (minimal.metadata === undefined) throw new Error('metadata is undefined') // for typescript
          minimal.metadata.name = ''
          expect(() => SpeckleFunctionSchema.parse(minimal)).toThrow(ZodError)
        })
      })
    })

    describe('spec', () => {
      it('cannot be missing', async () => {
        minimal.spec = undefined
        expect(() => SpeckleFunctionSchema.parse(minimal)).toThrow(ZodError)
      })
    })

    it('can be minimal', async () => {
      expect(SpeckleFunctionSchema.parse(minimal)).toStrictEqual(minimal)
    })
  })
})
