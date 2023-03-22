import { describe, expect, it, vi } from 'vitest'
import { handleZodError } from './errors.js'
import { ZodError } from 'zod'
import { ValidationError } from 'zod-validation-error'

describe('errors', () => {
  describe('with ZodError', () => {
    it('logs and throws', async () => {
      const errorFn = vi.fn()
      const logger = { error: errorFn, info: vi.fn(), warn: vi.fn(), debug: vi.fn() }
      expect(() => handleZodError(new ZodError([]), logger)).toThrow(ValidationError)
      expect(errorFn).toHaveBeenCalledTimes(1)
    })
  })
  describe('with unknown error', () => {
    it('throws', async () => {
      const errorFn = vi.fn()
      const logger = { error: errorFn, info: vi.fn(), warn: vi.fn(), debug: vi.fn() }
      expect(() => handleZodError(new Error('unknown'), logger)).toThrow(Error)
      expect(errorFn).toHaveBeenCalledTimes(0)
    })
  })
})
