import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  ne,
  or,
  sql,
} from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import {
  cmsTags,
  postContents,
  postDailyViews,
  postTags,
  posts,
} from './cms.schema.js';
import { assets } from '@platform/assets';
import {
  renderBlocksToHtml,
  type Block,
  type CmsPostSummary,
  type CmsPostStatus,
  type CmsPrivateSearchQuery,
  type CmsPublicPostSummary,
  type CmsPublicSearchQuery,
  type CmsSearchCapability,
  type CmsSearchPage,
} from '@platform/cms';
// import { users } from '../user/user.schema.js';

type TagSummary = {
  id: string;
  name: string;
  slug: string;
};

type ListPostsOptions = {
  query?: string;
  status?: string;
  tagId?: string;
  updatedFrom?: string;
  updatedTo?: string;
};

type ListPublicPostsOptions = Omit<
  CmsPublicSearchQuery,
  'page' | 'limit' | 'locale'
>;

@Injectable()
export class CmsService implements CmsSearchCapability {
  constructor(
    @Inject('DB') private db: NodePgDatabase<any>,
    private configService: ConfigService,
  ) {}

  private normalizeTagName(name: string) {
    return name.trim().replace(/\s+/g, ' ');
  }

  private buildTagSlug(name: string) {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return slug || 'tag';
  }

  private normalizePostSlug(slug: string) {
    const normalized = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!normalized) {
      throw new BadRequestException('Slug is required');
    }

