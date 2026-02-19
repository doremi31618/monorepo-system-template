import { Module, Global } from '@nestjs/common';
import { createDB, createPool } from './db.js';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
@Global()
@Module({
	providers: [
		{
			provide: 'PG_POOL',
			useFactory: (configService: ConfigService) => {
				const connectingString = configService.getOrThrow('DATABASE_URL');
				return createPool(connectingString);
			},
			inject: [ConfigService]
		},

		{
			provide: 'DB',
			useFactory: (pool: Pool) => {
				return createDB(pool);
			},

			inject: ['PG_POOL']
		},
	],
	exports: ['DB', 'PG_POOL']
})
export class DbModule { }
