import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const mailLogs = pgTable('mail_logs', {
	id: serial('id').primaryKey(),
	mailFrom: text('mail_from').notNull(),
	mailTo: text('mail_to').notNull(),
	cc: text('cc'),
	subject: text('subject').notNull(),
	content: text('content').notNull(),
	status: text('status').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow()
});
