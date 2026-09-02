export type UserSortProperty = 'name' | 'email' | 'createdAt';
export type UserSortRule = { property: UserSortProperty; direction: 'asc' | 'desc' };

const allowed = new Set<UserSortProperty>(['name', 'email', 'createdAt']);

export function parseUserSorts(value?: string | string[]): UserSortRule[] {
  const encoded = value === undefined ? [] : Array.isArray(value) ? value : [value];
  const result: UserSortRule[] = [];
  for (const item of encoded) {
    const separator = item.lastIndexOf(':');
    if (separator < 1) continue;
    const property = item.slice(0, separator) as UserSortProperty;
    const direction = item.slice(separator + 1);
    if (!allowed.has(property) || (direction !== 'asc' && direction !== 'desc')) continue;
    if (result.some((sort) => sort.property === property)) continue;
    result.push({ property, direction });
  }
  return result.length ? result : [{ property: 'createdAt', direction: 'desc' }];
}
