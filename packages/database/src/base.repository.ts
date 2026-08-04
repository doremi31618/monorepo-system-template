import { Inject } from "@nestjs/common";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";

export type DrizzleDB<TSchema extends Record<string, unknown> = Record<string, never>> =
    NodePgDatabase<TSchema>;

export abstract class BaseRepository<TSchema extends Record<string, unknown> = Record<string, never>> {
    constructor(
		@Inject('DB') protected readonly db: DrizzleDB<TSchema>,
    ) {}
}
