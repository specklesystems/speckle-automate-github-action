import { afterEach, describe, expect, it, vi } from 'vitest'
import { getMinimalSpeckleFunctionExample } from '../schema/specklefunction.spec.js'
import { getLogger } from '../tests/logger.js'
import { findAndParseManifest } from './parser.js'
import { ValidationError } from 'zod-validation-error'

describe('filesystem/parser', () => {
  afterEach(async () => {
    vi.restoreAllMocks()
  })
  describe('No Yaml file', () => {
    it('should throw', async () => {
      await expect(async () =>
        findAndParseManifest('doesNotExist', {
          logger: getLogger(),
          fileSystem: {
            loadYaml: async () => {
              throw new Error('File does not exist')
            }
          }
        })
      ).rejects.toThrow(Error)
    })
  })
})
describe('Minimal yaml file', () => {
  it('should parse', async () => {
    const speckleFunction = await findAndParseManifest('examples/minimal', {
      logger: getLogger(),
      fileSystem: { loadYaml: async () => getMinimalSpeckleFunctionExample() }
    })
    expect(speckleFunction).toBeDefined()
    expect(speckleFunction.metadata.name).toBe('minimal')
  })
  describe('with filename in path', () => {
    it('should parse', async () => {
      const speckleFunction = await findAndParseManifest(
        'examples/minimal/specklefunction.yaml',
        {
          logger: getLogger(),
          fileSystem: {
            loadYaml: async () => getMinimalSpeckleFunctionExample()
          }
        }
      )
      expect(speckleFunction).toBeDefined()
      expect(speckleFunction.metadata.name).toBe('minimal')
    })
  })
  describe('Invalid yaml file', () => {
    it('should throw', async () => {
      await expect(async () =>
        findAndParseManifest('src/tests/data/invalid', {
          logger: getLogger(),
          fileSystem: {
            loadYaml: async () => {
              return 'invalid: yaml'
            }
          }
        })
      ).rejects.toThrow(ValidationError)
    })
  })
})
