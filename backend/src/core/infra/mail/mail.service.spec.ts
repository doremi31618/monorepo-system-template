import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service.js';

describe('MailService', () => {
	let service: MailService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				MailService,
				{
					provide: 'DB',
					useValue: {
						insert: jest.fn(() => ({
							values: jest.fn()
						}))
					}
				}
			]
		}).compile();

		service = module.get<MailService>(MailService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
