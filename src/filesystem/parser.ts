import fileUtil from './files.js'
import { SpeckleFunction, SpeckleFunctionSchema } from '../schema/speckleFunction.js'
import * as path from 'path'
import { Logger } from '../logging/logger.js'
import { handleZodError } from '../schema/errors.js'

export async function findAndParseManifest(
  logger: Logger,
  pathToSpeckleFunctionFile: string
): Promise<SpeckleFunction> {
  if (!pathToSpeckleFunctionFile.toLocaleLowerCase().endsWith('specklefunction.yaml')) {
    pathToSpeckleFunctionFile = path.join(
      pathToSpeckleFunctionFile,
      'specklefunction.yaml'
    )
  }

  let speckleFunctionRaw: unknown
  try {
    speckleFunctionRaw = await fileUtil.loadYaml(pathToSpeckleFunctionFile)
  } catch (err) {
    if (err instanceof Error) {
      logger.error(err)
    }
    throw err
  }

  let speckleFunction: SpeckleFunction
  try {
    speckleFunction = await SpeckleFunctionSchema.parseAsync(speckleFunctionRaw)
  } catch (err) {
    throw handleZodError(err, logger)
  }
  return speckleFunction
}
