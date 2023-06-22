import client from './client/client.js'
import { Logger } from './logging/logger.js'
import {
  SpeckleServerUrlSchema,
  SpeckleTokenSchema,
  SpeckleFunctionPathSchema,
  SpeckleFunctionIdSchema,
  SpeckleFunctionInputSchema,
  VersionTagSchema,
  CommitIdSchema
} from './schema/inputs.js'

import { handleZodError } from './schema/errors.js'
import { FunctionVersionRequest } from './client/schema.js'
import { findAndParseManifest } from './filesystem/parser.js'
import { FileSystem } from './filesystem/files.js'

type ProcessOptions = {
  speckleServerUrl: string | undefined
  speckleToken: string
  versionTag: string
  commitId: string
  speckleFunctionPath: string | undefined
  speckleFunctionId: string
  speckleFunctionCommand: string
  speckleFunctionInputSchema?: string | undefined
  logger: Logger
  fileSystem: FileSystem
}

type ProcessResult = {
  versionId: string
}

export async function registerSpeckleFunction(
  opts: ProcessOptions
): Promise<ProcessResult> {
  let speckleServerUrl: string
  let speckleToken: string
  let speckleFunctionPath: string
  let speckleFunctionId: string
  let speckleFunctionCommand: string[]
  let speckleFunctionInputSchema: Record<string, unknown>
  let versionTag: string
  let commitId: string
  try {
    speckleServerUrl = SpeckleServerUrlSchema.parse(opts.speckleServerUrl)
    speckleToken = SpeckleTokenSchema.parse(opts.speckleToken)
    speckleFunctionPath = SpeckleFunctionPathSchema.parse(opts.speckleFunctionPath)
    speckleFunctionId = SpeckleFunctionIdSchema.parse(opts.speckleFunctionId)
    versionTag = VersionTagSchema.parse(opts.versionTag)
    commitId = CommitIdSchema.parse(opts.commitId)
    speckleFunctionInputSchema = opts.speckleFunctionInputSchema
      ? SpeckleFunctionInputSchema.parse(JSON.parse(opts.speckleFunctionInputSchema))
      : {}
    speckleFunctionCommand = opts.speckleFunctionCommand.split(' ')
  } catch (err) {
    throw handleZodError(err, opts.logger)
  }

  opts.logger.info(`Speckle Server URL: '${speckleServerUrl}'`)
  //token is masked in the logs, so no need to print it here.
  opts.logger.info(`Speckle Function Path: '${speckleFunctionPath}'`)
  opts.logger.info(`Speckle Function ID: '${speckleFunctionId}'`)

  // const manifest = await findAndParseManifest(speckleFunctionPath, {
  //   logger: opts.logger,
  //   fileSystem: opts.fileSystem
  // })

  const body: FunctionVersionRequest = {
    commitId,
    versionTag,
    command: speckleFunctionCommand,
    inputSchema: speckleFunctionInputSchema
  }

  const response = await client.postManifest(
    speckleServerUrl,
    speckleToken,
    speckleFunctionId,
    body,
    opts.logger
  )

  opts.logger.info(
    `Successfully registered version ${response.versionId} of Speckle Function ${speckleFunctionId}`
  )
  return response
}
