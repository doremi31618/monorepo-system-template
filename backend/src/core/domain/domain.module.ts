import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
    imports: [UserModule, AuthModule],
    exports: [UserModule, AuthModule]
})
export class DomainModule { }
