import { FileSystem } from './files.js'
import { SpeckleFunction, SpeckleFunctionSchema } from '../schema/specklefunction.js'
import * as path from 'path'
import { Logger } from '../logging/logger.js'
import { handleZodError } from '../schema/errors.js'

export type ParserOptions = {
  logger: Logger
  fileSystem: FileSystem
}

export async function findAndParseManifest(
  pathToSpeckleFunctionFile: string,
  opts: ParserOptions
): Promise<SpeckleFunction> {
  if (!pathToSpeckleFunctionFile.toLocaleLowerCase().endsWith('specklefunction.yaml')) {
    pathToSpeckleFunctionFile = path.join(
      pathToSpeckleFunctionFile,
      'specklefunction.yaml'
    )
  }

  let speckleFunctionRaw: unknown
  try {
    speckleFunctionRaw = await opts.fileSystem.loadYaml(pathToSpeckleFunctionFile)
  } catch (err) {
    if (err instanceof Error) {
      opts.logger.error(err)
    }
    throw err
  }

  let speckleFunction: SpeckleFunction
  try {
    speckleFunction = await SpeckleFunctionSchema.parseAsync(speckleFunctionRaw)
  } catch (err) {
    throw handleZodError(err, opts.logger)
  }
  return speckleFunction
}
