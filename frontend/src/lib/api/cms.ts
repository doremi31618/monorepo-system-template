
import { httpClient } from '../utils';

export interface CmsPost {
    id: string;
    slug: string;
    status: 'draft' | 'published' | 'archived';
    authorId: number;
    createdAt: string;
    updatedAt: string;
    title?: string;
    content?: {
        title?: string;
        body?: any;
        coverImage?: string;
        seoTitle?: string;
        seoDesc?: string;
    };
}

export interface ListPostsResponse {
    data: CmsPost[];
    page: number;
    limit: number;
}

export async function getPosts(params: { page?: number; limit?: number; locale?: string }) {
    const query = new URLSearchParams({
        page: (params.page || 1).toString(),
        limit: (params.limit || 10).toString(),
        locale: params.locale || 'en'
    }).toString();
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
    data: { title?: string; body?: any; seoTitle?: string; seoDesc?: string; coverImage?: string }
) {
    return await httpClient.put<CmsPost>(`/cms/posts/${id}/content?locale=${locale}`, data);
}

export async function updatePostStatus(id: string, status: string, slug?: string) {
    return await httpClient.patch<CmsPost>(`/cms/posts/${id}/status`, { status, slug });
}
