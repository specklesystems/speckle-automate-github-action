import { afterEach, describe, expect, it, vi } from 'vitest'
import { getLogger } from '../tests/logger.js'
import { findAndParseManifest } from './parser.js'

describe('filesystem/parser', () => {
  afterEach(async () => {
    vi.restoreAllMocks()
  })
  describe('No Yaml file', () => {
    it('should throw', async () => {
      expect(async () =>
        findAndParseManifest(getLogger(), 'doesNotExist')
      ).rejects.toThrow()
    })
  })
  describe('Minimal yaml file', () => {
    it('should parse', async () => {
      const speckleFunction = await findAndParseManifest(
        getLogger(),
        'examples/minimal'
      )
      expect(speckleFunction).toBeDefined()
      expect(speckleFunction.metadata.name).toBe('minimal')
    })
    describe('with filename in path', () => {
      it('should parse', async () => {
        const speckleFunction = await findAndParseManifest(
          getLogger(),
          'examples/minimal/specklefunction.yaml'
        )
        expect(speckleFunction).toBeDefined()
        expect(speckleFunction.metadata.name).toBe('minimal')
      })
    })
  })
})
