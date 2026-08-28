import { z } from 'zod';

//system env configuration schema
export const envSchema = z.object({
	//App 
	PORT: z.string().optional().default('3333'),
	NODE_ENV: z.enum(['dev', 'prd']).optional().default('dev'),
	API_PROTOCOL: z.string().optional().default('http'),
	API_HOST: z.string().optional().default('localhost'),

	//Connecting Info
	HOST_URL: z.url().optional().default('http://localhost:3333'),//compute if missing
	FRONTEND_URL: z.url().optional().default('http://localhost:5173'),//compute if missing
	DATABASE_URL: z.string().optional().default('postgres://postgres:postgres@localhost:5432/postgres'),

	//Mail
	SMTP_HOST: z.string().nonempty(),
	SMTP_PORT: z.coerce.number().default(465),
	SMTP_USER: z.string().nonempty(),
	SMTP_PASS: z.string().nonempty(),
	SMTP_FROM: z.string().nonempty(),

	//Google sso
	GOOGLE_SSO_CLIENT_ID: z.string().optional(),
	GOOGLE_SSO_CLIENT_SECRET: z.string().optional(),
	GOOGLE_CALLBACK_URL: z.string().optional(),

	// OAuth 2.1 / OpenID Connect authorization server
	OAUTH_ISSUER: z.url().optional().default('http://localhost:3333'),
	OAUTH_PRIVATE_JWKS: z.string().optional(),
	OAUTH_DCR_ENABLED: z.enum(['true', 'false']).optional().default('true'),
	OAUTH_DCR_RESOURCES: z
		.string()
		.optional()
		.default('http://localhost:3333/mcp'),
	OAUTH_DCR_SCOPES: z
		.string()
		.optional()
		.default('openid,email,profile,offline_access,mcp:tools'),
	OAUTH_DCR_RATE_LIMIT: z.coerce
		.number()
		.int()
		.positive()
		.optional()
		.default(10),
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

	// Storage
	STORAGE_PROVIDER: z.string().default('s3'),
	STORAGE_REGION: z.string().default('us-east-1'),
	STORAGE_ENDPOINT: z.string().default('http://localhost:9000'),
	STORAGE_ACCESS_KEY: z.string().default('minioadmin'),
	STORAGE_SECRET_KEY: z.string().default('minioadmin'),
	STORAGE_BUCKET: z.string().default('r3-assets'),
	STORAGE_FORCE_PATH_STYLE: z.string().default('true'),
});

export type Env = z.infer<typeof envSchema>;

//safe parase system env configuration
export function validate(config: Record<string, unknown>) {

	const result = envSchema.safeParse(config);
	if (!result.success) {
		throw new Error(`Invalid environment variables: ${result.error.message}`);
	}
	return result.data;
}
