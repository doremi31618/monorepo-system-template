export type CmsPostStatus = 'draft' | 'published' | 'archived';

export interface CmsTag {
  id: string;
  name: string;
  slug: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  postCount?: number;
  totalViews?: number;
}

export interface CmsPostContent {
  title?: string | null;
  body?: unknown;
  coverImage?: string | null;
  seoTitle?: string | null;
  seoDesc?: string | null;
  linkPreviewUrl?: string | null;
  linkPreviewTitle?: string | null;
  linkPreviewDescription?: string | null;
  linkPreviewImage?: string | null;
}

export interface CmsPost {
  id: string;
  slug: string;
  status: CmsPostStatus;
  authorId: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  publishedAt?: Date | string | null;
  viewCount?: number;
  title?: string;
  content?: CmsPostContent | null;
  tags?: CmsTag[];
}

export interface ListPostsResponse {
  data: CmsPost[];
  page: number;
  limit: number;
  total?: number;
}

export interface ListTagsResponse {
  data: CmsTag[];
}

export interface PublicCmsPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  publishedAt?: Date | string | null;
  viewCount: number;
  tags: CmsTag[];
}

export interface PublicCmsPostDetail extends CmsPost {
  locale?: string;
  content: CmsPostContent;
  tags: CmsTag[];
  viewCount: number;
}

export interface ListPublicPostsResponse {
  data: PublicCmsPostSummary[];
  page: number;
  limit: number;
  total?: number;
}

export interface PublicHomeResponse {
  latestPosts: PublicCmsPostSummary[];
  hotTags: Array<{
    id: string;
    name: string;
    slug: string;
    totalViews: number;
    posts: PublicCmsPostSummary[];
  }>;
}

export interface CmsLinkPreview {
  url: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  siteName?: string | null;
}

export interface CmsDashboardAnalyticsResponse {
  dailyViews: Array<{ date: string; views: number }>;
  topPosts: Array<{
    id: string;
    slug: string;
    title: string;
    viewCount: number;
    publishedAt?: Date | string | null;
    updatedAt: Date | string;
  }>;
  topTags: Array<{
    id: string;
    name: string;
    slug: string;
    totalViews: number;
    postCount: number;
  }>;
}

export type CmsPostSummary = CmsPost;
export type CmsPublicPostSummary = PublicCmsPostSummary;

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

export type CmsSearchPage<T> = {
	data: T[];
	page: number;
	limit: number;
	total?: number;
};

export interface CmsSearchCapability {
	searchPublished(
		query: CmsPublicSearchQuery
	): Promise<CmsSearchPage<CmsPublicPostSummary>>;
	searchWorkspace(
		query: CmsPrivateSearchQuery
	): Promise<CmsSearchPage<CmsPostSummary>>;
}
