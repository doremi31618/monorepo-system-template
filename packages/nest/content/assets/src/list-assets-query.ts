export type AssetSortProperty = 'createdAt' | 'updatedAt' | 'name' | 'size';
export type AssetSortRule = { property: AssetSortProperty; direction: 'asc' | 'desc' };

const allowed = new Set<AssetSortProperty>(['createdAt', 'updatedAt', 'name', 'size']);

export function parseAssetSorts(value?: string | string[]): AssetSortRule[] {
  const encoded = value === undefined ? [] : Array.isArray(value) ? value : [value];
  const result: AssetSortRule[] = [];
  for (const item of encoded) {
    const separator = item.lastIndexOf(':');
    if (separator < 1) continue;
    const property = item.slice(0, separator) as AssetSortProperty;
    const direction = item.slice(separator + 1);
    if (!allowed.has(property) || (direction !== 'asc' && direction !== 'desc')) continue;
    if (result.some((sort) => sort.property === property)) continue;
    result.push({ property, direction });
  }
  return result.length ? result : [{ property: 'createdAt', direction: 'desc' }];
}
