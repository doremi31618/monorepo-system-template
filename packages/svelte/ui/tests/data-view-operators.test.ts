import { describe, expect, test } from 'bun:test';

import {
  canAddDataViewFilter,
  createDataViewRuleId,
  parseDataViewQuery,
  removeDataViewFilter,
  resolveOperandKind,
  resolveOperatorLabel,
  upsertDataViewFilter,
  writeDataViewQuery,
  type DataViewProperty,
} from '../src/lib/ui/data-view-toolbar/query.js';

const legacy: DataViewProperty = {
  key: 'status',
  label: 'Status',
  type: 'enum',
  operators: ['is', 'isNot', 'isAnyOf'],
};

const extended: DataViewProperty = {
  key: 'tags',
  label: 'Tags',
  type: 'enum',
  operators: ['containsAny', 'isEmpty'],
  operatorMeta: {
    containsAny: { operand: 'multi', label: 'contains any of' },
    isEmpty: { operand: 'none' },
  },
};

describe('filter operator operand metadata', () => {
  test('keeps the closed built-in operand behavior when no metadata is supplied', () => {
    expect(resolveOperandKind(legacy, 'is')).toBe('single');
    expect(resolveOperandKind(legacy, 'isAnyOf')).toBe('multi');
  });

  test('lets a property opt in to unary and multi operands for custom operators', () => {
    expect(resolveOperandKind(extended, 'isEmpty')).toBe('none');
    expect(resolveOperandKind(extended, 'containsAny')).toBe('multi');
  });

  test('prefers a metadata label and otherwise falls back to the toolbar label map', () => {
    const labels = { is: 'is', isEmpty: 'is empty' };
    expect(resolveOperatorLabel(extended, 'containsAny', labels)).toBe(
      'contains any of',
    );
    expect(resolveOperatorLabel(extended, 'isEmpty', labels)).toBe('is empty');
    expect(resolveOperatorLabel(legacy, 'unknownOp', labels)).toBe('unknownOp');
  });
});

const repeatable: DataViewProperty = {
  ...extended,
  allowRepeat: true,
  maxRules: 2,
};

function encode(...rules: object[]) {
  const params = new URLSearchParams();
  for (const rule of rules) params.append('filter', JSON.stringify(rule));
  return params;
}

describe('filter rule list edits', () => {
  const a = { id: 'a', property: 'tags', operator: 'containsAny', value: ['x'] };
  const b = { id: 'b', property: 'tags', operator: 'isEmpty', value: '' };
  const other = { property: 'status', operator: 'is', value: 'draft' };

  test('appends a sibling instead of replacing the property when repeat is enabled', () => {
    const next = upsertDataViewFilter([a, other], b, repeatable);
    expect(next).toEqual([a, other, b]);
  });

  test('replaces only the edited rule in place, matched by id', () => {
    const edited = { ...a, value: ['z'] };
    expect(upsertDataViewFilter([a, other, b], edited, repeatable, a)).toEqual([
      edited,
      other,
      b,
    ]);
  });

  test('keeps one rule per property for callers that did not opt in', () => {
    const replacement = { property: 'status', operator: 'isNot', value: 'draft' };
    expect(upsertDataViewFilter([other], replacement, legacy)).toEqual([
      replacement,
    ]);
  });

  test('removes only the targeted rule and preserves its siblings', () => {
    expect(removeDataViewFilter([a, other, b], b)).toEqual([a, other]);
    expect(removeDataViewFilter([other], other)).toEqual([]);
  });

  test('reports whether another rule fits under maxRules', () => {
    expect(canAddDataViewFilter([a], repeatable)).toBe(true);
    expect(canAddDataViewFilter([a, b], repeatable)).toBe(false);
    expect(canAddDataViewFilter([other], legacy)).toBe(true);
  });
});

describe('opt-in unary and repeated rules in the query codec', () => {
  test('writes and parses an empty-value unary rule only when the property opts in', () => {
    const query = {
      search: '',
      filters: [{ property: 'tags', operator: 'isEmpty', value: '' }],
      sorts: [],
    };

    const written = writeDataViewQuery(new URLSearchParams(), query, [
      extended,
    ]);
    expect(written.getAll('filter')).toEqual([JSON.stringify(query.filters[0])]);
    expect(parseDataViewQuery(written, [extended]).filters).toEqual(
      query.filters,
    );

    expect(
      writeDataViewQuery(new URLSearchParams(), query).getAll('filter'),
    ).toEqual([]);
    expect(parseDataViewQuery(written, [legacy]).filters).toEqual([]);
  });

  test('keeps repeated rules with their ids only for allowRepeat properties, up to maxRules', () => {
    const params = encode(
      { id: 'a', property: 'tags', operator: 'containsAny', value: ['x'] },
      { id: 'b', property: 'tags', operator: 'isEmpty', value: '' },
      { id: 'c', property: 'tags', operator: 'containsAny', value: ['y'] },
    );

    expect(
      parseDataViewQuery(params, [repeatable]).filters.map((rule) => rule.id),
    ).toEqual(['a', 'b']);
    expect(parseDataViewQuery(params, [extended]).filters.map((r) => r.id)).toEqual(
      ['a'],
    );
  });

  test('honors normalizeText for single text validity and keeps the exact value', () => {
    const feff = '﻿';
    const plain: DataViewProperty = {
      key: 'code',
      label: 'Code',
      type: 'text',
      operators: ['contains'],
      allowRepeat: true,
    };
    const asciiEdges = /^[\t\n\v\f\r ]+|[\t\n\v\f\r ]+$/g;
    const normalized: DataViewProperty = {
      ...plain,
      normalizeText: (raw) => raw.replace(asciiEdges, ''),
    };
    const kept = [
      { id: 'code-1', property: 'code', operator: 'contains', value: feff },
      { id: 'code-2', property: 'code', operator: 'contains', value: `${feff}a${feff}` },
    ];
    const query = {
      search: '',
      filters: [
        ...kept,
        { id: 'code-3', property: 'code', operator: 'contains', value: ' \t ' },
      ],
      sorts: [],
    };

    const written = writeDataViewQuery(new URLSearchParams(), query, [normalized]);
    expect(written.getAll('filter')).toEqual(kept.map((rule) => JSON.stringify(rule)));
    expect(parseDataViewQuery(written, [normalized]).filters).toEqual(kept);

    // Without a normalizer the old JS-trim validity applies.
    expect(
      writeDataViewQuery(new URLSearchParams(), query, [plain]).getAll('filter'),
    ).toEqual([JSON.stringify(kept[1])]);
    expect(parseDataViewQuery(written, [plain]).filters).toEqual([kept[1]]);
  });
});

