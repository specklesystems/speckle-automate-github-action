import { Logger } from './logging/logger.js'
import {
  SpeckleServerUrlSchema,
  SpeckleTokenSchema,
  SpeckleFunctionPathSchema
} from './schema.js'

type ProcessOptions = {
  speckleServerUrl: string
  speckleToken: string
  speckleFunctionPath: string
  logger: Logger
}

type ProcessResult = {
  functionId: string
  versionId: string
  imageName: string
  dockerfilePath: string
  dockerContextPath: string
}

export async function processSpeckleFunction(
  opts: ProcessOptions
): Promise<ProcessResult> {
  const speckleServerUrl = SpeckleServerUrlSchema.parse(opts.speckleServerUrl)
  const speckleToken = SpeckleTokenSchema.parse(opts.speckleToken)
  const speckleFunctionPath = SpeckleFunctionPathSchema.parse(opts.speckleFunctionPath)

  opts.logger.info(`Speckle Server URL: ${speckleServerUrl}`)
  opts.logger.info(`Speckle Server Token: ${speckleToken}`) //this should be masked in the logs?
  opts.logger.info(`Speckle Function Path: ${speckleFunctionPath}`)

  return {
    //TODO - replace with actual values
    functionId: 'functionId',
    versionId: 'versionId',
    imageName: 'imageName',
    dockerfilePath: 'dockerfilePath',
    dockerContextPath: 'dockerContextPath'
  }
}
