import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler
} from '@nestjs/common';
import { LoggerService } from '@platform/logger';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

const SENSITIVE_LOG_KEYS = new Set([
	'token',
	'sessiontoken',
	'accesstoken',
	'refreshtoken',
	'idtoken',
	'clientsecret',
	'password',
	'authorization',
	'code',
	'codeverifier',
	'assertion',
	'cookie',
	'uid',
	'redirectto'
]);

export function redactUrlForLogging(url: string): string {
	return url.replace(
		/(\/oauth\/(?:interaction|authorize)\/)[^/?]+/g,
		'$1[REDACTED]'
	);
}

export function redactForLogging(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(redactForLogging);
	}
	if (!value || typeof value !== 'object') {
		return value;
	}
	return Object.fromEntries(
		Object.entries(value as Record<string, unknown>).map(([key, item]) => {
			const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
			return [
				key,
				SENSITIVE_LOG_KEYS.has(normalizedKey)
					? '[REDACTED]'
					: redactForLogging(item)
			];
		})
	);
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	constructor(private readonly logger: LoggerService) {
		this.logger.setContext(LoggingInterceptor.name);
	}
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest();
		const { method, url } = request;
		const safeUrl = redactUrlForLogging(url);
		const now = Date.now();

		return next.handle().pipe(
			tap({
				next: (data) => {
					const response = context.switchToHttp().getResponse();
					const delay = Date.now() - now;
					this.logger.log(
						`${method} ${safeUrl} - ${response.statusCode} - ${delay} ms`,
						redactForLogging(data)
					);
				},
				error: (error) => {
					// const response = context.switchToHttp().getResponse();
					const delay = Date.now() - now;
					this.logger.error(
						`${method} ${safeUrl} - ${delay} ms`,
						redactForLogging(error)
					);
				}
			})
		);
	}
}
