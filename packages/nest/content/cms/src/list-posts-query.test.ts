import { describe, expect, test } from 'bun:test';
import { parsePostSorts } from './list-posts-query.js';

describe('parsePostSorts', () => {
  test('keeps valid sort priority and rejects unknown or duplicate fields', () => {
    expect(parsePostSorts(['title:asc', 'updatedAt:desc', 'title:desc', 'secret:asc'])).toEqual([
      { property: 'title', direction: 'asc' },
      { property: 'updatedAt', direction: 'desc' },
    ]);
  });

  test('uses the stable default when no valid sort exists', () => {
    expect(parsePostSorts('invalid:sideways')).toEqual([
      { property: 'updatedAt', direction: 'desc' },
    ]);
  });
});
