import {
	redactForLogging,
	redactUrlForLogging
} from './logging.interceptor.js';

describe('redactForLogging', () => {
	it('removes nested credentials and tokens before structured logging', () => {
		expect(
			redactForLogging({
				data: {
					token: 'session-token',
					refreshToken: 'refresh-token',
					clientSecret: 'client-secret',
					profile: { email: 'user@example.com' }
				}
			})
		).toEqual({
			data: {
				token: '[REDACTED]',
				refreshToken: '[REDACTED]',
				clientSecret: '[REDACTED]',
				profile: { email: 'user@example.com' }
			}
		});
	});

	it('removes interaction identifiers from request paths', () => {
		expect(redactUrlForLogging('/oauth/interaction/sensitive-id/consent')).toBe(
			'/oauth/interaction/[REDACTED]/consent'
		);
	});
});
