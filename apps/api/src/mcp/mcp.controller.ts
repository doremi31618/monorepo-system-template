import {
	All,
	Controller,
	Get,
	Req,
	Res,
	VERSION_NEUTRAL
} from '@nestjs/common';
import {
	bearerAuthChallengeResponse,
	verifyBearerToken,
	type AuthInfo
} from '@platform/nest-mcp-server';
import type { Request, Response } from 'express';
import { MCP_PRIVATE_SCOPE } from './mcp.constants.js';
import { McpAccessTokenVerifier } from './mcp-access-token-verifier.service.js';
import { McpCompositionService } from './mcp-composition.service.js';

type AuthenticatedRequest = Request & { auth?: AuthInfo };

@Controller({ version: VERSION_NEUTRAL })
export class McpController {
	constructor(
		private readonly composition: McpCompositionService,
		private readonly tokenVerifier: McpAccessTokenVerifier
	) {}

	@All('mcp/public')
	async publicMcp(@Req() req: AuthenticatedRequest, @Res() res: Response) {
		await this.composition.publicHandler(req, res, req.body);
	}

	@All('mcp/private')
	async privateMcp(@Req() req: AuthenticatedRequest, @Res() res: Response) {
		try {
			req.auth = await verifyBearerToken(req.headers.authorization, {
				verifier: this.tokenVerifier,
				requiredScopes: [MCP_PRIVATE_SCOPE],
				resourceMetadataUrl: this.composition.resourceMetadataUrl
			});
		} catch (error) {
			const challenge = bearerAuthChallengeResponse(error, {
				requiredScopes: [MCP_PRIVATE_SCOPE],
				resourceMetadataUrl: this.composition.resourceMetadataUrl
			});
			await this.writeWebResponse(challenge, res);
			return;
		}

		if (!(await this.composition.canReadPrivateCms(req.auth))) {
			res.status(403).json({
				error: 'forbidden',
				error_description: 'CMS read permission is required'
			});
			return;
		}

		await this.composition.privateHandler(req, res, req.body);
	}

	@Get('.well-known/oauth-protected-resource/mcp/private')
	protectedResourceMetadata(@Res() res: Response) {
		res.json(this.composition.getProtectedResourceMetadata());
	}

	private async writeWebResponse(response: globalThis.Response, res: Response) {
		response.headers.forEach((value, name) => res.setHeader(name, value));
		res.status(response.status).send(await response.text());
	}
}
