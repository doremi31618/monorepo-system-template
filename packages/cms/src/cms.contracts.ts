export type CmsPostStatus = 'draft' | 'published' | 'archived';

export type CmsTagSummary = {
  id: string;
  name: string;
  slug: string;
};

export type CmsPublicSearchQuery = {
  query?: string;
  locale?: string;
  tagSlug?: string;
  sort?: 'latest' | 'popular';
  page?: number;
  limit?: number;
};

export type CmsPrivateSearchQuery = {
  query?: string;
  locale?: string;
  status?: CmsPostStatus | 'all';
  tagId?: string;
  updatedFrom?: string;
  updatedTo?: string;
  page?: number;
  limit?: number;
};

export type CmsPublicPostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  tags: CmsTagSummary[];
  coverImage: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};

export type CmsPostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  tags: CmsTagSummary[];
  status: CmsPostStatus;
  authorId: number | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};

export type CmsSearchPage<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
};

export interface CmsSearchCapability {
  searchPublished(
    query: CmsPublicSearchQuery,
  ): Promise<CmsSearchPage<CmsPublicPostSummary>>;
  searchWorkspace(
    query: CmsPrivateSearchQuery,
  ): Promise<CmsSearchPage<CmsPostSummary>>;
}
