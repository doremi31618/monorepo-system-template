import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { posts, postContents } from './cms.schema.js';
// import { users } from '../user/user.schema.js';

import { renderBlocksToHtml, Block } from './cms.utils.js';

@Injectable()
export class CmsService {
    constructor(
        @Inject('DB') private db: NodePgDatabase<any>,
    ) { }

    async createPost(userId: number, title: string, locale: string = 'en') {
        // 1. Create Post
        const [newPost] = await this.db.insert(posts).values({
            slug: uuidv4(), // Temporary slug, user should update
            status: 'draft',
            authorId: userId,
        }).returning();

        // 2. Create Content for Locale
        await this.db.insert(postContents).values({
            postId: newPost.id,
            locale: locale,
            title: title,
            body: {}, // Empty JSON or initial structure
        });

        return this.getPost(newPost.id, locale);
    }

    async getPost(id: string, locale: string) {
        const [post] = await this.db.select().from(posts).where(eq(posts.id, id));
        if (!post) throw new NotFoundException('Post not found');

        const [content] = await this.db.select().from(postContents).where(
            and(eq(postContents.postId, id), eq(postContents.locale, locale))
        );

        return { ...post, content: content || null };
    }

    async updatePostContent(id: string, locale: string, data: { title?: string; body?: any; seoTitle?: string; seoDesc?: string; coverImage?: string }) {
        let htmlContent = undefined;
        // Check if body is a block array and generate HTML
        if (data.body && Array.isArray(data.body)) {
            try {
                htmlContent = renderBlocksToHtml(data.body as Block[]);
            } catch (e) {
                // Ignore if not block array
            }
        }

        // Upsert logic
        await this.db.insert(postContents).values({
            postId: id,
            locale: locale,
            ...data,
            htmlContent,
        }).onConflictDoUpdate({
            target: [postContents.postId, postContents.locale],
            set: {
                ...data,
                htmlContent: htmlContent !== undefined ? htmlContent : undefined,
                updatedAt: new Date()
            },
        });

        return this.getPost(id, locale);
    }

    async updatePostStatus(id: string, status: string, slug?: string) {
        await this.db.update(posts).set({
            status,
            slug: slug || undefined, // Only update if provided
            updatedAt: new Date()
        }).where(eq(posts.id, id));

        return this.db.select().from(posts).where(eq(posts.id, id));
    }

    async listPosts(page = 1, limit = 10, locale = 'en') {
        const offset = (page - 1) * limit;

        // Simple join simulation or just list posts
        // For now, listing posts and fetching their specific locale title if compatible
        // TODO: Use true JOIN when schema type inference is stable or use raw query if needed

        const results = await this.db.select().from(posts).limit(limit).offset(offset);

        // Enrich with content title for the requested locale
        const enriched = await Promise.all(results.map(async (p) => {
            const [c] = await this.db.select({ title: postContents.title }).from(postContents).where(
                and(eq(postContents.postId, p.id), eq(postContents.locale, locale))
            );
            return { ...p, title: c?.title || '(No Title for Locale)' };
        }));

        return { data: enriched, page, limit };
    }

    async deletePost(id: string) {
        const [post] = await this.db.select().from(posts).where(eq(posts.id, id));
        if (!post) {
            throw new NotFoundException('Post not found');
        }

        await this.db.delete(postContents).where(eq(postContents.postId, id));
        await this.db.delete(posts).where(eq(posts.id, id));

        return { id, deleted: true };
    }
}
