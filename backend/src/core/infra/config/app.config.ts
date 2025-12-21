import { registerAs } from '@nestjs/config';

export type AppConfig = {
	env: string;
	port: number;
	host: string;
	protocol: string;
	baseUrl: string;
};
export default registerAs('app', (): AppConfig => {
	const env = process.env.NODE_ENV ?? 'dev';
	const port = process.env.PORT ? Number(process.env.PORT) : 3333;
	const protocol = process.env.API_PROTOCOL ?? 'http';
	const host = process.env.API_HOST ?? 'localhost';
	const baseUrl = process.env.API_BASE_URL ?? `${protocol}://${host}:${port}`;

	return {
		env,
		port,
		host,
		protocol,
		baseUrl
	};
});
