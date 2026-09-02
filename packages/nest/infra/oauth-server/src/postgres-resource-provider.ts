import { and, eq, isNull } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { OAuthResourceProvider } from './oauth-provider.js';
import { oauthResources } from './oauth-server.schema.js';
import type * as schema from './oauth-server.schema.js';

export class PostgresOAuthResourceProvider implements OAuthResourceProvider {
	constructor(private readonly db: NodePgDatabase<typeof schema>) {}

	async findResource(uri: string) {
		const rows = await this.db
			.select({
				uri: oauthResources.uri,
				allowedScopes: oauthResources.allowedScopes
			})
			.from(oauthResources)
			.where(
				and(eq(oauthResources.uri, uri), isNull(oauthResources.disabledAt))
			)
			.limit(1);
		return rows[0];
	}
}
