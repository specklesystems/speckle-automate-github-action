import { z } from 'zod'

export const SpeckleServerUrlSchema = z.string().url().nonempty()
export const SpeckleTokenSchema = z.string().nonempty()
export const SpeckleFunctionPathSchema = z
  .string()
  .nonempty()
  .refine((value: string) => !value.startsWith('/'), {
    message: 'Must not be an absolute path.'
  })
