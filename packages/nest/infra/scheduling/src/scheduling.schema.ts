import { pgTable, uniqueIndex, uuid, text, timestamp } from "drizzle-orm/pg-core";


export const jobs = pgTable('jobs', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    status: text('status').$type<'pending' | 'processing' | 'completed' | 'failed'>().default('pending'),
    runAt: timestamp('run_at').notNull(),
    lockedAt: timestamp('locked_at'),
    lockedByWorkerId: text('locked_by_worker_id'),
    createdAt: timestamp('created_at').defaultNow(),
}, (table)=>{
    return {
        uniqueJob: uniqueIndex('unique_job_idx').on(table.name, table.runAt),
    }
})