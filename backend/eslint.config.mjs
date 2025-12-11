import baseConfig from '../eslint.config.mjs';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
});

export default [
    ...baseConfig,
    ...compat.extends('plugin:import/recommended', 'plugin:import/typescript'),
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        rules: {
            '@typescript-eslint/interface-name-prefix': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-explicit-any': 'off',

            'import/no-restricted-paths': [
                'error',
                {
                    zones: [
                        // Infra Core cannot import Domain or Feature (Modules)
                        {
                            target: './src/core/infra',
                            from: './src/core/domain',
                            except: ['**/db/schema.ts'],
                            message: 'Infra Core cannot import Domain Core. Dependency rule: Infra -> Domain -> Feature',
                        },
                        {
                            target: './src/core/infra',
                            from: './src/modules',
                            message: 'Infra Core cannot import Feature Modules. Dependency rule: Infra -> Domain -> Feature',
                        },
                        // Domain Core cannot import Feature (Modules)
                        {
                            target: './src/core/domain',
                            from: './src/modules',
                            message: 'Domain Core cannot import Feature Modules. Dependency rule: Domain -> Feature',
                        },
                        // Shared cannot import from Backend Logic
                        {
                            target: './src/share',
                            from: './src/core',
                            message: 'Shared code cannot import from Backend Core.',
                        },
                        {
                            target: './src/share',
                            from: './src/modules',
                            message: 'Shared code cannot import from Feature Modules.',
                        },
                    ],
                },
            ],
        },
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './tsconfig.json',
                },
            },
        },
    },
    {
        files: ['src/core/infra/db/schema.ts'],
        rules: {
            'import/no-restricted-paths': 'off',
        },
    },
];
