import { z } from 'zod';

export const apiEnvSchema = z.object({
	PORT: z.coerce.number().int().positive().default(3333),
	NODE_ENV: z.enum(['dev', 'test', 'prd']).optional().default('dev'),
	API_BASE_URL: z.url().default('http://localhost:3333'),
	HOST_URL: z.url().default('http://localhost:3333/v1'),
	FRONTEND_URL: z.url().optional().default('http://localhost:5173'),
	WORKER_ID: z.string().min(1).optional(),
	DATABASE_URL: z
		.string()
		.optional()
		.default('postgres://postgres:postgres@localhost:5432/postgres'),

	SMTP_HOST: z.string().nonempty(),
	SMTP_PORT: z.coerce.number().default(465),
	SMTP_USER: z.string().nonempty(),
	SMTP_PASS: z.string().nonempty(),
	SMTP_FROM: z.string().nonempty(),

	GOOGLE_SSO_CLIENT_ID: z.string().optional(),
	GOOGLE_SSO_CLIENT_SECRET: z.string().optional(),
	GOOGLE_CALLBACK_URL: z.string().optional(),

	OAUTH_ISSUER: z.url().optional().default('http://localhost:3333'),
	OAUTH_PRIVATE_JWKS: z.string().optional(),
	OAUTH_DCR_ENABLED: z.enum(['true', 'false']).optional().default('true'),
	OAUTH_DCR_RESOURCES: z
		.string()
		.optional()
		.default('http://localhost:3333/mcp/private'),
	MCP_PRIVATE_RESOURCE_URI: z
		.url()
		.optional()
		.default('http://localhost:3333/mcp/private'),
	OAUTH_DCR_SCOPES: z
		.string()
		.optional()
		.default('openid,email,profile,offline_access,mcp:tools'),
	OAUTH_DCR_RATE_LIMIT: z.coerce.number().int().positive().optional().default(10),
	OAUTH_DCR_RATE_WINDOW_SECONDS: z.coerce
		.number()
		.int()
		.positive()
		.optional()
		.default(3600),
	OAUTH_TOKEN_RATE_LIMIT: z.coerce
		.number()
		.int()
		.positive()
		.optional()
		.default(120),
	AUTH_LOGIN_RATE_LIMIT: z.coerce
		.number()
		.int()
		.positive()
		.optional()
		.default(10),

	STORAGE_PROVIDER: z.string().default('s3'),
	STORAGE_REGION: z.string().default('us-east-1'),
	STORAGE_ENDPOINT: z.string().default('http://localhost:9000'),
	STORAGE_ACCESS_KEY: z.string().default('minioadmin'),
	STORAGE_SECRET_KEY: z.string().default('minioadmin'),
	STORAGE_BUCKET: z.string().default('r3-assets'),
	STORAGE_FORCE_PATH_STYLE: z.string().default('true'),

	ROOT_ADMIN_EMAIL: z.email(),
	ROOT_ADMIN_NAME: z.string().nonempty(),
	ROOT_ADMIN_PASSWORD: z.string().min(12)
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function validateApiEnv(config: Record<string, unknown>): ApiEnv {
	const result = apiEnvSchema.safeParse(config);
	if (!result.success) {
		throw new Error(`Invalid environment variables: ${result.error.message}`);
	}
	return result.data;
}
