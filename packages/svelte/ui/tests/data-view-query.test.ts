import { describe, expect, test } from 'bun:test';

import {
  parseDataViewQuery,
  writeDataViewQuery,
  type DataViewProperty,
} from '../src/lib/ui/data-view-toolbar/query.js';

const properties: DataViewProperty[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'enum',
    operators: ['is', 'isNot', 'isAnyOf'],
    options: [
      { value: 'draft', label: 'Draft' },
      { value: 'published', label: 'Published' },
    ],
  },
  {
    key: 'updatedAt',
    label: 'Updated',
    type: 'date',
    operators: ['before', 'after', 'between'],
    sortable: true,
  },
  {
    key: 'title',
    label: 'Title',
    type: 'text',
    operators: ['is', 'isNot'],
    sortable: true,
  },
];

describe('data view query URL contract', () => {
  test('writes committed search, filters, and ordered sorts while preserving unrelated state', () => {
    const current = new URLSearchParams('tab=posts&page=7&locale=zh-TW');

    const next = writeDataViewQuery(current, {
      search: 'release notes',
      filters: [
        {
          property: 'status',
          operator: 'isAnyOf',
          value: ['draft', 'published'],
        },
      ],
      sorts: [
        { property: 'updatedAt', direction: 'desc' },
        { property: 'title', direction: 'asc' },
      ],
    });

    expect(next.get('tab')).toBe('posts');
    expect(next.get('locale')).toBe('zh-TW');
    expect(next.has('page')).toBe(false);
    expect(next.get('q')).toBe('release notes');
    expect(next.getAll('filter')).toEqual([
      JSON.stringify({
        property: 'status',
        operator: 'isAnyOf',
        value: ['draft', 'published'],
      }),
    ]);
    expect(next.getAll('sort')).toEqual(['updatedAt:desc', 'title:asc']);
  });

  test('parses only complete rules allowed by the declared property contract', () => {
    const params = new URLSearchParams();
    params.set('q', '  roadmap  ');
    params.append(
      'filter',
      JSON.stringify({ property: 'status', operator: 'is', value: 'draft' }),
    );
    params.append(
      'filter',
      JSON.stringify({
        property: 'status',
        operator: 'before',
        value: 'draft',
      }),
    );
    params.append(
      'filter',
      JSON.stringify({ property: 'status', operator: 'is', value: 'missing' }),
    );
    params.append(
      'filter',
      JSON.stringify({ property: 'title', operator: 'is', value: '' }),
    );
    params.append('filter', '{broken');
    params.append('sort', 'updatedAt:desc');
    params.append('sort', 'missing:asc');
    params.append('sort', 'title:sideways');

    expect(parseDataViewQuery(params, properties)).toEqual({
      search: 'roadmap',
      filters: [{ property: 'status', operator: 'is', value: 'draft' }],
      sorts: [{ property: 'updatedAt', direction: 'desc' }],
    });
  });

  test('preserves multi-sort precedence during a URL round trip', () => {
    const written = writeDataViewQuery(new URLSearchParams(), {
      search: '',
      filters: [],
      sorts: [
        { property: 'title', direction: 'asc' },
        { property: 'updatedAt', direction: 'desc' },
      ],
    });

    expect(parseDataViewQuery(written, properties).sorts).toEqual([
      { property: 'title', direction: 'asc' },
      { property: 'updatedAt', direction: 'desc' },
    ]);
  });
});
