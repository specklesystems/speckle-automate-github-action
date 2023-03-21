import { expect } from 'chai'
import { describe, it } from 'vitest'
import {
  SpeckleFunctionPathSchema,
  SpeckleServerUrlSchema,
  SpeckleTokenSchema
} from './schema'
import { ZodError } from 'zod'

describe('schema', () => {
  describe('Speckle Server URL', () => {
    it('cannot be empty', async () => {
      expect(SpeckleServerUrlSchema.parse.bind(SpeckleServerUrlSchema, '')).to.throw(
        ZodError
      )
    })
  })

  describe('Speckle Token', () => {
    it('cannot be empty', async () => {
      expect(SpeckleTokenSchema.parse.bind(SpeckleTokenSchema, '')).to.throw(ZodError)
    })
  })

  describe('Speckle Function Path', () => {
    it('cannot be empty', async () => {
      expect(
        SpeckleFunctionPathSchema.parse.bind(SpeckleFunctionPathSchema, '')
      ).to.throw(ZodError)
    })
    it('cannot be an absolute path', async () => {
      expect(
        SpeckleFunctionPathSchema.parse.bind(SpeckleFunctionPathSchema, '/')
      ).to.throw(ZodError)
    })
    it('can be a nested relative path', async () => {
      expect(SpeckleFunctionPathSchema.parse('src/main.ts')).to.equal('src/main.ts')
    })
    it('can have a leading dot slash', async () => {
      expect(SpeckleFunctionPathSchema.parse('./src/main.ts')).to.equal('./src/main.ts')
    })
    it('can be at the current directory', async () => {
      expect(SpeckleFunctionPathSchema.parse('.')).to.equal('.')
    })
  })
})
