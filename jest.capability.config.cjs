/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  roots: ['<rootDir>/packages'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/apps/api/tsconfig.spec.json',
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
  setupFiles: ['<rootDir>/apps/api/jest.setup.ts'],
  testEnvironment: 'node',
};
