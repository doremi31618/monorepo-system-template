export type DataViewBuiltInPropertyType =
  'text' | 'enum' | 'date' | 'number' | 'relation' | 'boolean';
export type DataViewPropertyType =
  DataViewBuiltInPropertyType | (string & Record<never, never>);

export type DataViewBuiltInFilterOperator =
  'is' | 'isNot' | 'isAnyOf' | 'before' | 'after' | 'between';
export type DataViewFilterOperator =
  DataViewBuiltInFilterOperator | (string & Record<never, never>);

/** How many values an operator takes: none (unary), one, or several. */
export type DataViewOperandKind = 'none' | 'single' | 'multi';

export interface DataViewOperatorMeta {
  operand: DataViewOperandKind;
  /** Overrides the toolbar label map for this property's operator. */
  label?: string;
}

export interface DataViewOption {
  value: string;
  label: string;
}

export interface DataViewOptionRequest {
  search: string;
  cursor?: string;
  signal: AbortSignal;
}

export interface DataViewOptionPage {
  items: DataViewOption[];
  nextCursor?: string;
}

export type DataViewOptionLoader = (
  request: DataViewOptionRequest,
) => Promise<DataViewOptionPage>;

export interface DataViewFilterEditorContext {
  property: DataViewProperty;
  operator: DataViewFilterOperator;
  /** With `multi`, the editor reports values through `setSelectedValues`. */
  operand: DataViewOperandKind;
  value: string;
  endValue: string;
  selectedValues: string[];
  setValue: (value: string) => void;
  setEndValue: (value: string) => void;
  setSelectedValues: (values: string[]) => void;
}

export interface DataViewProperty {
  key: string;
  label: string;
  type: DataViewPropertyType;
  operators: DataViewFilterOperator[];
  /** Opt-in operand/label metadata; operators without an entry keep the built-in behavior. */
  operatorMeta?: Partial<Record<string, DataViewOperatorMeta>>;
  /** Lets the same property carry several independently editable rules. */
  allowRepeat?: boolean;
  /** With `allowRepeat`, the most rules this property may hold. */
  maxRules?: number;
  /**
   * Normalizes a single-value text operand (built-in input or custom editor)
   * for both Confirm validation and the committed value; an empty result
   * counts as blank. Defaults to `raw.trim()`. `between` always trims.
   */
  normalizeText?: (raw: string) => string;
  options?: DataViewOption[];
  loadOptions?: DataViewOptionLoader;
  sortable?: boolean;
}

export interface DataViewFilterRule {
  /**
   * Stable identity of a repeated rule, unique within its property. Rules are
   * matched by object reference first, then by a unique (property, id) pair;
   * an id-less copy never matches.
   */
  id?: string;
  property: string;
  operator: DataViewFilterOperator;
  value: string | string[];
}

export interface DataViewSortRule {
  property: string;
  direction: 'asc' | 'desc';
}

export interface DataViewQuery {
  search: string;
  filters: DataViewFilterRule[];
  sorts: DataViewSortRule[];
}

export function resolveOperandKind(
  property: DataViewProperty,
  operator: DataViewFilterOperator,
): DataViewOperandKind {
  return (
    property.operatorMeta?.[operator]?.operand ??
    (operator === 'isAnyOf' ? 'multi' : 'single')
  );
}

export function resolveOperatorLabel(
  property: DataViewProperty | undefined,
  operator: DataViewFilterOperator,
  labels: Record<string, string | undefined>,
): string {
  return property?.operatorMeta?.[operator]?.label ?? labels[operator] ?? operator;
}

/** Reference first; a copy matches only through a unique (property, id) pair. */
function findRuleIndex(
  filters: DataViewFilterRule[],
  rule: DataViewFilterRule,
): number {
  const exact = filters.indexOf(rule);
  if (exact >= 0 || rule.id === undefined) return exact;
  const matches = filters.flatMap((item, index) =>
    item.property === rule.property && item.id === rule.id ? [index] : [],
  );
  return matches.length === 1 ? matches[0] : -1;
}

function uniqueRuleId(propertyKey: string, taken: Set<string>): string {
  let sequence = 1;
  while (taken.has(`${propertyKey}-${sequence}`)) sequence += 1;
  return `${propertyKey}-${sequence}`;
}

/** Returns a `<propertyKey>-<n>` id not used by any rule in `filters`. */
export function createDataViewRuleId(
  filters: DataViewFilterRule[],
  propertyKey: string,
): string {
  return uniqueRuleId(
    propertyKey,
    new Set(filters.flatMap((item) => (item.id !== undefined ? [item.id] : []))),
  );
}

/**
 * Non-repeat properties keep one rule each. With `allowRepeat`, a missing
 * `editing` appends; an `editing` rule that is no longer in `filters` (or is
 * ambiguous) leaves `filters` unchanged rather than appending a duplicate.
 */
export function upsertDataViewFilter(
  filters: DataViewFilterRule[],
  rule: DataViewFilterRule,
  property: DataViewProperty,
  editing?: DataViewFilterRule,
): DataViewFilterRule[] {
  if (!property.allowRepeat)
    return [...filters.filter((item) => item.property !== rule.property), rule];
  if (!editing) return [...filters, rule];
  const index = findRuleIndex(filters, editing);
  if (index < 0) return filters;
  return filters.map((item, position) => (position === index ? rule : item));
}

