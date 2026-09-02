export type RoleSortProperty = 'name' | 'createdAt';
export type RoleSortRule = { property: RoleSortProperty; direction: 'asc' | 'desc' };

const allowed = new Set<RoleSortProperty>(['name', 'createdAt']);

export function parseRoleSorts(value?: string | string[]): RoleSortRule[] {
  const encoded = value === undefined ? [] : Array.isArray(value) ? value : [value];
  const result: RoleSortRule[] = [];
  for (const item of encoded) {
    const separator = item.lastIndexOf(':');
    if (separator < 1) continue;
    const property = item.slice(0, separator) as RoleSortProperty;
    const direction = item.slice(separator + 1);
    if (!allowed.has(property) || (direction !== 'asc' && direction !== 'desc')) continue;
    if (result.some((sort) => sort.property === property)) continue;
    result.push({ property, direction });
  }
  return result.length ? result : [{ property: 'name', direction: 'asc' }];
}
