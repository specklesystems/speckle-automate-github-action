import client from './client/client.js'
import { Logger } from './logging/logger.js'
import {
  SpeckleServerUrlSchema,
  SpeckleTokenSchema,
  SpeckleFunctionPathSchema,
  SpeckleFunctionIdSchema,
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
  speckleFunctionId?: string | undefined
  logger: Logger
  fileSystem: FileSystem
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
  let speckleFunctionId: string
  let versionTag: string
  let commitId: string
  try {
    speckleServerUrl = SpeckleServerUrlSchema.parse(opts.speckleServerUrl)
    speckleToken = SpeckleTokenSchema.parse(opts.speckleToken)
    speckleFunctionPath = SpeckleFunctionPathSchema.parse(opts.speckleFunctionPath)
    speckleFunctionId = SpeckleFunctionIdSchema.parse(opts.speckleFunctionId)
    versionTag = VersionTagSchema.parse(opts.versionTag)
    commitId = CommitIdSchema.parse(opts.commitId)
  } catch (err) {
    throw handleZodError(err, opts.logger)
  }

  opts.logger.info(`Speckle Server URL: '${speckleServerUrl}'`)
  //token is masked in the logs, so no need to print it here.
  opts.logger.info(`Speckle Function Path: '${speckleFunctionPath}'`)
  opts.logger.info(`Speckle Function ID: '${speckleFunctionId}'`)

  const manifest = await findAndParseManifest(speckleFunctionPath, {
    logger: opts.logger,
    fileSystem: opts.fileSystem
  })

  const body: FunctionVersionRequest = {
    commitId,
    versionTag,
    steps: [], //FIXME remove this, one function === one step!
    inputSchema: {}, //FIXME this needs to be read in from a schema file?
    annotations: manifest.metadata.annotations
  }

  const response = await client.postManifest(
    speckleServerUrl,
    speckleToken,
    speckleFunctionId,
    body,
    opts.logger
  )

  opts.logger.info(
    `Successfully registered Speckle Function with ID: ${response.functionId}`
  )
  return response
}
