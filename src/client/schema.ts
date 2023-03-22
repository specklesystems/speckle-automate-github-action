import { z } from 'zod'
import { SpeckleFunctionSchema } from '../schema/specklefunction.js'
import { URL } from 'url'

export const SpeckleFunctionPostRequestBodySchema = z.object({
  functionId: z.union([z.string().nonempty(), z.null()]),
  url: z
    .string()
    .url()
    .refine(
      (data: string) => {
        try {
          const normalizedUrl = new URL(data)
          if (normalizedUrl.password !== '' || normalizedUrl.username !== '') {
            return false
          }
        } catch {
          // invalid urls may be valid git ssh uris; we can't tell so we'll return
          //TODO complex regex for validating all the types of git uri
          return true
        }

        return true
      },
      {
        message:
          'HTTP basic authentication is not allowed within the Url. The Url is not stored as an encrypted value and we cannot guarantee the safety of the basic authentication credentials.'
      }
    ),
  path: z
    .string()
    .nonempty()
    .refine(
      () => true, //TODO validate it is a path, and the path is not a directory traversal attack out of the source code directory (such as ../../etc/passwd). We can take much of the directory traversal code from build-instructions-step.
      {
        message: 'Must be a valid path.'
      }
    )
    .default('.'),
  ref: z.string().nonempty(),
  commitSha: z.string().nonempty(),
  manifest: SpeckleFunctionSchema
})

export type SpeckleFunctionPostRequestBody = z.infer<
  typeof SpeckleFunctionPostRequestBodySchema
>

export const SpeckleFunctionPostResponseBodySchema = z.object({
  functionId: z.string().nonempty(),
  versionId: z.string().nonempty(),
  imageName: z.string().nonempty()
})

export type SpeckleFunctionPostResponseBody = z.infer<
  typeof SpeckleFunctionPostResponseBodySchema
>
