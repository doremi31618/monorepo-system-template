#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { createDatabase, createPool } from '@platform/database';
import { OAuthAdminService } from './oauth-admin.service.js';
import * as schema from './oauth-server.schema.js';

function option(args: string[], name: string, required = true): string {
	const index = args.indexOf(`--${name}`);
	const value = index >= 0 ? args[index + 1] : undefined;
	if (!value && required) throw new TypeError(`Missing --${name}`);
	return value ?? '';
}

function listOption(args: string[], name: string): string[] {
	return option(args, name)
		.split(',')
		.map((value) => value.trim())
		.filter(Boolean);
}

export async function runOAuthAdminCli(
	args: string[],
	databaseUrl = process.env.DATABASE_URL
): Promise<unknown> {
	if (!databaseUrl) throw new TypeError('DATABASE_URL is required');
	const pool = createPool(databaseUrl);
	const service = new OAuthAdminService(
		createDatabase(pool, schema),
		undefined,
		'operator:cli'
	);
	const command = args[0];
	try {
		switch (command) {
			case 'resource:create':
				return await service.createResource({
					uri: option(args, 'uri'),
					name: option(args, 'name'),
					allowedScopes: listOption(args, 'scopes')
				});
			case 'resource:list':
				return await service.listResources();
			case 'resource:disable':
				return { disabled: await service.disableResource(option(args, 'uri')) };
			case 'client:create':
				return await service.createClient({
					id: option(args, 'id'),
					name: option(args, 'name'),
					clientType: option(args, 'type') as 'public' | 'confidential',
					redirectUris: listOption(args, 'redirect-uris'),
					allowedScopes: listOption(args, 'scopes'),
					allowedResources: listOption(args, 'resources')
				});
			case 'client:list':
				return await service.listClients();
			case 'client:disable':
				return { disabled: await service.disableClient(option(args, 'id')) };
			case 'client:rotate-secret':
				return await service.rotateClientSecret(option(args, 'id'));
			default:
				throw new TypeError(
					'Command must be resource:create, resource:list, resource:disable, client:create, client:list, client:disable, or client:rotate-secret'
				);
		}
	} finally {
		await pool.end();
	}
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	runOAuthAdminCli(process.argv.slice(2))
		.then((result) =>
			process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
		)
		.catch((error: Error) => {
			process.stderr.write(`${error.message}\n`);
			process.exitCode = 1;
		});
}
