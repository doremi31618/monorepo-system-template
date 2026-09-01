export type OAuthClientAccess = {
	allowedResources: string[];
	allowedScopes: string[];
};

export type OAuthResourceAccess = {
	uri: string;
	allowedScopes: string[];
};

export type AuthorizeResourceAccessInput = {
	requestedResource: string;
	requestedScopes: string[];
	client: OAuthClientAccess;
	resource: OAuthResourceAccess;
};

export type AuthorizedResourceAccess = {
	audience: string;
	scopes: string[];
};

export class OAuthPolicyError extends Error {
	constructor(
		public readonly code: 'invalid_target' | 'invalid_scope',
		message: string
	) {
		super(message);
		this.name = 'OAuthPolicyError';
	}
}

const IDENTITY_SCOPES = new Set([
	'openid',
	'email',
	'profile',
	'offline_access'
]);

export function authorizeResourceAccess(
	input: AuthorizeResourceAccessInput
): AuthorizedResourceAccess {
	if (
		input.resource.uri !== input.requestedResource ||
		!input.client.allowedResources.includes(input.requestedResource)
	) {
		throw new OAuthPolicyError(
			'invalid_target',
			'The requested resource is not allowed for this client'
		);
	}

	const invalidScope = input.requestedScopes.find(
		(scope) =>
			!input.client.allowedScopes.includes(scope) ||
			(!IDENTITY_SCOPES.has(scope) &&
				!input.resource.allowedScopes.includes(scope))
	);
	if (invalidScope) {
		throw new OAuthPolicyError(
			'invalid_scope',
			`The requested scope is not allowed: ${invalidScope}`
		);
	}

	return {
		audience: input.requestedResource,
		scopes: input.requestedScopes
	};
}
