import { z } from 'zod'

export const SpeckleServerUrlSchema = z.string().url().nonempty()
export const SpeckleTokenSchema = z.string().nonempty()
export const SpeckleFunctionRepositorySchema = z.string().nonempty() //TODO validate this as a git+https, https, or ssh url
export const SpeckleFunctionPathSchema = z
  .string()
  .nonempty()
  .refine((value: string) => !value.startsWith('/'), {
    message: 'Must not be an absolute path.'
  })
export const SpeckleFunctionIdSchema = z.string().nonempty()
export const VersionTagSchema = z.string().nonempty()
export const CommitIdSchema = z.string().nonempty()
export const SpeckleFunctionInputSchema = z.record(z.string(), z.unknown())
