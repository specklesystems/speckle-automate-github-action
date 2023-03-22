export default {
  resolve: {
    mainFields: ['module']
  },
  test: {
    coverage: {
      reporter: ['text', 'json', 'html'],
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
      lines: 95,
      functions: 95,
      branches: 95,
      statements: 95
    }
  }
}
