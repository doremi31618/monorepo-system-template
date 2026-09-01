import { Module } from '@nestjs/common';
import { UserModule } from '@platform/users';
import { AuthModule } from '@platform/auth';
import { AccessControlModule } from '@platform/access-control';
import { AssetsModule } from '@platform/assets';
import { CmsModule } from '@platform/nest-cms';

@Module({
    imports: [UserModule, AuthModule, AccessControlModule, AssetsModule, CmsModule],
    exports: [UserModule, AuthModule, AccessControlModule, AssetsModule, CmsModule]
})
export class DomainModule { }
