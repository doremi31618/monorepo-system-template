import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, } from "@nestjs/common";
import { Response, Request } from "express";
import type { ApiErrorResponse } from '@platform/types-shared';
// import { LoggerService } from "../logger/logger.service.js";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    //unit exception message to avoid sensitive information disclosure
    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        // const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal Server Error';
        let error = 'Internal Server Error';


        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse()
            if (typeof res === 'object' && res !== null) {
                message = (res as any).message;
                error = (res as any).error;
            } else {
                message = exception.message;
            }
        } else if (exception instanceof Error) {
            message = exception.message;
            error = exception.name;
        }

        const apiResponse: ApiErrorResponse = {
            statusCode: status,
            message: message,
            error: error,
            data: null,
            timestamp: new Date().toISOString(),
            path: request.url,
        }

        response.status(status).json(apiResponse);
    }
}
