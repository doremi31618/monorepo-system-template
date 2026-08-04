import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service.js';
import mailConfig from './mail.config.js';

describe('MailService', () => {
	let service: MailService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				MailService,
				{
					provide: mailConfig.KEY,
					useValue: {
						host: 'smtp.example.com',
						port: 465,
						user: 'test-user',
						pass: 'test-password',
						from: 'no-reply@example.com'
					}
				},
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
