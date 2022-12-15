export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  modulePaths: ['<rootDir>', '<rootDir>/src', '<rootDir>/tests', '<rootDir>/tests/mockClasses'],
  preset: 'ts-jest',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/tests/',
    '/docs/',
    '/data/',
    '/config/',
    '/@types/',
    '.vscode',
    '.github',
    '.devcontainer',
  ],
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapper: { '^(\\.{1,2}/.+)\\.js$': '$1' },
  transform: {},
  setupFiles: ['<rootDir>/tests/_test-setup.ts'],
};
