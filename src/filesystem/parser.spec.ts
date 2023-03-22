import { afterEach, describe, expect, it, vi } from 'vitest'
import { getMinimalSpeckleFunctionExample } from '../schema/speckle_function.spec.js'
import { getLogger } from '../tests/logger.js'
import { findAndParseManifest } from './parser.js'

describe('filesystem/parser', () => {
  afterEach(async () => {
    vi.restoreAllMocks()
  })
  describe('No Yaml file', () => {
    it('should throw', async () => {
      expect(async () =>
        findAndParseManifest('doesNotExist', {
          logger: getLogger(),
          fileSystem: {
            loadYaml: async () => {
              throw new Error('File does not exist')
            }
          }
        })
      ).rejects.toThrow()
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
})
