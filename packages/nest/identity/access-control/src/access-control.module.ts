import {
  DynamicModule,
  Module,
  type FactoryProvider,
  type ModuleMetadata,
} from '@nestjs/common';
import { AccessControlController } from './access-control.controller.js';
import { AccessControlService } from './access-control.service.js';
import { AccessControlRepository } from './access-control.repository.js';
import { LoggerModule } from '@platform/nest-infra-logger';
import { AuthModule } from '@platform/nest-identity-auth';
import { UserService, UserModule } from '@platform/nest-identity-users';
import {
  ACCESS_CONTROL_BOOTSTRAP_CONFIG,
  type AccessControlBootstrapConfig,
} from './access-control.config.js';

export type AccessControlModuleAsyncOptions = Pick<ModuleMetadata, 'imports'> &
  Pick<FactoryProvider<AccessControlBootstrapConfig>, 'inject' | 'useFactory'>;

@Module({
  imports: [LoggerModule, AuthModule, UserModule],
  controllers: [AccessControlController],
  providers: [
    AccessControlService,
    {
      provide: 'IAccessControlRepository',
      useClass: AccessControlRepository,
    },
    {
      provide: 'IUserService',
      useClass: UserService,
    },
    AccessControlRepository,
  ],
  exports: [AccessControlService],
})
export class AccessControlModule {
  static registerAsync(
    options: AccessControlModuleAsyncOptions,
  ): DynamicModule {
    return {
      module: AccessControlModule,
      imports: options.imports,
      providers: [
        {
          provide: ACCESS_CONTROL_BOOTSTRAP_CONFIG,
          inject: options.inject,
          useFactory: options.useFactory,
        },
      ],
    };
  }
}
