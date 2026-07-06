import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { IUserService } from '../user/user.interface.js';
import { LoggerService } from '../../infra/logger/logger.service.js';

describe('AuthController', () => {
	let controller: AuthController;
	const mockAuthService = {
		login: jest.fn(),
		signup: jest.fn(),
		inspectSession: jest.fn()
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [
				{
					provide: AuthService,
					useValue: mockAuthService
				},
				{
					provide: IUserService,
					useValue: {
						getUserById: jest.fn()
					}
				},
				{
					provide: LoggerService,
					useValue: {
						setContext: jest.fn(),
						log: jest.fn(),
						error: jest.fn()
					}
				}
			]
		}).compile();

		controller = module.get<AuthController>(AuthController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
