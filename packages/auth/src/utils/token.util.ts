export function extractSessionToken(authHeader?: string | null): string | null {
	if (!authHeader) {
		return null;
	}
	const trimmed = authHeader.trim();
	if (!trimmed) {
		return null;
	}

	const bearerMatch = /^Bearer\s+(.+)$/i.exec(trimmed);
	if (bearerMatch) {
		const token = bearerMatch[1].trim();
		return token.length > 0 ? token : null;
	}

	return trimmed;
}
