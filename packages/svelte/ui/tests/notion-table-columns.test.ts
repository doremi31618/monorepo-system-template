import { describe, expect, test } from 'bun:test';

import {
  configurableColumns,
  moveColumn,
  reconcileColumnPrefs,
  toggleColumn,
  visibleColumns,
  type NotionColumn,
} from '../src/lib/ui/notion-table/columns.js';

const columns: NotionColumn[] = [
  { key: 'select', label: 'Select', utility: true },
  { key: 'name', label: 'Name', identity: true, mobile: 'title' },
  { key: 'company', label: 'Company' },
  { key: 'skills', label: 'Skills' },
  { key: 'updated', label: 'Updated', mobile: 'footer' },
];
const keysOf = (list: NotionColumn[]) => list.map((column) => column.key);

describe('notion-table column preferences', () => {
  test('default view is utility, identity, then data columns in definition order', () => {
    expect(keysOf(visibleColumns(columns))).toEqual(['select', 'name', 'company', 'skills', 'updated']);
  });

  test('hiding and reordering use stable keys, not labels or positions', () => {
    let prefs = toggleColumn(columns, undefined, 'skills', false);
    prefs = moveColumn(columns, prefs, 'updated', -1);
    expect(keysOf(visibleColumns(columns, prefs))).toEqual(['select', 'name', 'company', 'updated']);
    const renamed = columns.map((column) => (column.key === 'company' ? { ...column, label: 'Organization' } : column));
    expect(keysOf(visibleColumns(renamed, prefs))).toEqual(['select', 'name', 'company', 'updated']);
    expect(reconcileColumnPrefs(columns, prefs).order).toEqual(['name', 'company', 'updated', 'skills']);
  });

  test('identity and locked columns can be neither hidden nor moved, and lead the data columns', () => {
    expect(toggleColumn(columns, undefined, 'name', false).hidden).toEqual([]);
    expect(moveColumn(columns, undefined, 'name', 1).order[0]).toBe('name');
    expect(moveColumn(columns, undefined, 'company', -1).order).toEqual(['name', 'company', 'skills', 'updated']);
    const view = configurableColumns(columns);
    expect(view[0]).toMatchObject({ locked: true, canMoveUp: false, canMoveDown: false });
    expect(view[1]).toMatchObject({ locked: false, canMoveUp: false, canMoveDown: true });
    expect(view.at(-1)).toMatchObject({ canMoveUp: true, canMoveDown: false });

    const withLocked = columns.map((column) => (column.key === 'skills' ? { ...column, locked: true } : column));
    expect(toggleColumn(withLocked, undefined, 'skills', false).hidden).toEqual([]);
    expect(reconcileColumnPrefs(withLocked, { order: ['updated', 'company'] }).order).toEqual(['name', 'skills', 'updated', 'company']);
  });

  test('utility columns are always first, never configurable, and trailing ones stay last', () => {
    expect(configurableColumns(columns).some((item) => item.column.key === 'select')).toBe(false);
    expect(toggleColumn(columns, undefined, 'select', false).hidden).toEqual([]);
    expect(keysOf(visibleColumns(columns, { order: ['select', 'updated'], hidden: ['select'] }))[0]).toBe('select');

    const withActions: NotionColumn[] = [...columns, { key: 'actions', label: 'Actions', utility: true, trailing: true }];
    const prefs = toggleColumn(withActions, moveColumn(withActions, undefined, 'updated', -1), 'skills', false);
    expect(keysOf(visibleColumns(withActions, prefs))).toEqual(['select', 'name', 'company', 'updated', 'actions']);
    expect(configurableColumns(withActions).some((item) => item.column.key === 'actions')).toBe(false);
  });

  test('stale, unknown, duplicate or malformed preferences are repaired, never trusted', () => {
    const repaired = reconcileColumnPrefs(columns, { order: ['gone', 'skills', 'skills', 7], hidden: ['name', 'gone', 'updated', 'updated'] });
    expect(repaired).toEqual({ order: ['name', 'skills', 'company', 'updated'], hidden: ['updated'] });
    for (const bad of [null, 'x', 42, { order: 'name', hidden: {} }, []]) {
      expect(reconcileColumnPrefs(columns, bad)).toEqual({ order: ['name', 'company', 'skills', 'updated'], hidden: [] });
    }
  });

  test('a column added later appears at the end and a removed one disappears from saved preferences', () => {
    const prefs = toggleColumn(columns, moveColumn(columns, undefined, 'skills', -1), 'updated', false);
    const next: NotionColumn[] = [...columns.filter((column) => column.key !== 'company'), { key: 'phone', label: 'Phone' }];
    expect(reconcileColumnPrefs(next, prefs)).toEqual({ order: ['name', 'skills', 'updated', 'phone'], hidden: ['updated'] });
  });

  test('toggling an unknown key is a no-op and showing a column removes it from hidden', () => {
    const hidden = toggleColumn(columns, undefined, 'skills', false);
    expect(toggleColumn(columns, hidden, 'missing', false)).toEqual(hidden);
    expect(toggleColumn(columns, hidden, 'skills', true).hidden).toEqual([]);
  });

  test('a hidden column with a footer role is not rendered, so metadata cannot bypass preferences', () => {
    const prefs = toggleColumn(columns, undefined, 'updated', false);
    expect(visibleColumns(columns, prefs).some((column) => column.mobile === 'footer')).toBe(false);
  });
});