/** Removes exactly one matching rule; an unmatched or ambiguous rule is a no-op. */
export function removeDataViewFilter(
  filters: DataViewFilterRule[],
  rule: DataViewFilterRule,
): DataViewFilterRule[] {
  const index = findRuleIndex(filters, rule);
  return index < 0
    ? filters
    : filters.filter((_, position) => position !== index);
}

export function canAddDataViewFilter(
  filters: DataViewFilterRule[],
  property: DataViewProperty,
): boolean {
  if (!property.allowRepeat || property.maxRules === undefined) return true;
  return (
    filters.filter((item) => item.property === property.key).length <
    property.maxRules
  );
}

/** A single text value is blank when the property's `normalizeText` (default trim) empties it. */
function hasValue(
  value: unknown,
  property: DataViewProperty | undefined,
): value is string | string[] {
  if (typeof value === 'string')
    return (property?.normalizeText?.(value) ?? value.trim()).length > 0;
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === 'string' && item.length > 0)
  );
}

function isAllowedValue(
  property: DataViewProperty,
  value: string | string[],
): boolean {
  if (!property.options) return true;
  const allowed = new Set(property.options.map((option) => option.value));
  const values = Array.isArray(value) ? value : [value];
  return values.every((item) => allowed.has(item));
}

export function writeDataViewQuery(
  current: URLSearchParams,
  query: DataViewQuery,
  properties: DataViewProperty[] = [],
): URLSearchParams {
  const next = new URLSearchParams(current);
  next.delete('q');
  next.delete('filter');
  next.delete('sort');
  next.delete('page');

  const search = query.search.trim();
  if (search) next.set('q', search);

  for (const filter of query.filters) {
    if (!filter.property || !filter.operator) continue;
    const property = properties.find((item) => item.key === filter.property);
    const unary =
      property && resolveOperandKind(property, filter.operator) === 'none';
    if (!unary && !hasValue(filter.value, property)) continue;
    next.append('filter', JSON.stringify(filter));
  }

  for (const sort of query.sorts) {
    if (!sort.property || !['asc', 'desc'].includes(sort.direction)) continue;
    next.append('sort', `${sort.property}:${sort.direction}`);
  }

  return next;
}

export function parseDataViewQuery(
  params: URLSearchParams,
  properties: DataViewProperty[],
): DataViewQuery {
  const propertyByKey = new Map(
    properties.map((property) => [property.key, property]),
  );
  const filters: DataViewFilterRule[] = [];
  const candidates: Partial<DataViewFilterRule>[] = [];
  for (const encoded of params.getAll('filter')) {
    try {
      const candidate: unknown = JSON.parse(encoded);
      if (candidate && typeof candidate === 'object')
        candidates.push(candidate as Partial<DataViewFilterRule>);
    } catch {
      // Invalid URL state is ignored at the package boundary.
    }
  }
  // Ids are unique per property; repeated rules missing one, or repeating
  // one, get a deterministic id that no incoming rule already claims.
  const idSet = (map: Map<string, Set<string>>, key: string) => {
    let ids = map.get(key);
    if (!ids) map.set(key, (ids = new Set()));
    return ids;
  };
  const claimed = new Map<string, Set<string>>();
  const taken = new Map<string, Set<string>>();
  for (const candidate of candidates) {
    if (typeof candidate.property === 'string' && typeof candidate.id === 'string')
      idSet(claimed, candidate.property).add(candidate.id);
  }

  for (const candidate of candidates) {
    const property =
      typeof candidate.property === 'string'
        ? propertyByKey.get(candidate.property)
        : undefined;
    const sameProperty = property
      ? filters.filter((filter) => filter.property === property.key).length
      : 0;
    if (
      !property ||
      !candidate.operator ||
      !property.operators.includes(candidate.operator) ||
      (resolveOperandKind(property, candidate.operator) === 'none'
        ? candidate.value !== ''
        : !hasValue(candidate.value, property) ||
          !isAllowedValue(property, candidate.value)) ||
      (property.allowRepeat
        ? property.maxRules !== undefined && sameProperty >= property.maxRules
        : sameProperty > 0)
    ) {
      continue;
    }
    const used = idSet(taken, property.key);
    let id =
      typeof candidate.id === 'string' && candidate.id && !used.has(candidate.id)
        ? candidate.id
        : undefined;
    if (id === undefined && property.allowRepeat)
      id = uniqueRuleId(
        property.key,
        new Set([...idSet(claimed, property.key), ...used]),
      );
    if (id !== undefined) used.add(id);
    filters.push({
      ...(id !== undefined ? { id } : {}),
      property: property.key,
      operator: candidate.operator,
      value: candidate.value as string | string[],
    });
  }

  const sorts: DataViewSortRule[] = [];
  for (const encoded of params.getAll('sort')) {
    const separator = encoded.lastIndexOf(':');
    if (separator < 1) continue;
    const propertyKey = encoded.slice(0, separator);
    const direction = encoded.slice(separator + 1);
    const property = propertyByKey.get(propertyKey);
    if (!property?.sortable || (direction !== 'asc' && direction !== 'desc'))
      continue;
    if (sorts.some((sort) => sort.property === propertyKey)) continue;
    sorts.push({ property: propertyKey, direction });
  }

  return {
    search: params.get('q')?.trim() ?? '',
    filters,
    sorts,
  };
}
