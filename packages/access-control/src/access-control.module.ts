
import { Module } from '@nestjs/common';
import { AccessControlController } from './access-control.controller.js';
import { AccessControlService } from './access-control.service.js';
import { AccessControlRepository } from './access-control.repository.js';
import { LoggerModule } from '@platform/logger';
import { AuthModule } from '@platform/auth';
import { UserService, UserModule } from '@platform/users';
// impoer {UserModule}

@Module({
    imports: [LoggerModule, AuthModule, UserModule],
    controllers: [AccessControlController],
    providers: [AccessControlService,
        {
            provide: 'IAccessControlRepository',
            useClass: AccessControlRepository
        },
        {
            provide: 'IUserService',
            useClass: UserService
        }
        , AccessControlRepository],
    exports: [AccessControlService]
})
export class AccessControlModule { }
