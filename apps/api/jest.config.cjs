/** @type {import('jest').Config} */
module.exports = {
	moduleFileExtensions: ['js', 'json', 'ts'],
	rootDir: '.',
	roots: [
		'<rootDir>/src',
		'<rootDir>/../../packages/auth/src',
		'<rootDir>/../../packages/logger/src',
		'<rootDir>/../../packages/mail/src',
		'<rootDir>/../../packages/scheduling/src',
		'<rootDir>/../../packages/users/src'
	],
	moduleNameMapper: {
		'^src/(.*)$': '<rootDir>/src/$1',
		'^(\\.{1,2}/.*)\\.js$': '$1'
	},
	testRegex: '.*\\.spec\\.ts$',
	transform: {
		'^.+\\.tsx?$': [
			'ts-jest',
			{
				useESM: true,
				tsconfig: '<rootDir>/tsconfig.spec.json'
			}
		]
	},
	extensionsToTreatAsEsm: ['.ts'],
	setupFiles: ['<rootDir>/jest.setup.ts'],
	collectCoverageFrom: ['src/**/*.(t|j)s'],
	coverageDirectory: './coverage',
	testEnvironment: 'node'
};
