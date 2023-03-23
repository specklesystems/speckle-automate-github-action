'use strict'
import { promises as fsPromises } from 'fs'
import yaml from 'js-yaml'

export type FileSystem = {
  loadYaml: (filePath: string) => Promise<unknown>
}

const fileUtil = {
  loadYaml: async (filePath: string) => {
    return yaml.load(await fsPromises.readFile(filePath, 'utf8'))
  }
}

export default fileUtil
