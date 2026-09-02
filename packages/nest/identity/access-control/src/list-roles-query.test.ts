import { describe, expect, test } from 'bun:test';
import { parseRoleSorts } from './list-roles-query.js';

describe('parseRoleSorts', () => {
  test('allows only name and creation time while preserving priority', () => {
    expect(parseRoleSorts(['name:asc', 'createdAt:desc', 'permissions:asc'])).toEqual([
      { property: 'name', direction: 'asc' },
      { property: 'createdAt', direction: 'desc' },
    ]);
  });

  test('uses a stable default', () => {
    expect(parseRoleSorts()).toEqual([{ property: 'name', direction: 'asc' }]);
  });
});
