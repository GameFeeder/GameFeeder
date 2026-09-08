/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  // Fix module resolution for both relative imports and src/ imports
  moduleNameMapper: {
    // Handle .js extension in imports from test files
    '^(\\.\\.?/.*)\\.js$': '$1',
    // Map imports from 'src/whatever.js' to their TypeScript source files
    '^src/(.*)\\.js$': '<rootDir>/src/$1.ts',
    // For imports without extensions (like in mockBot.ts)
    '^src/(.*)$': '<rootDir>/src/$1.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      '@swc/jest',
      {
        jsc: {
          target: 'es2022',
          parser: { syntax: 'typescript' },
        },
        module: { type: 'nodenext' },
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/tests/_test-setup.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  modulePathIgnorePatterns: ['/dist/'],
  injectGlobals: true,
  transformIgnorePatterns: [],
};
