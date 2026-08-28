import { hashClientSecret, verifyClientSecret } from './client-secret.js';

describe('client secret hashing', () => {
	it('stores a one-way hash that verifies the original secret', async () => {
		const secret = 'vocab-production-secret';

		const encodedHash = await hashClientSecret(secret);

		expect(encodedHash).not.toContain(secret);
		await expect(verifyClientSecret(secret, encodedHash)).resolves.toBe(true);
	});
});
