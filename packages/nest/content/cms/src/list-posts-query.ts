export type PostSortProperty = 'updatedAt' | 'createdAt' | 'publishedAt' | 'title' | 'viewCount';
export type PostSortRule = { property: PostSortProperty; direction: 'asc' | 'desc' };

const allowed = new Set<PostSortProperty>(['updatedAt', 'createdAt', 'publishedAt', 'title', 'viewCount']);

export function parsePostSorts(value?: string | string[]): PostSortRule[] {
  const encoded = value === undefined ? [] : Array.isArray(value) ? value : [value];
  const result: PostSortRule[] = [];
  for (const item of encoded) {
    const separator = item.lastIndexOf(':');
    if (separator < 1) continue;
    const property = item.slice(0, separator) as PostSortProperty;
    const direction = item.slice(separator + 1);
    if (!allowed.has(property) || (direction !== 'asc' && direction !== 'desc')) continue;
    if (result.some((sort) => sort.property === property)) continue;
    result.push({ property, direction });
  }
  return result.length ? result : [{ property: 'updatedAt', direction: 'desc' }];
}
