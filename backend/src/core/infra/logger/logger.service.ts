// import { Injectable } from '@nestjs/common';
import { ConsoleLogger, Injectable, Scope, Inject, type LogLevel } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import appConfig from '../config/app.config.js';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
    constructor(
        @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
        context?: string,
    ) {
        super(context);
    }

    protected override formatMessage(
        logLevel: LogLevel,
        message: unknown,
        pidMesssage: string,
        formattedMessage: string,
        contextMessage: string,
        nextContextMessage: string,
    ): string {
        
        if (this.config.env === 'dev'){
            return super.formatMessage(
                logLevel, 
                message, 
                pidMesssage, 
                formattedMessage, 
                contextMessage, 
                nextContextMessage);
        }


        return JSON.stringify({
            logLevel,
            message,
            pidMesssage,
            formattedMessage,
            contextMessage,
            nextContextMessage,
        });
    }
}
