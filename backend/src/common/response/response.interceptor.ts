import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const ctx = context.switchToHttp();
		const response = ctx.getResponse();

		return next.handle().pipe(
			map((data) => {
				const statusCode = response.statusCode;

				return {
					statusCode, // ✅ HTTP 狀態碼
					message: data?.message || 'Request successful',
					data: data?.data ?? data,
					timestamp: new Date().toISOString(),
					path: ctx.getRequest().url
				};
			})
		);
	}
}