describe('repeated rule identity', () => {
  const status: DataViewProperty = { ...legacy, allowRepeat: true };
  const tagA = { id: 'a', property: 'tags', operator: 'containsAny', value: ['x'] };
  const statusA = { id: 'a', property: 'status', operator: 'is', value: 'draft' };

  test('scopes id matching to the property so equal ids on other properties are untouched', () => {
    expect(removeDataViewFilter([tagA, statusA], { ...statusA })).toEqual([tagA]);
    const edited = { ...statusA, value: 'done' };
    expect(
      upsertDataViewFilter([tagA, statusA], edited, status, { ...statusA }),
    ).toEqual([tagA, edited]);
  });

  test('removes or edits only the referenced sibling when ids repeat on one property', () => {
    const first = { id: 'a', property: 'tags', operator: 'isEmpty', value: '' };
    const second = { id: 'a', property: 'tags', operator: 'containsAny', value: ['y'] };
    expect(removeDataViewFilter([first, second], second)).toEqual([first]);
    const edited = { ...second, value: ['z'] };
    expect(upsertDataViewFilter([first, second], edited, repeatable, second)).toEqual(
      [first, edited],
    );
  });

  test('refuses an ambiguous copy instead of changing every sibling with that id', () => {
    const first = { id: 'a', property: 'tags', operator: 'isEmpty', value: '' };
    const second = { id: 'a', property: 'tags', operator: 'containsAny', value: ['y'] };
    const filters = [first, second];
    expect(removeDataViewFilter(filters, { ...second })).toBe(filters);
    expect(
      upsertDataViewFilter(filters, { ...second, value: ['z'] }, repeatable, { ...second }),
    ).toBe(filters);
  });

  test('does not append when an edited id-less repeated rule is no longer in the list', () => {
    const stale = { property: 'tags', operator: 'isEmpty', value: '' };
    const filters = [{ ...stale }, { ...stale }];
    const edited = { property: 'tags', operator: 'containsAny', value: ['z'] };
    expect(upsertDataViewFilter(filters, edited, repeatable, stale)).toBe(filters);
    expect(upsertDataViewFilter(filters, edited, repeatable)).toEqual([
      ...filters,
      edited,
    ]);
  });

  test('parse keeps every valid repeated rule and gives each a unique, reproducible id', () => {
    const unbounded: DataViewProperty = { ...extended, allowRepeat: true };
    const params = encode(
      { id: 'a', property: 'tags', operator: 'containsAny', value: ['x'] },
      { id: 'a', property: 'tags', operator: 'isEmpty', value: '' },
      { property: 'tags', operator: 'containsAny', value: ['y'] },
      { id: 'tags-1', property: 'tags', operator: 'containsAny', value: ['z'] },
      { id: 'a', property: 'status', operator: 'is', value: 'draft' },
    );
    const parsed = parseDataViewQuery(params, [unbounded, legacy]).filters;
    expect(parsed.map((rule) => rule.value)).toEqual([['x'], '', ['y'], ['z'], 'draft']);
    const repeatIds = parsed.slice(0, 4).map((rule) => rule.id);
    expect(repeatIds[0]).toBe('a');
    expect(repeatIds[3]).toBe('tags-1');
    expect(new Set(repeatIds).size).toBe(4);
    expect(parsed[4]).toEqual({ id: 'a', property: 'status', operator: 'is', value: 'draft' });
    expect(parseDataViewQuery(params, [unbounded, legacy]).filters).toEqual(parsed);
  });

  test('new rule ids avoid every current id, including other properties', () => {
    const filters = [
      { id: 'note-1', property: 'status', operator: 'is', value: 'draft' },
      { id: 'note-2', property: 'note', operator: 'isEmpty', value: '' },
    ];
    expect(createDataViewRuleId(filters, 'note')).toBe('note-3');
    expect(createDataViewRuleId([], 'note')).toBe('note-1');
  });
});
