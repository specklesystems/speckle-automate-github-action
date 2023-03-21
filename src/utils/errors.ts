import { Logger } from '../logging/logger.js'
import { fromZodError } from 'zod-validation-error'
import { ZodError } from 'zod'

export function handleZodError(err: unknown, logger: Logger): void {
  if (err instanceof ZodError) {
    const validationError = fromZodError(err)
    logger.error(validationError)
    throw validationError
  }
  throw err
}
