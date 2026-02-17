import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AccessControlModule } from './access-control/access-control.module.js';
import { AssetsModule } from './assets/assets.module.js';
import { CmsModule } from './cms/cms.module.js';

@Module({
    imports: [UserModule, AuthModule, AccessControlModule, AssetsModule, CmsModule],
    exports: [UserModule, AuthModule, AccessControlModule, AssetsModule, CmsModule]
})
export class DomainModule { }
