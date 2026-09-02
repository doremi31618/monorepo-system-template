import { Test, TestingModule } from '@nestjs/testing';
import { GoogleController } from './google.controller.js';
import { GoogleService } from './google.service.js';

describe('GoogleController', () => {
	let controller: GoogleController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [GoogleController],
			providers: [
				{
					provide: GoogleService,
					useValue: {
						getLoginAuthUrl: jest.fn(),
						getSignupAuthUrl: jest.fn(),
						googleLogin: jest.fn(),
						googleSignup: jest.fn()
					}
				}
			]
		}).compile();

		controller = module.get<GoogleController>(GoogleController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
