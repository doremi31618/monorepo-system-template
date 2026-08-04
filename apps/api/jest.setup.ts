import { jest } from '@jest/globals';

(globalThis as typeof globalThis & { jest: typeof jest }).jest = jest;
