import { Module } from '@nestjs/common';
import { InfraModule } from './infra/infra.module.js';
import { DomainModule } from './domain/domain.module.js';

@Module({
	imports: [InfraModule, DomainModule],
	exports: [InfraModule, DomainModule]
})
export class CoreModule {}
