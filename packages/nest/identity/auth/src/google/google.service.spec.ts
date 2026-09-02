import { Test, TestingModule } from '@nestjs/testing';
import { GoogleService } from './google.service.js';
import authConfig from '../auth.config.js';
import { AuthService } from '../auth.service.js';
import { UserRepository } from '@platform/nest-identity-users';

describe('GoogleService', () => {
	let service: GoogleService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				GoogleService,
				{
					provide: authConfig.KEY,
					useValue: {
						googleClient: 'test-client-id',
						googleSecret: 'test-client-secret',
						hostUrl: 'http://localhost:3333/v1'
					}
				},
				{
					provide: AuthService,
					useValue: {
						createSession: jest.fn()
					}
				},
				{
					provide: UserRepository,
					useValue: {
						getUserByEmail: jest.fn(),
						createUser: jest.fn()
					}
				},
				{
					provide: 'DB',
					useValue: {
						select: jest.fn(),
						insert: jest.fn()
					}
				}
			]
		}).compile();

		service = module.get<GoogleService>(GoogleService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
