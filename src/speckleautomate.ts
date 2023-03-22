import client from './client/client.js'
import { Logger } from './logging/logger.js'
import {
  SpeckleServerUrlSchema,
  SpeckleTokenSchema,
  SpeckleFunctionPathSchema,
  SpeckleFunctionIdSchema,
  GitRefSchema,
  GitCommitShaSchema
} from './schema/inputs.js'

import { handleZodError } from './schema/errors.js'
import { SpeckleFunctionPostRequestBody } from './client/schema.js'
import { findAndParseManifest } from './filesystem/parser.js'

type ProcessOptions = {
  speckleServerUrl: string | undefined
  speckleToken: string
  ref: string | undefined
  commitsha: string | undefined
  speckleFunctionPath: string | undefined
  speckleFunctionId?: string | undefined
  logger: Logger
}

type ProcessResult = {
  functionId: string
  versionId: string
  imageName: string
}

export async function registerSpeckleFunction(
  opts: ProcessOptions
): Promise<ProcessResult> {
  let speckleServerUrl: string
  let speckleToken: string
  let speckleFunctionPath: string
  let speckleFunctionId: string | undefined
  let gitRef: string
  let gitCommitSha: string
  try {
    speckleServerUrl = SpeckleServerUrlSchema.parse(opts.speckleServerUrl)
    speckleToken = SpeckleTokenSchema.parse(opts.speckleToken)
    speckleFunctionPath = SpeckleFunctionPathSchema.parse(opts.speckleFunctionPath)
    speckleFunctionId = SpeckleFunctionIdSchema.parse(opts.speckleFunctionId)
    gitRef = GitRefSchema.parse(opts.ref)
    gitCommitSha = GitCommitShaSchema.parse(opts.commitsha)
  } catch (err) {
    throw handleZodError(err, opts.logger)
  }

  opts.logger.info(`Speckle Server URL: ${speckleServerUrl}`)
  //token is masked in the logs, so no need to print it here.
  opts.logger.info(`Speckle Function Path: ${speckleFunctionPath}`)
  opts.logger.info(`Speckle Function ID: ${speckleFunctionId}`)

  const manifest = await findAndParseManifest(opts.logger, speckleFunctionPath)

  const body: SpeckleFunctionPostRequestBody = {
    functionId: speckleFunctionId || undefined,
    url: speckleServerUrl,
    path: speckleFunctionPath,
    ref: gitRef,
    commitSha: gitCommitSha,
    manifest
  }
  const response = await client.postManifest(
    speckleServerUrl,
    speckleToken,
    body,
    opts.logger
  )

  opts.logger.info(
    `Successfully registered Speckle Function with ID: ${response.functionId}`
  )
  return response
}
