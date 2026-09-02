import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
const KEY_LENGTH = 64;
const COST = 16_384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;

function deriveKey(secret: string, salt: Buffer): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		scrypt(
			secret,
			salt,
			KEY_LENGTH,
			{
				N: COST,
				r: BLOCK_SIZE,
				p: PARALLELIZATION,
				maxmem: 64 * 1024 * 1024
			},
			(error, derivedKey) => {
				if (error) {
					reject(error);
					return;
				}
				resolve(derivedKey);
			}
		);
	});
}

export async function hashClientSecret(secret: string): Promise<string> {
	if (!secret) {
		throw new TypeError('Client secret must not be empty');
	}

	const salt = randomBytes(16);
	const digest = await deriveKey(secret, salt);

	return [
		'scrypt',
		COST,
		BLOCK_SIZE,
		PARALLELIZATION,
		salt.toString('base64url'),
		digest.toString('base64url')
	].join('$');
}

export async function verifyClientSecret(
	secret: string,
	encodedHash: string
): Promise<boolean> {
	const [
		algorithm,
		costText,
		blockSizeText,
		parallelizationText,
		saltText,
		digestText
	] = encodedHash.split('$');
	const cost = Number(costText);
	const blockSize = Number(blockSizeText);
	const parallelization = Number(parallelizationText);

	if (
		algorithm !== 'scrypt' ||
		cost !== COST ||
		blockSize !== BLOCK_SIZE ||
		parallelization !== PARALLELIZATION ||
		!saltText ||
		!digestText
	) {
		return false;
	}

	const expected = Buffer.from(digestText, 'base64url');
	if (expected.length !== KEY_LENGTH) {
		return false;
	}

	const actual = await deriveKey(secret, Buffer.from(saltText, 'base64url'));

	return timingSafeEqual(actual, expected);
}
