import { AuthGuard } from './auth.guard.js';

describe('AuthGuard', () => {
	it('should be defined', () => {
		expect(new AuthGuard()).toBeDefined();
	});
});
