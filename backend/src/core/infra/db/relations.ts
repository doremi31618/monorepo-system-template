import { relations } from 'drizzle-orm';
import { users } from '../../domain/user/user.schema.js';
import { posts, postContents, cmsTags, postTags, postDailyViews } from '../../domain/cms/cms.schema.js';
import { assets } from '../../domain/assets/assets.schema.js';
import { userRoles } from '../../domain/access-control/access-control.schema.js';

export const usersRelations = relations(users, ({ many }) => ({
    posts: many(posts),
    assets: many(assets),
    userRoles: many(userRoles),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
    author: one(users, {
        fields: [posts.authorId],
        references: [users.id],
    }),
    contents: many(postContents),
    postTags: many(postTags),
    dailyViews: many(postDailyViews),
}));

export const postContentsRelations = relations(postContents, ({ one }) => ({
    post: one(posts, {
        fields: [postContents.postId],
        references: [posts.id],
    }),
}));

export const assetsRelations = relations(assets, ({ one }) => ({
    owner: one(users, {
        fields: [assets.ownerId],
        references: [users.id],
    }),
}));

export const cmsTagsRelations = relations(cmsTags, ({ many }) => ({
    postTags: many(postTags),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
    post: one(posts, {
        fields: [postTags.postId],
        references: [posts.id],
    }),
    tag: one(cmsTags, {
        fields: [postTags.tagId],
        references: [cmsTags.id],
    }),
}));

export const postDailyViewsRelations = relations(postDailyViews, ({ one }) => ({
    post: one(posts, {
        fields: [postDailyViews.postId],
        references: [posts.id],
    }),
}));
