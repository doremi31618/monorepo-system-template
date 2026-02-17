import { relations } from 'drizzle-orm';
import { users } from '../../domain/user/user.schema.js';
import { posts, postContents } from '../../domain/cms/cms.schema.js';
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
