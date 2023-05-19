import { z } from 'zod'
import { SpeckleFunctionAnnotationsSchema } from '../schema/specklefunction.js'
import { CommitIdSchema, VersionTagSchema } from '../schema/inputs.js'

export const FunctionVersionRequestSchema = z.object({
  commitId: CommitIdSchema,
  versionTag: VersionTagSchema, // TODO: this should be a valid semver...
  inputSchema: z.record(z.string(), z.any()),
  steps: z.array(z.string().nonempty()),
  annotations: SpeckleFunctionAnnotationsSchema
})

export type FunctionVersionRequest = z.infer<typeof FunctionVersionRequestSchema>

export const SpeckleFunctionPostResponseBodySchema = z.object({
  versionId: z.string().nonempty()
})

export type SpeckleFunctionPostResponseBody = z.infer<
  typeof SpeckleFunctionPostResponseBodySchema
>
