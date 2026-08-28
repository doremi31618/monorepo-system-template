# R1 - Logger & Error Handling Implementation Guide

> **Related Task**: [R1-core-project-task](../../../project-tasks/R1-core-project-task.md) | **Roadmap**: [R1-core](../../../Roadmap/R1-core.md)

This guide outlines the steps to implement a JSON Logger, Global Exception Filter, and Logging Interceptor in the backend.

## 1. JSON Logger

The goal is to have logs in JSON format for better structured logging (useful for CloudWatch, Datadog, ELK).

**Action 1**: Update `src/core/infra/config/app.config.ts` to include `nodeEnv`.

```typescript
export type AppConfig = {
    // ... other fields
    nodeEnv: string;
};

export default registerAs('app', (): AppConfig => {
    // ... other fields
    const nodeEnv = process.env.NODE_ENV ?? 'dev';

    return {
        // ...
        nodeEnv
    };
});
```

**Action 2**: Create `src/core/infra/logger/logger.service.ts` and inject `appConfig`.

```typescript
import { ConsoleLogger, Injectable, Scope, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import appConfig from '../config/app.config';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  constructor(
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
    // Optional: Pass context if needed, but ConsoleLogger handles it via super() or setContext
    context?: string,
  ) {
      super(context);
  }

  protected formatMessage(
    logLevel: string,
    message: unknown,
    pidMessage: string,
    formattedTimestamp: string,
    contextMessage: string,
    nextContextMessage: string,
  ): string {
    // 1. Development Mode: Use standard colored output (Pretty Print)
    if (this.config.nodeEnv === 'dev') {
        return super.formatMessage(
            logLevel,
            message,
            pidMessage,
            formattedTimestamp,
            contextMessage,
            nextContextMessage,
        );
    }

    // 2. Production Mode: Use JSON format
    const output = {
      timestamp: new Date().toISOString(),
      level: logLevel,
      context: this.context || contextMessage,
      message: message,
      pid: process.pid,
    };
    return JSON.stringify(output);
  }
}
```

*Key Logic: It uses the injected `appConfig.nodeEnv` to determine the environment.*

*Note: You can later replace this with `winston` or `pino` if more advanced features (file transport, rotation) are needed.*

## 2. Global Exception Filter

This filter will catch all application exceptions (both `HttpException` and unknown `Error`) and format the response using the standard `ApiResponse` envelope.

**Action**: Create `src/core/infra/exception/global-exception.filter.ts`.

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiResponse } from '@packages/contracts'; // Ensure strict alignment with shared contract

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        message = (res as any).message || exception.message;
        error = (res as any).error || exception.name;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
       message = exception.message;
       error = exception.name;
       // Log unknown errors for debugging
       this.logger.error(`Unknown Error: ${message}`, exception.stack);
    }

    const apiResponse: ApiResponse<null> = {
      // success: false, // Check if ApiResponse has 'success' field 
      statusCode: status,
      message: message,
      error: error,
      data: null,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(apiResponse);
  }
}
```

## 3. Logging Interceptor

Intercepts every request to log the method, path, execution time, and status code.

**Action**: Create `src/core/infra/interceptor/logging.interceptor.ts`.

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const delay = Date.now() - now;
          this.logger.log(`${method} ${url} ${response.statusCode} - ${delay}ms`);
        },
        error: (error) => {
          const delay = Date.now() - now;
          this.logger.error(`${method} ${url} - Failed after ${delay}ms`, error.stack);
        }
      }),
    );
  }
}
```

## 4. Integration (Updates to `main.ts`)

Update `src/main.ts` to apply these globally.

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from './core/infra/logger/logger.service';
import { GlobalExceptionFilter } from './core/infra/exception/global-exception.filter';
import { LoggingInterceptor } from './core/infra/interceptor/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // 1. Use Smart Logger (auto-switches based on env)
    // bufferLogs: true helps capture logs during startup before the custom logger is fully bound
    bufferLogs: true, 
  });
  app.useLogger(app.get(LoggerService));

  // 2. Register Global Filter
  app.useGlobalFilters(new GlobalExceptionFilter());
  
  // 3. Register Global Interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());
  
  // ... rest of config
}
bootstrap();
```
