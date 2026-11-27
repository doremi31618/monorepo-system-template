/** Column profile shared by every table. `key` is the stable ID; labels may be renamed freely. */
export interface NotionColumn {
  key: string;
  label: string;
  /** Identity column: always visible and first among the data columns. */
  identity?: boolean;
  /** Utility column (selection, row actions): fixed, never listed in the display settings. */
  utility?: boolean;
  /** A utility column placed after the data columns (row actions). */
  trailing?: boolean;
  /** Visible but not hideable or movable. */
  locked?: boolean;
  /** Desktop width of the column's bounded content box (CSS length, default 14rem). Phones ignore it. */
  width?: string;
  align?: 'start' | 'end';
  /**
   * Phone card role (desktop ignores it). `title`: the identity cell as the card heading, no label.
   * `status`: the primary state right under the title, no label. `footer`: metadata (IDs, dates) kept at the
   * bottom of the card with its label. Unset columns are ordinary label/value rows.
   */
  mobile?: 'title' | 'status' | 'footer';
  class?: string;
}

/** Session-only view preference. Holds column keys only, never field values. */
export interface ColumnPrefs {
  order: string[];
  hidden: string[];
}

export interface ConfigurableColumn {
  column: NotionColumn;
  visible: boolean;
  /** Identity and locked columns can be neither hidden nor moved. */
  locked: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export const emptyColumnPrefs = (): ColumnPrefs => ({ order: [], hidden: [] });

const isLocked = (column: NotionColumn) => Boolean(column.identity || column.locked);

function keys(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

/**
 * Reconciles a (possibly stale or hand-made) preference with the current columns:
 * unknown keys are dropped, duplicates collapse, new columns are appended in
 * definition order, and locked columns stay first and visible.
 */
export function reconcileColumnPrefs(columns: NotionColumn[], prefs?: unknown): ColumnPrefs {
  const data = columns.filter((column) => !column.utility);
  const known = new Set(data.map((column) => column.key));
  const raw = prefs && typeof prefs === 'object' ? (prefs as Partial<ColumnPrefs>) : {};
  const order: string[] = [];
  for (const key of keys(raw.order)) if (known.has(key) && !order.includes(key)) order.push(key);
  for (const column of data) if (!order.includes(column.key)) order.push(column.key);
  const lockedKeys = new Set(data.filter(isLocked).map((column) => column.key));
  // Locked columns lead, in definition order; the rest keep the user's order.
  const lockedFirst = data.filter(isLocked).map((column) => column.key);
  const ordered = [...lockedFirst, ...order.filter((key) => !lockedKeys.has(key))];
  const hidden = [...new Set(keys(raw.hidden))].filter((key) => known.has(key) && !lockedKeys.has(key));
  return { order: ordered, hidden };
}

/** Leading utility columns, then data columns in the reconciled order (hidden removed), then trailing utility columns. */
export function visibleColumns(columns: NotionColumn[], prefs?: unknown): NotionColumn[] {
  const { order, hidden } = reconcileColumnPrefs(columns, prefs);
  const byKey = new Map(columns.map((column) => [column.key, column]));
  return [
    ...columns.filter((column) => column.utility && !column.trailing),
    ...order.filter((key) => !hidden.includes(key)).map((key) => byKey.get(key)!),
    ...columns.filter((column) => column.utility && column.trailing),
  ];
}

export function configurableColumns(columns: NotionColumn[], prefs?: unknown): ConfigurableColumn[] {
  const { order, hidden } = reconcileColumnPrefs(columns, prefs);
  const byKey = new Map(columns.map((column) => [column.key, column]));
  const firstMovable = order.findIndex((key) => !isLocked(byKey.get(key)!));
  return order.map((key, index) => {
    const column = byKey.get(key)!;
    const locked = isLocked(column);
    return {
      column,
      locked,
      visible: !hidden.includes(key),
      canMoveUp: !locked && index > firstMovable,
      canMoveDown: !locked && index < order.length - 1,
    };
  });
}

export function toggleColumn(columns: NotionColumn[], prefs: unknown, key: string, visible: boolean): ColumnPrefs {
  const current = reconcileColumnPrefs(columns, prefs);
  const column = columns.find((item) => item.key === key && !item.utility);
  if (!column || isLocked(column)) return current;
  const hidden = visible ? current.hidden.filter((item) => item !== key) : [...new Set([...current.hidden, key])];
  return { order: current.order, hidden };
}

/** Moves one column by `delta` positions among the movable columns; locked columns never shift. */
export function moveColumn(columns: NotionColumn[], prefs: unknown, key: string, delta: -1 | 1): ColumnPrefs {
  const current = reconcileColumnPrefs(columns, prefs);
  const from = current.order.indexOf(key);
  const target = from + delta;
  const byKey = new Map(columns.map((column) => [column.key, column]));
  const moved = byKey.get(key);
  const neighbour = byKey.get(current.order[target] ?? '');
  if (from < 0 || !moved || !neighbour || isLocked(moved) || isLocked(neighbour)) return current;
  const order = [...current.order];
  [order[from], order[target]] = [order[target], order[from]];
  return { order, hidden: current.hidden };
}