    return normalized;
  }

  private parseFilterDate(dateInput: string, mode: 'from' | 'to') {
    const raw = dateInput.trim();
    if (!raw) return null;

    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Invalid date filter: ${dateInput}`);
    }

    if (isDateOnly) {
      if (mode === 'from') {
        parsed.setHours(0, 0, 0, 0);
      } else {
        parsed.setHours(23, 59, 59, 999);
      }
    }

    return parsed;
  }

  private getApiBaseUrl() {
    const appBaseUrl =
      this.configService.get<string>('app.baseUrl') ||
      this.configService.get<string>('HOST_URL') ||
      'http://localhost:3333';
    return appBaseUrl.replace(/\/$/, '');
  }

  private buildAssetPublicUrl(assetId: string) {
    return `${this.getApiBaseUrl()}/v1/cms/assets/${assetId}/public`;
  }

  private parseAssetIdFromCmsAssetPath(input: string) {
    const matched = input.match(
      /\/cms\/assets\/([0-9a-fA-F-]{36})\/(?:public|url)(?:[/?#]|$)/,
    );
    return matched?.[1] || null;
  }

  private extractStorageKeyFromStorageUrl(input: string) {
    let parsed: URL;
    try {
      parsed = new URL(input);
    } catch {
      return null;
    }

    const storageEndpoint = this.configService.get<string>('STORAGE_ENDPOINT');
    if (!storageEndpoint) {
      return null;
    }

    let endpoint: URL;
    try {
      endpoint = new URL(storageEndpoint);
    } catch {
      return null;
    }

    if (parsed.host !== endpoint.host) {
      return null;
    }

    const bucket = this.configService.get<string>('STORAGE_BUCKET');
    const pathname = decodeURIComponent(parsed.pathname || '');
    if (!pathname) return null;

    if (bucket && pathname.startsWith(`/${bucket}/`)) {
      return pathname.slice(bucket.length + 2);
    }

    if (bucket && parsed.hostname.startsWith(`${bucket}.`)) {
      return pathname.replace(/^\//, '');
    }

    return null;
  }

  private async resolveAssetProxyUrl(
    input: string | null | undefined,
    cache = new Map<string, string | null>(),
  ): Promise<string | null | undefined> {
    if (input === undefined) return undefined;
    if (input === null) return null;

    const normalized = input.trim();
    if (!normalized) return null;

    if (cache.has(normalized)) {
      return cache.get(normalized) ?? null;
    }

    const assetIdFromPath = this.parseAssetIdFromCmsAssetPath(normalized);
    if (assetIdFromPath) {
      const directUrl = this.buildAssetPublicUrl(assetIdFromPath);
      cache.set(normalized, directUrl);
      return directUrl;
    }

    const storageKey = this.extractStorageKeyFromStorageUrl(normalized);
    if (!storageKey) {
      cache.set(normalized, normalized);
      return normalized;
    }

    const [asset] = await this.db
      .select({ id: assets.id })
      .from(assets)
      .where(
        and(eq(assets.storageKey, storageKey), ne(assets.status, 'deleted')),
      )
      .limit(1);

    if (!asset) {
      cache.set(normalized, normalized);
      return normalized;
    }

    const proxyUrl = this.buildAssetPublicUrl(asset.id);
    cache.set(normalized, proxyUrl);
    return proxyUrl;
  }

  private async normalizeBodyAssetUrls(
    node: unknown,
    cache: Map<string, string | null>,
  ): Promise<unknown> {
    if (Array.isArray(node)) {
      return Promise.all(
        node.map((item) => this.normalizeBodyAssetUrls(item, cache)),
      );
    }

    if (!node || typeof node !== 'object') {
      return node;
    }

    const current = node as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    const nodeType = typeof current.type === 'string' ? current.type : '';

    for (const [key, value] of Object.entries(current)) {
      if (key === 'attrs' && value && typeof value === 'object') {
        const attrs = { ...(value as Record<string, unknown>) };

        if (nodeType === 'image' && typeof attrs.src === 'string') {
          attrs.src =
            (await this.resolveAssetProxyUrl(attrs.src, cache)) ?? attrs.src;
        }

        if (nodeType === 'linkPreview' && typeof attrs.image === 'string') {
          attrs.image =
            (await this.resolveAssetProxyUrl(attrs.image, cache)) ??
            attrs.image;
        }

        next[key] = attrs;
        continue;
      }

      if (key === 'content') {
        next[key] = await this.normalizeBodyAssetUrls(value, cache);
        continue;
      }

      if (value && typeof value === 'object') {
        next[key] = await this.normalizeBodyAssetUrls(value, cache);
        continue;
      }

      next[key] = value;
    }

    return next;
  }

  private async normalizePostContentAssetUrls(
    content: typeof postContents.$inferSelect | null | undefined,
  ) {
    if (!content) return content || null;

    const cache = new Map<string, string | null>();
    const [coverImage, linkPreviewImage, body] = await Promise.all([
      this.resolveAssetProxyUrl(content.coverImage, cache),
      this.resolveAssetProxyUrl(content.linkPreviewImage, cache),
      this.normalizeBodyAssetUrls(content.body, cache),
    ]);

    return {
      ...content,
      coverImage: coverImage ?? null,
      linkPreviewImage: linkPreviewImage ?? null,
      body,
    };
  }

  private async ensureUniqueTagSlug(baseSlug: string, excludeTagId?: string) {
    let candidate = baseSlug;
    let sequence = 2;

    while (true) {
      const slugCondition = eq(cmsTags.slug, candidate);
      const whereClause = excludeTagId
        ? and(slugCondition, ne(cmsTags.id, excludeTagId))
        : slugCondition;

      const [existing] = await this.db
        .select({ id: cmsTags.id })
        .from(cmsTags)
        .where(whereClause)
        .limit(1);

      if (!existing) {
        return candidate;
      }

      candidate = `${baseSlug}-${sequence}`;
      sequence += 1;
    }
  }

  private normalizeOptionalText(value?: string | null) {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private resolveAgainstBase(value: string | null, baseUrl: URL) {
    if (!value) return null;
    try {
      return new URL(value, baseUrl).toString();
    } catch {
      return value;
    }
  }

  private pickMetaContent(
    html: string,
    key: string,
    keyAttr: 'property' | 'name',
  ) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const firstPattern = new RegExp(
      `<meta[^>]*${keyAttr}=["']${escapedKey}["'][^>]*content=["']([^"']+)["'][^>]*>`,
      'i',
    );
    const secondPattern = new RegExp(
      `<meta[^>]*content=["']([^"']+)["'][^>]*${keyAttr}=["']${escapedKey}["'][^>]*>`,
      'i',
    );

    return (
      html.match(firstPattern)?.[1]?.trim() ||
      html.match(secondPattern)?.[1]?.trim() ||
      null
    );
  }

  private pickTitle(html: string) {
    const matched = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    return matched?.replace(/\s+/g, ' ').trim() || null;
  }

  private isRestrictedPreviewHost(hostname: string) {
    const normalized = hostname.toLowerCase();
    if (normalized === 'localhost' || normalized === '0.0.0.0') return true;
    if (normalized.startsWith('127.')) return true;
    if (normalized.startsWith('10.')) return true;
    if (normalized.startsWith('192.168.')) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) return true;
    if (
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd')
    )
      return true;
    if (normalized.startsWith('fe80:')) return true;
    return false;
  }

  private async getTagsByPostIds(postIds: string[]) {
    const tagMap: Record<string, TagSummary[]> = {};

    if (postIds.length === 0) {
      return tagMap;
    }

    const rows = await this.db
      .select({
        postId: postTags.postId,
        tagId: cmsTags.id,
        tagName: cmsTags.name,
        tagSlug: cmsTags.slug,
      })
      .from(postTags)
      .innerJoin(cmsTags, eq(postTags.tagId, cmsTags.id))
      .where(inArray(postTags.postId, postIds))
      .orderBy(asc(cmsTags.name));

    for (const row of rows) {
      if (!tagMap[row.postId]) {
        tagMap[row.postId] = [];
      }

      tagMap[row.postId].push({
        id: row.tagId,
        name: row.tagName,
        slug: row.tagSlug,
      });
    }

    return tagMap;
  }

  private extractTextFromTiptapNode(node: unknown): string[] {
    if (!node || typeof node !== 'object') return [];

    const currentNode = node as { text?: unknown; content?: unknown };
    const chunks: string[] = [];

    if (typeof currentNode.text === 'string' && currentNode.text.trim()) {
      chunks.push(currentNode.text.trim());
    }

    if (Array.isArray(currentNode.content)) {
      for (const child of currentNode.content) {
        chunks.push(...this.extractTextFromTiptapNode(child));
      }
    }

    return chunks;
  }

  private buildExcerpt(body: unknown, fallbackTitle = 'Untitled') {
    const text = this.extractTextFromTiptapNode(body)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) return fallbackTitle;
    return text.length > 160 ? `${text.slice(0, 157)}...` : text;
  }

  async createPost(userId: number, title: string, locale = 'en') {
    // 1. Create Post
    const [newPost] = await this.db
      .insert(posts)
      .values({
        slug: uuidv4(), // Temporary slug, user should update
        status: 'draft',
        authorId: userId,
      })
      .returning();

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

    const [content] = await this.db
      .select()
      .from(postContents)
      .where(and(eq(postContents.postId, id), eq(postContents.locale, locale)));
    const normalizedContent = await this.normalizePostContentAssetUrls(content);

    const tagsByPostId = await this.getTagsByPostIds([id]);

    return {
      ...post,
      content: normalizedContent || null,
      tags: tagsByPostId[id] || [],
    };
  }

  async updatePostContent(
    id: string,
    locale: string,
    data: {
      title?: string;
      body?: any;
      coverImage?: string | null;
      seoTitle?: string | null;
      seoDesc?: string | null;
      linkPreviewUrl?: string | null;
      linkPreviewTitle?: string | null;
      linkPreviewDescription?: string | null;
      linkPreviewImage?: string | null;
    },
  ) {
    let htmlContent = undefined;
    // Check if body is a block array and generate HTML
    if (data.body && Array.isArray(data.body)) {
      try {
        htmlContent = renderBlocksToHtml(data.body as Block[]);
      } catch {
        // Ignore if not block array
      }
    }

    const assetUrlCache = new Map<string, string | null>();
    const normalizedBody =
      data.body === undefined
        ? undefined
        : await this.normalizeBodyAssetUrls(data.body, assetUrlCache);
    const normalizedCoverImage = await this.resolveAssetProxyUrl(
      this.normalizeOptionalText(data.coverImage),
      assetUrlCache,
    );
    const normalizedLinkPreviewImage = await this.resolveAssetProxyUrl(
      this.normalizeOptionalText(data.linkPreviewImage),
      assetUrlCache,
    );

    const normalizedData = {
      ...data,
      body: normalizedBody,
      coverImage: normalizedCoverImage,
      seoTitle: this.normalizeOptionalText(data.seoTitle),
      seoDesc: this.normalizeOptionalText(data.seoDesc),
      linkPreviewUrl: this.normalizeOptionalText(data.linkPreviewUrl),
      linkPreviewTitle: this.normalizeOptionalText(data.linkPreviewTitle),
      linkPreviewDescription: this.normalizeOptionalText(
        data.linkPreviewDescription,
      ),
      linkPreviewImage: normalizedLinkPreviewImage,
    };

    // Upsert logic
    await this.db
      .insert(postContents)
      .values({
        postId: id,
        locale: locale,
        ...normalizedData,
        htmlContent,
      })
      .onConflictDoUpdate({
        target: [postContents.postId, postContents.locale],
        set: {
          ...normalizedData,
          htmlContent: htmlContent !== undefined ? htmlContent : undefined,
          updatedAt: new Date(),
        },
      });

    return this.getPost(id, locale);
  }

  async updatePostStatus(id: string, status: string, slug?: string) {
    if (!['draft', 'published', 'archived'].includes(status)) {
      throw new BadRequestException('Invalid post status');
    }

    const [currentPost] = await this.db
      .select({
        id: posts.id,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    if (!currentPost) {
      throw new NotFoundException('Post not found');
    }

    const payload: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'published' && !currentPost.publishedAt) {
      payload.publishedAt = new Date();
    }

    if (slug !== undefined) {
      const normalizedSlug = this.normalizePostSlug(slug);
      const [duplicated] = await this.db
        .select({ id: posts.id })
        .from(posts)
        .where(and(eq(posts.slug, normalizedSlug), ne(posts.id, id)))
        .limit(1);

      if (duplicated) {
        throw new BadRequestException('Slug already exists');
      }

      payload.slug = normalizedSlug;
    }

    const [updated] = await this.db
      .update(posts)
      .set(payload)
      .where(eq(posts.id, id))
      .returning();

    return updated;
  }

  async listPosts(
    page = 1,
    limit = 10,
    locale = 'en',
    options: ListPostsOptions = {},
  ): Promise<CmsSearchPage<CmsPostSummary>> {
    const offset = (page - 1) * limit;
    const normalizedQuery = options.query?.trim();
    const normalizedStatus = options.status?.trim();
    const normalizedTagId = options.tagId?.trim();
    const normalizedUpdatedFrom = options.updatedFrom?.trim();
    const normalizedUpdatedTo = options.updatedTo?.trim();
    const conditions: any[] = [];

    if (normalizedStatus && normalizedStatus !== 'all') {
      conditions.push(eq(posts.status, normalizedStatus));
    }

    if (normalizedQuery) {
      const keyword = `%${normalizedQuery}%`;
      conditions.push(
        or(ilike(posts.slug, keyword), ilike(postContents.title, keyword)),
      );
    }

    if (normalizedTagId && normalizedTagId !== 'all') {
      const taggedPostIds = this.db
        .select({ postId: postTags.postId })
        .from(postTags)
        .where(eq(postTags.tagId, normalizedTagId));
      conditions.push(inArray(posts.id, taggedPostIds));
    }

    if (normalizedUpdatedFrom) {
      const fromDate = this.parseFilterDate(normalizedUpdatedFrom, 'from');
      if (fromDate) {
        conditions.push(gte(posts.updatedAt, fromDate));
      }
    }

    if (normalizedUpdatedTo) {
      const toDate = this.parseFilterDate(normalizedUpdatedTo, 'to');
      if (toDate) {
        conditions.push(lte(posts.updatedAt, toDate));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const localizedPostContentJoinCondition = and(
      eq(postContents.postId, posts.id),
      eq(postContents.locale, locale),
    );

    const results = await this.db
      .select({
        id: posts.id,
        slug: posts.slug,
        status: posts.status,
        authorId: posts.authorId,
        viewCount: posts.viewCount,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        title: postContents.title,
        body: postContents.body,
      })
      .from(posts)
      .leftJoin(postContents, localizedPostContentJoinCondition)
      .where(whereClause)
      .orderBy(desc(posts.updatedAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await this.db
      .select({ total: sql<number>`count(distinct ${posts.id})::int` })
      .from(posts)
      .leftJoin(postContents, localizedPostContentJoinCondition)
      .where(whereClause);

    const postIds = results.map((post) => post.id);
    const tagsByPostId = await this.getTagsByPostIds(postIds);

    const enriched: CmsPostSummary[] = results.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title || '(No Title for Locale)',
      excerpt: this.buildExcerpt(
        post.body,
        post.title || '(No Title for Locale)',
      ),
      tags: tagsByPostId[post.id] || [],
      status: post.status as CmsPostStatus,
      authorId: post.authorId ?? null,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      publishedAt: post.publishedAt ?? null,
    }));

    return {
      data: enriched,
      page,
      limit,
      total: Number(totalResult?.total ?? 0),
    };
  }

  async listTags(query?: string) {
    const normalizedQuery = query?.trim();
    const whereClause = normalizedQuery
      ? or(
          ilike(cmsTags.name, `%${normalizedQuery}%`),
          ilike(cmsTags.slug, `%${normalizedQuery}%`),
        )
      : undefined;

    const results = await this.db
      .select({
        id: cmsTags.id,
        name: cmsTags.name,
        slug: cmsTags.slug,
        createdAt: cmsTags.createdAt,
        updatedAt: cmsTags.updatedAt,
        postCount: sql<number>`count(distinct ${postTags.postId})::int`,
        totalViews: sql<number>`coalesce(sum(case when ${posts.status} = 'published' then ${posts.viewCount} else 0 end), 0)::int`,
      })
      .from(cmsTags)
      .leftJoin(postTags, eq(postTags.tagId, cmsTags.id))
      .leftJoin(posts, eq(posts.id, postTags.postId))
      .where(whereClause)
      .groupBy(
        cmsTags.id,
        cmsTags.name,
        cmsTags.slug,
        cmsTags.createdAt,
        cmsTags.updatedAt,
      )
      .orderBy(asc(cmsTags.name));

    return {
      data: results,
    };
  }

  async listPublicPosts(
    page = 1,
    limit = 10,
    locale = 'en',
    options: ListPublicPostsOptions = {},
  ): Promise<CmsSearchPage<CmsPublicPostSummary>> {
    const offset = (page - 1) * limit;
    const normalizedQuery = options.query?.trim();
    const normalizedTagSlug = options.tagSlug?.trim();
    const sort = options.sort === 'popular' ? 'popular' : 'latest';
    const conditions: any[] = [eq(posts.status, 'published')];

    if (normalizedQuery) {
      const keyword = `%${normalizedQuery}%`;
      conditions.push(
        or(ilike(postContents.title, keyword), ilike(posts.slug, keyword)),
      );
    }

    if (normalizedTagSlug) {
      const taggedPostIds = this.db
        .select({ postId: postTags.postId })
        .from(postTags)
        .innerJoin(cmsTags, eq(cmsTags.id, postTags.tagId))
        .where(eq(cmsTags.slug, normalizedTagSlug));
      conditions.push(inArray(posts.id, taggedPostIds));
    }

    const localizedJoin = and(
      eq(postContents.postId, posts.id),
      eq(postContents.locale, locale),
    );
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select({
        id: posts.id,
        slug: posts.slug,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        publishedAt: posts.publishedAt,
        viewCount: posts.viewCount,
        title: postContents.title,
        body: postContents.body,
        coverImage: postContents.coverImage,
      })
      .from(posts)
      .innerJoin(postContents, localizedJoin)
      .where(whereClause)
      .orderBy(
        sort === 'popular'
          ? desc(posts.viewCount)
          : desc(sql`coalesce(${posts.publishedAt}, ${posts.updatedAt})`),
      )
      .limit(limit)
      .offset(offset);

    const [totalResult] = await this.db
      .select({ total: sql<number>`count(distinct ${posts.id})::int` })
      .from(posts)
      .innerJoin(postContents, localizedJoin)
      .where(whereClause);

    const postIds = rows.map((post) => post.id);
    const tagsByPostId = await this.getTagsByPostIds(postIds);
    const coverImageCache = new Map<string, string | null>();
    const normalizedRows: CmsPublicPostSummary[] = await Promise.all(
      rows.map(async (post) => ({
        id: post.id,
        slug: post.slug,
        title: post.title || 'Untitled',
        excerpt: this.buildExcerpt(post.body, post.title || 'Untitled'),
        coverImage:
          (await this.resolveAssetProxyUrl(post.coverImage, coverImageCache)) ??
          null,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        publishedAt: post.publishedAt || null,
        tags: tagsByPostId[post.id] || [],
      })),
    );

    return {
      data: normalizedRows,
      page,
      limit,
      total: Number(totalResult?.total ?? 0),
    };
  }

  searchPublished(query: CmsPublicSearchQuery) {
    return this.listPublicPosts(
      query.page ?? 1,
      query.limit ?? 10,
      query.locale ?? 'en',
      {
        query: query.query,
        tagSlug: query.tagSlug,
        sort: query.sort,
      },
    );
  }

  searchWorkspace(query: CmsPrivateSearchQuery) {
    return this.listPosts(
      query.page ?? 1,
      query.limit ?? 10,
      query.locale ?? 'en',
      {
        query: query.query,
        status: query.status,
        tagId: query.tagId,
        updatedFrom: query.updatedFrom,
        updatedTo: query.updatedTo,
      },
    );
  }

  async getPublicPostBySlug(slug: string, locale = 'en') {
    const normalizedSlug = slug?.trim();
    if (!normalizedSlug) {
      throw new BadRequestException('Slug is required');
    }

    const [post] = await this.db
      .select({
        id: posts.id,
        slug: posts.slug,
        status: posts.status,
        authorId: posts.authorId,
        viewCount: posts.viewCount,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(and(eq(posts.slug, normalizedSlug), eq(posts.status, 'published')))
      .limit(1);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    let [content] = await this.db
      .select()
      .from(postContents)
      .where(
        and(eq(postContents.postId, post.id), eq(postContents.locale, locale)),
      )
      .limit(1);
    let resolvedLocale = locale;

    if (!content && locale !== 'en') {
      [content] = await this.db
        .select()
        .from(postContents)
        .where(
          and(eq(postContents.postId, post.id), eq(postContents.locale, 'en')),
        )
        .limit(1);
      resolvedLocale = content ? 'en' : locale;
    }

    if (!content) {
      throw new NotFoundException('Post content not found');
    }

    const tagsByPostId = await this.getTagsByPostIds([post.id]);
    const normalizedContent = await this.normalizePostContentAssetUrls(content);

    return {
      ...post,
      viewCount: post.viewCount ?? 0,
      locale: resolvedLocale,
      content: normalizedContent,
      tags: tagsByPostId[post.id] || [],
    };
  }

  async trackPublicPostView(slug: string) {
    const normalizedSlug = slug?.trim();
    if (!normalizedSlug) {
      throw new BadRequestException('Slug is required');
    }

    const [post] = await this.db
      .select({
        id: posts.id,
        slug: posts.slug,
      })
      .from(posts)
      .where(and(eq(posts.slug, normalizedSlug), eq(posts.status, 'published')))
      .limit(1);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const today = new Date().toISOString().slice(0, 10);
    let updated: { id: string; slug: string; viewCount: number } | undefined;

    await this.db.transaction(async (tx) => {
      const [postUpdate] = await tx
        .update(posts)
        .set({
          viewCount: sql<number>`coalesce(${posts.viewCount}, 0) + 1`,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, post.id))
        .returning({
          id: posts.id,
          slug: posts.slug,
          viewCount: posts.viewCount,
        });

      updated = postUpdate;

      await tx
        .insert(postDailyViews)
        .values({
          postId: post.id,
          viewDate: today,
          viewCount: 1,
        })
        .onConflictDoUpdate({
          target: [postDailyViews.postId, postDailyViews.viewDate],
          set: {
            viewCount: sql<number>`coalesce(${postDailyViews.viewCount}, 0) + 1`,
            updatedAt: new Date(),
          },
        });
    });

    if (!updated) {
      throw new NotFoundException('Post not found');
    }

    return {
      ...updated,
      viewCount: updated.viewCount ?? 0,
    };
  }

  async getPublicHome(
    locale = 'en',
    latestLimit = 6,
    hotTagLimit = 4,
    hotPostPerTag = 3,
  ) {
    const latest = await this.listPublicPosts(1, latestLimit, locale, {
      sort: 'latest',
    });

    const hotTagRows = await this.db
      .select({
        id: cmsTags.id,
        name: cmsTags.name,
        slug: cmsTags.slug,
        totalViews: sql<number>`coalesce(sum(${posts.viewCount}), 0)::int`,
      })
      .from(cmsTags)
      .innerJoin(postTags, eq(postTags.tagId, cmsTags.id))
      .innerJoin(
        posts,
        and(eq(posts.id, postTags.postId), eq(posts.status, 'published')),
      )
      .groupBy(cmsTags.id, cmsTags.name, cmsTags.slug)
      .orderBy(
        desc(sql`coalesce(sum(${posts.viewCount}), 0)`),
        asc(cmsTags.name),
      )
      .limit(hotTagLimit);

    const hotTags = await Promise.all(
      hotTagRows.map(async (tag) => {
        const taggedPosts = await this.listPublicPosts(
          1,
          hotPostPerTag,
          locale,
          {
            tagSlug: tag.slug,
            sort: 'popular',
          },
        );

        return {
          ...tag,
          totalViews: tag.totalViews ?? 0,
          posts: taggedPosts.data,
        };
      }),
    );

    return {
      latestPosts: latest.data,
      hotTags,
    };
  }

  async getDashboardAnalytics(locale = 'en', days = 14, topLimit = 5) {
    const normalizedDays = Number.isFinite(days)
      ? Math.min(Math.max(Math.floor(days), 1), 90)
      : 14;
    const normalizedTopLimit = Number.isFinite(topLimit)
      ? Math.min(Math.max(Math.floor(topLimit), 1), 20)
      : 5;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setUTCDate(today.getUTCDate() - normalizedDays + 1);
    const startDateString = startDate.toISOString().slice(0, 10);

    const dailyRows = await this.db
      .select({
        date: postDailyViews.viewDate,
        views: sql<number>`coalesce(sum(${postDailyViews.viewCount}), 0)::int`,
      })
      .from(postDailyViews)
      .innerJoin(
        posts,
        and(eq(posts.id, postDailyViews.postId), eq(posts.status, 'published')),
      )
      .where(gte(postDailyViews.viewDate, startDateString))
      .groupBy(postDailyViews.viewDate)
      .orderBy(asc(postDailyViews.viewDate));

    const dailyViewMap = new Map(
      dailyRows.map((row) => [row.date, row.views ?? 0]),
    );
    const dailyViews = Array.from({ length: normalizedDays }, (_, index) => {
      const currentDate = new Date(startDate);
      currentDate.setUTCDate(startDate.getUTCDate() + index);
      const dateKey = currentDate.toISOString().slice(0, 10);
      return {
        date: dateKey,
        views: dailyViewMap.get(dateKey) ?? 0,
      };
    });

    const localizedPostContentJoinCondition = and(
      eq(postContents.postId, posts.id),
      eq(postContents.locale, locale),
    );

    const topPosts = await this.db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: postContents.title,
        viewCount: posts.viewCount,
        publishedAt: posts.publishedAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .leftJoin(postContents, localizedPostContentJoinCondition)
      .where(eq(posts.status, 'published'))
      .orderBy(
        desc(posts.viewCount),
        desc(sql`coalesce(${posts.publishedAt}, ${posts.updatedAt})`),
      )
      .limit(normalizedTopLimit);

    const topTags = await this.db
      .select({
        id: cmsTags.id,
        name: cmsTags.name,
        slug: cmsTags.slug,
        totalViews: sql<number>`coalesce(sum(${posts.viewCount}), 0)::int`,
        postCount: sql<number>`count(distinct ${posts.id})::int`,
      })
      .from(cmsTags)
      .innerJoin(postTags, eq(postTags.tagId, cmsTags.id))
      .innerJoin(
        posts,
        and(eq(posts.id, postTags.postId), eq(posts.status, 'published')),
      )
      .groupBy(cmsTags.id, cmsTags.name, cmsTags.slug)
      .orderBy(
        desc(sql`coalesce(sum(${posts.viewCount}), 0)`),
        asc(cmsTags.name),
      )
      .limit(normalizedTopLimit);

    return {
      dailyViews,
      topPosts: topPosts.map((post) => ({
        ...post,
        title: post.title || 'Untitled',
        viewCount: post.viewCount ?? 0,
        publishedAt: post.publishedAt ?? null,
      })),
      topTags: topTags.map((tag) => ({
        ...tag,
        totalViews: tag.totalViews ?? 0,
        postCount: tag.postCount ?? 0,
      })),
    };
  }

  async createTag(name: string) {
    const normalizedName = this.normalizeTagName(name);
    if (!normalizedName) {
      throw new BadRequestException('Tag name is required');
    }

    const [existingByName] = await this.db
      .select()
      .from(cmsTags)
      .where(sql`lower(${cmsTags.name}) = lower(${normalizedName})`)
      .limit(1);

    if (existingByName) {
      return existingByName;
    }

    const baseSlug = this.buildTagSlug(normalizedName);
    const uniqueSlug = await this.ensureUniqueTagSlug(baseSlug);

    const [tag] = await this.db
      .insert(cmsTags)
      .values({
        name: normalizedName,
        slug: uniqueSlug,
      })
      .returning();

    return tag;
  }

  async updateTag(id: string, data: { name?: string }) {
    const [existing] = await this.db
      .select()
      .from(cmsTags)
      .where(eq(cmsTags.id, id))
      .limit(1);
    if (!existing) {
      throw new NotFoundException('Tag not found');
    }

    const nextName = data.name
      ? this.normalizeTagName(data.name)
      : existing.name;
    if (!nextName) {
      throw new BadRequestException('Tag name is required');
    }

    const [duplicatedByName] = await this.db
      .select({ id: cmsTags.id })
      .from(cmsTags)
      .where(
        and(
          sql`lower(${cmsTags.name}) = lower(${nextName})`,
          ne(cmsTags.id, id),
        ),
      )
      .limit(1);

    if (duplicatedByName) {
      throw new BadRequestException('Tag name already exists');
    }

    const baseSlug = this.buildTagSlug(nextName);
    const uniqueSlug = await this.ensureUniqueTagSlug(baseSlug, id);

    const [updated] = await this.db
      .update(cmsTags)
      .set({
        name: nextName,
        slug: uniqueSlug,
        updatedAt: new Date(),
      })
      .where(eq(cmsTags.id, id))
      .returning();

    return updated;
  }

  async deleteTag(id: string) {
    const [existing] = await this.db
      .select({ id: cmsTags.id })
      .from(cmsTags)
      .where(eq(cmsTags.id, id))
      .limit(1);
    if (!existing) {
      throw new NotFoundException('Tag not found');
    }

    await this.db.delete(cmsTags).where(eq(cmsTags.id, id));
    return { id, deleted: true };
  }

  async getLinkPreview(inputUrl: string) {
    if (!inputUrl?.trim()) {
      throw new BadRequestException('URL is required');
    }

    let normalizedUrl: URL;
    try {
      normalizedUrl = new URL(inputUrl.trim());
    } catch {
      throw new BadRequestException('Invalid URL');
    }

    if (!['http:', 'https:'].includes(normalizedUrl.protocol)) {
      throw new BadRequestException('Only HTTP(S) URL is supported');
    }

    if (this.isRestrictedPreviewHost(normalizedUrl.hostname)) {
      throw new BadRequestException('Unsupported host for preview');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(normalizedUrl.toString(), {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (CMS Link Preview Bot)',
        },
      });

      if (!response.ok) {
        throw new BadRequestException(
          `Unable to fetch URL (${response.status})`,
        );
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.toLowerCase().includes('text/html')) {
        throw new BadRequestException('URL is not an HTML page');
      }

      const html = await response.text();

      const title =
        this.pickMetaContent(html, 'og:title', 'property') ||
        this.pickMetaContent(html, 'twitter:title', 'name') ||
        this.pickTitle(html);
      const description =
        this.pickMetaContent(html, 'og:description', 'property') ||
        this.pickMetaContent(html, 'twitter:description', 'name') ||
        this.pickMetaContent(html, 'description', 'name');
      const image =
        this.pickMetaContent(html, 'og:image', 'property') ||
        this.pickMetaContent(html, 'twitter:image', 'name');
      const siteName = this.pickMetaContent(html, 'og:site_name', 'property');
      const canonicalUrl =
        this.pickMetaContent(html, 'og:url', 'property') ||
        normalizedUrl.toString();
      const resolvedImage = this.resolveAgainstBase(image, normalizedUrl);
      const resolvedCanonicalUrl =
        this.resolveAgainstBase(canonicalUrl, normalizedUrl) ||
        normalizedUrl.toString();

      return {
        url: resolvedCanonicalUrl,
        title,
        description,
        image: resolvedImage,
        siteName,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch link preview');
    } finally {
      clearTimeout(timeout);
    }
  }

  async updatePostTags(id: string, tagIds: string[], locale = 'en') {
    const [post] = await this.db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.id, id));
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const uniqueTagIds = Array.from(new Set((tagIds || []).filter(Boolean)));

    if (uniqueTagIds.length > 0) {
      const existingTags = await this.db
        .select({ id: cmsTags.id })
        .from(cmsTags)
        .where(inArray(cmsTags.id, uniqueTagIds));

      if (existingTags.length !== uniqueTagIds.length) {
        throw new BadRequestException('One or more tags are invalid');
      }
    }

    await this.db.transaction(async (tx) => {
      await tx.delete(postTags).where(eq(postTags.postId, id));

      if (uniqueTagIds.length > 0) {
        await tx.insert(postTags).values(
          uniqueTagIds.map((tagId) => ({
            postId: id,
            tagId,
          })),
        );
      }
    });

    return this.getPost(id, locale);
  }

  async deletePost(id: string) {
    const [post] = await this.db.select().from(posts).where(eq(posts.id, id));
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.db.delete(postTags).where(eq(postTags.postId, id));
    await this.db.delete(postContents).where(eq(postContents.postId, id));
    await this.db.delete(posts).where(eq(posts.id, id));

    return { id, deleted: true };
  }
}
