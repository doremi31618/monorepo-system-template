import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { LoggerService } from '@platform/nest-infra-logger';
import { tap } from "rxjs/operators";
import { Observable } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    constructor(private readonly logger: LoggerService) {
        this.logger.setContext(LoggingInterceptor.name);
    }
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url } = request;
        const now = Date.now();

        return next.handle().pipe(
            tap({
                next: (data) => {
                    const response = context.switchToHttp().getResponse();
                    const delay = Date.now() - now;
                    this.logger.log(`${method} ${url} - ${response.statusCode} - ${delay} ms`, data)
                },
                error: (error) => {
                    // const response = context.switchToHttp().getResponse();
                    const delay = Date.now() - now;
                    this.logger.error(`${method} ${url} - ${delay} ms`, error)
                }
            })
        )

    }


}
