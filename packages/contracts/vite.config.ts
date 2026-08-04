
import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'ShareContract',
            fileName: 'index'
        },
        rollupOptions: {
            external: [] // No external dependencies for now
        }
    },
    plugins: [dts({
        insertTypesEntry: true,
        tsconfigPath: './tsconfig.lib.json'
    })]
});
