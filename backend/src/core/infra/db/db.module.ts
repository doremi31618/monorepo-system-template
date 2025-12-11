import { Module } from '@nestjs/common';
import { db, pool } from './db.js';

@Module({
	providers: [
		{ provide: 'DB', useValue: db },
		{ provide: 'PG_POOL', useValue: pool }
	],
	exports: ['DB', 'PG_POOL']
})
export class DbModule {}
