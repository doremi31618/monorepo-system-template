import { Module } from '@nestjs/common';
import { UserModule } from '@platform/nest-identity-users';
import { AuthModule } from '@platform/nest-identity-auth';
import { AccessControlModule } from '@platform/nest-identity-access-control';
import { AssetsModule } from '@platform/nest-content-assets';
import { CmsModule } from '@platform/nest-content-cms';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createAccessControlBootstrapConfig } from '../../config/access-control.config.js';

const accessControlModule = AccessControlModule.registerAsync({
	imports: [ConfigModule],
	inject: [ConfigService],
	useFactory: (config: ConfigService) =>
		createAccessControlBootstrapConfig({
			ROOT_ADMIN_EMAIL: config.getOrThrow<string>('ROOT_ADMIN_EMAIL'),
			ROOT_ADMIN_NAME: config.getOrThrow<string>('ROOT_ADMIN_NAME'),
			ROOT_ADMIN_PASSWORD: config.getOrThrow<string>('ROOT_ADMIN_PASSWORD')
		})
});

@Module({
	imports: [
		UserModule,
		AuthModule,
		accessControlModule,
		AssetsModule,
		CmsModule
	],
	exports: [
		UserModule,
		AuthModule,
		AccessControlModule,
		AssetsModule,
		CmsModule
	]
})
export class DomainModule {}
