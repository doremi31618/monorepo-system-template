export type DataViewPropertyType =
  'text' | 'enum' | 'date' | 'number' | 'relation' | 'boolean';

export type DataViewFilterOperator =
  'is' | 'isNot' | 'isAnyOf' | 'before' | 'after' | 'between';

export interface DataViewOption {
  value: string;
  label: string;
}

export interface DataViewProperty {
  key: string;
  label: string;
  type: DataViewPropertyType;
  operators: DataViewFilterOperator[];
  options?: DataViewOption[];
  sortable?: boolean;
}

export interface DataViewFilterRule {
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

function hasValue(value: unknown): value is string | string[] {
  if (typeof value === 'string') return value.trim().length > 0;
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
): URLSearchParams {
  const next = new URLSearchParams(current);
  next.delete('q');
  next.delete('filter');
  next.delete('sort');
  next.delete('page');

  const search = query.search.trim();
  if (search) next.set('q', search);

  for (const filter of query.filters) {
    if (!filter.property || !filter.operator || !hasValue(filter.value))
      continue;
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

  for (const encoded of params.getAll('filter')) {
    try {
      const candidate = JSON.parse(encoded) as Partial<DataViewFilterRule>;
      const property = candidate.property
        ? propertyByKey.get(candidate.property)
        : undefined;
      if (
        !property ||
        !candidate.operator ||
        !property.operators.includes(candidate.operator) ||
        !hasValue(candidate.value) ||
        !isAllowedValue(property, candidate.value)
      ) {
        continue;
      }
      filters.push({
        property: property.key,
        operator: candidate.operator,
        value: candidate.value,
      });
    } catch {
      // Invalid URL state is ignored at the package boundary.
    }
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
