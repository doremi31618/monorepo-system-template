import { describe, expect, test } from 'bun:test';

import * as NotionTable from '../src/lib/ui/notion-table/index.js';

describe('notion-table public package contract', () => {
  test('exports the generic table, display settings, More menu and column helpers only', () => {
    expect(Object.keys(NotionTable).sort()).toEqual([
      'ColumnDisplay',
      'NotionMoreMenu',
      'NotionTable',
      'configurableColumns',
      'defaultNotionTableLabels',
      'emptyColumnPrefs',
      'moveColumn',
      'reconcileColumnPrefs',
      'toggleColumn',
      'visibleColumns',
    ]);
  });

  test('default labels are generic English and the move labels name the column', () => {
    const labels = NotionTable.defaultNotionTableLabels;
    expect(labels.moveUp('Name')).toBe('Move up: Name');
    expect(labels.moveDown('Name')).toBe('Move down: Name');
    expect(NotionTable.emptyColumnPrefs()).toEqual({ order: [], hidden: [] });
  });
});
