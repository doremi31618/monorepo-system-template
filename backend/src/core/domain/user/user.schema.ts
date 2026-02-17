import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
// import { relations } from 'drizzle-orm';
// import { userRoles } from '../access-control/access-control.schema.js';

export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	password: text('password').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});



