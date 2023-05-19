import { z } from 'zod'

export type SpeckleFunctionKind = 'SpeckleFunction'
export const SpeckleFunctionKind: SpeckleFunctionKind = 'SpeckleFunction'
export type SpeckleFunctionApiVersion = 'speckle.systems/v1alpha1'
export const SpeckleFunctionApiVersionV1Alpha1: SpeckleFunctionApiVersion =
  'speckle.systems/v1alpha1'

export type SpeckleFunctionAnnotations = z.infer<
  typeof SpeckleFunctionAnnotationsSchema
>

export const SpeckleFunctionAnnotationsSchema = z
  .object({
    'speckle.systems/v1alpha1/publishing/status': z
      .enum(['publish', 'draft', 'archive'])
      .default('draft'), //description('Whether this Function is published (and should appear in the library), a draft, or archived.'),
    'speckle.systems/v1alpha1/author': z.string().optional(), //.description('The name of the authoring organisation or individual of this Function.'),
    'speckle.systems/v1alpha1/license': z
      .enum(['MIT', 'BSD', 'Apache-2.0', 'MPL', 'CC0', 'Unlicense'])
      .optional(), //.description('The license under under which this Function is made available. This must match the license in the source code repository.'), //TODO match the specification for license names
    'speckle.systems/v1alpha1/website': z.string().url().optional(), //.description('The marketing website for this Function or its authors.'),
    'speckle.systems/v1alpha1/documentation': z.string().url().optional(), //.description('The documentation website for this function. For example, this could be a url to the README in the source code repository.'),
    'speckle.systems/v1alpha1/keywords': z.string().optional(), //.description('Comma separated list of keywords used for categorising this function.'),
    'speckle.systems/v1alpha1/description': z.string().optional()
  })
  .optional()

export type SpeckleFunction = z.infer<typeof SpeckleFunctionSchema>

export const SpeckleFunctionSchema = z.object({
  kind: z.literal(SpeckleFunctionKind),
  apiVersion: z.enum([SpeckleFunctionApiVersionV1Alpha1]),
  metadata: z.object({
    name: z.string().nonempty(),
    annotations: SpeckleFunctionAnnotationsSchema
  }),
  spec: z.object({
    inputs: z
      .array(
        z.object({
          //TODO
        })
      )
      .optional(),
    results: z
      .array(
        z.object({
          //TODO
        })
      )
      .optional(),
    steps: z
      .array(
        z.object({
          name: z.string().nonempty()
          //TODO
        })
      )
      .nonempty(),
    requirements: z
      .object({
        os: z.enum(['windows', 'linux']).default('linux'),
        architecture: z.enum(['amd64']).default('amd64'),
        infrastructure: z.array(z.enum(['gpu'])).optional()
      })
      .optional()
  })
})
