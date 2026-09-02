import { describe, expect, test } from 'bun:test';
import { parseUserSorts } from './list-users-query.js';

describe('parseUserSorts', () => {
  test('whitelists user sorts and removes duplicates', () => {
    expect(parseUserSorts(['email:asc', 'createdAt:desc', 'email:desc'])).toEqual([
      { property: 'email', direction: 'asc' },
      { property: 'createdAt', direction: 'desc' },
    ]);
  });

  test('falls back to newest users first', () => {
    expect(parseUserSorts(['password:asc'])).toEqual([{ property: 'createdAt', direction: 'desc' }]);
  });
});
