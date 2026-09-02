
import { httpClient } from '../utils';
import type {
    CmsDashboardAnalyticsResponse,
    CmsLinkPreview,
    CmsPost,
    CmsTag,
    ListPostsResponse,
    ListPublicPostsResponse,
    ListTagsResponse,
    PublicCmsPostDetail,
    PublicHomeResponse,
} from '@platform/types-content';

export type {
    CmsDashboardAnalyticsResponse,
    CmsLinkPreview,
    CmsPost,
    CmsTag,
    ListPostsResponse,
    ListPublicPostsResponse,
    ListTagsResponse,
    PublicCmsPostDetail,
    PublicCmsPostSummary,
    PublicHomeResponse,
} from '@platform/types-content';

export async function getPosts(params: {
    page?: number;
    limit?: number;
    locale?: string;
    query?: string;
    status?: string;
    tagId?: string;
    updatedFrom?: string;
    updatedTo?: string;
    sort?: string[];
}) {
    const queryParams = new URLSearchParams({
        page: (params.page || 1).toString(),
        limit: (params.limit || 10).toString(),
        locale: params.locale || 'en',
    });

    if (params.query?.trim()) {
        queryParams.set('query', params.query.trim());
    }

    if (params.status && params.status !== 'all') {
        queryParams.set('status', params.status);
    }

    if (params.tagId && params.tagId !== 'all') {
        queryParams.set('tagId', params.tagId);
    }

    if (params.updatedFrom?.trim()) {
        queryParams.set('updatedFrom', params.updatedFrom.trim());
    }

    if (params.updatedTo?.trim()) {
        queryParams.set('updatedTo', params.updatedTo.trim());
    }

    for (const sort of params.sort ?? []) {
        queryParams.append('sort', sort);
    }

    const query = queryParams.toString();
    return await httpClient.get<ListPostsResponse>(`/cms/posts?${query}`);
}

export async function createPost(title: string, locale: string = 'en') {
    return await httpClient.post<CmsPost>('/cms/posts', { title, locale });
}

export async function getPost(id: string, locale: string = 'en') {
    return await httpClient.get<CmsPost>(`/cms/posts/${id}?locale=${locale}`);
}

export async function updatePostContent(
    id: string,
    locale: string,
    data: {
        title?: string;
        body?: unknown;
        seoTitle?: string | null;
        seoDesc?: string | null;
        coverImage?: string | null;
        linkPreviewUrl?: string | null;
        linkPreviewTitle?: string | null;
        linkPreviewDescription?: string | null;
        linkPreviewImage?: string | null;
    }
) {
    return await httpClient.put<CmsPost>(`/cms/posts/${id}/content?locale=${locale}`, data);
}

export async function updatePostStatus(id: string, status: string, slug?: string) {
    return await httpClient.patch<CmsPost>(`/cms/posts/${id}/status`, { status, slug });
}

export async function updatePostTags(id: string, locale: string, tagIds: string[]) {
    return await httpClient.put<CmsPost>(`/cms/posts/${id}/tags?locale=${locale}`, { tagIds });
}

export async function listTags(params: { query?: string } = {}) {
    const queryParams = new URLSearchParams();

    if (params.query?.trim()) {
        queryParams.set('query', params.query.trim());
    }

    const query = queryParams.toString();
    const path = query ? `/cms/tags?${query}` : '/cms/tags';
    return await httpClient.get<ListTagsResponse>(path);
}

export async function createTag(name: string) {
    return await httpClient.post<CmsTag>('/cms/tags', { name });
}

export async function updateTag(id: string, data: { name?: string }) {
    return await httpClient.put<CmsTag>(`/cms/tags/${id}`, data);
}

export async function deleteTag(id: string) {
    return await httpClient.delete<{ id: string; deleted: boolean }>(`/cms/tags/${id}`);
}

export async function getLinkPreview(url: string) {
    const query = new URLSearchParams({ url }).toString();
    return await httpClient.get<CmsLinkPreview>(`/cms/link-preview?${query}`);
}

export async function deletePost(id: string) {
    return await httpClient.delete<{ id: string; deleted: boolean }>(`/cms/posts/${id}`);
}

export async function listPublicPosts(params: {
    page?: number;
    limit?: number;
    locale?: string;
    query?: string;
    tagSlug?: string;
    sort?: 'latest' | 'popular';
} = {}) {
    const queryParams = new URLSearchParams({
        page: String(params.page ?? 1),
        limit: String(params.limit ?? 10),
        locale: params.locale || 'en',
    });

    if (params.query?.trim()) {
        queryParams.set('query', params.query.trim());
    }

    if (params.tagSlug?.trim()) {
        queryParams.set('tagSlug', params.tagSlug.trim());
    }

    if (params.sort) {
        queryParams.set('sort', params.sort);
    }

    return await httpClient.get<ListPublicPostsResponse>(`/cms/public/posts?${queryParams.toString()}`);
}

export async function getPublicPostBySlug(slug: string, locale: string = 'en') {
    const query = new URLSearchParams({ locale }).toString();
    return await httpClient.get<PublicCmsPostDetail>(`/cms/public/posts/${slug}?${query}`);
}

export async function trackPublicPostView(slug: string) {
    return await httpClient.post<{ id: string; slug: string; viewCount: number }>(`/cms/public/posts/${slug}/view`, {});
}

export async function getPublicHome(params: {
    locale?: string;
    latestLimit?: number;
    hotTagLimit?: number;
    hotPostPerTag?: number;
} = {}) {
    const queryParams = new URLSearchParams({
        locale: params.locale || 'en',
        latestLimit: String(params.latestLimit ?? 6),
        hotTagLimit: String(params.hotTagLimit ?? 4),
        hotPostPerTag: String(params.hotPostPerTag ?? 3),
    });

    return await httpClient.get<PublicHomeResponse>(`/cms/public/home?${queryParams.toString()}`);
}

export async function getCmsDashboardAnalytics(params: {
    locale?: string;
    days?: number;
    topLimit?: number;
} = {}) {
    const queryParams = new URLSearchParams({
        locale: params.locale || 'en',
        days: String(params.days ?? 14),
        topLimit: String(params.topLimit ?? 5),
    });

    return await httpClient.get<CmsDashboardAnalyticsResponse>(`/cms/dashboard/analytics?${queryParams.toString()}`);
}
