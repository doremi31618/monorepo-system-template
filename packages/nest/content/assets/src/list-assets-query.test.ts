import { describe, expect, test } from 'bun:test';
import { parseAssetSorts } from './list-assets-query.js';

describe('parseAssetSorts', () => {
  test('accepts only the public asset sort contract in priority order', () => {
    expect(parseAssetSorts(['name:asc', 'size:desc', 'storageKey:asc'])).toEqual([
      { property: 'name', direction: 'asc' },
      { property: 'size', direction: 'desc' },
    ]);
  });

  test('falls back to newest assets first', () => {
    expect(parseAssetSorts()).toEqual([{ property: 'createdAt', direction: 'desc' }]);
  });
});
