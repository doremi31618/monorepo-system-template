import { Module } from '@nestjs/common';
import { db, pool } from './db';

@Module({
	providers: [
		{ provide: 'DB', useValue: db },
		{ provide: 'PG_POOL', useValue: pool }
	],
	exports: ['DB', 'PG_POOL']
})
export class DbModule {}
