import { describe, expect, it } from 'vitest'
import {
  SpeckleFunctionPathSchema,
  SpeckleServerUrlSchema,
  SpeckleTokenSchema,
  SpeckleFunctionInputSchema
} from './inputs.js'
import { ZodError } from 'zod'

describe('schema', () => {
  describe('Speckle Server URL', () => {
    it('cannot be empty', async () => {
      expect(() => SpeckleServerUrlSchema.parse('')).toThrow(ZodError)
    })
  })

  describe('Speckle Token', () => {
    it('cannot be empty', async () => {
      expect(() => SpeckleTokenSchema.parse('')).toThrow(ZodError)
    })
  })

  describe('Speckle Function Path', () => {
    it('cannot be empty', async () => {
      expect(() => SpeckleFunctionPathSchema.parse('')).toThrow(ZodError)
    })
    it('cannot be an absolute path', async () => {
      expect(() => SpeckleFunctionPathSchema.parse('/')).toThrow(ZodError)
    })
    it('can be a nested relative path', async () => {
      expect(SpeckleFunctionPathSchema.parse('src/main.ts')).toBe('src/main.ts')
    })
    it('can have a leading dot slash', async () => {
      expect(SpeckleFunctionPathSchema.parse('./src/main.ts')).toBe('./src/main.ts')
    })
    it('can be at the current directory', async () => {
      expect(SpeckleFunctionPathSchema.parse('.')).toBe('.')
    })
  })

  describe('Speckle Function Input Schema', () => {
    it('can parse objects', () => {
      const inputSchema = { foo: 'bar' }
      expect(SpeckleFunctionInputSchema.parse(inputSchema)).toStrictEqual(inputSchema)
    })
    it('works for empty objects', () => {
      const inputSchema = {}
      expect(SpeckleFunctionInputSchema.parse(inputSchema)).toStrictEqual(inputSchema)
    })
    it('fails for not object types', () => {
      const inputSchema = '{ "foo": "bar" }'
      expect(SpeckleFunctionInputSchema.safeParse(inputSchema).success).toBeFalsy()
    })
  })
})
