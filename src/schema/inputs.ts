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
export const SpeckleFunctionIdSchema = z.string().optional()
export const GitRefSchema = z.string().nonempty()
export const GitCommitShaSchema = z.string().nonempty()
