import { configDefaults, defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    mainFields: ['module']
  },
  test: {
    exclude: [...configDefaults.exclude, 'lib/**', 'dist/**'],
    coverage: {
      reporter: ['lcov', 'text', 'json', 'html'],
      provider: 'istanbul',
      exclude: [
        'src/tests/**/*',
        'src/**/*.spec.ts',
        'src/**/*.spec.tsx',
        'lib/**/*',
        'dist/**/*',
        '**/*.cjs',
        '**/*.mjs',
        '**/*.js'
      ],
      lines: 90,
      functions: 90,
      branches: 70,
      statements: 90,
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src/')
        }
      },
      define: {
        'import.meta.vitest': 'undefined'
      }
    }
  }
})
