import { registerAs } from '@nestjs/config';

export type AppConfig = {
	port: number;
	host: string;
	protocol: string;
	baseUrl: string;
};

export default registerAs('app', (): AppConfig => {
	const port = process.env.PORT ? Number(process.env.PORT) : 3333;
	const protocol = process.env.API_PROTOCOL ?? 'http';
	const host = process.env.API_HOST ?? 'localhost';
	const baseUrl = process.env.API_BASE_URL ?? `${protocol}://${host}:${port}`;

	return {
		port,
		host,
		protocol,
		baseUrl
	};
});
