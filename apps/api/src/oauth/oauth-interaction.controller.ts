import {
	Controller,
	Get,
	Headers,
	Param,
	Post,
	Req,
	Res,
	UnauthorizedException,
	VERSION_NEUTRAL
} from '@nestjs/common';
import { AuthService, extractSessionToken } from '@platform/nest-identity-auth';
import { OAuthInteractionService } from '@platform/nest-infra-oauth-server';
import type { Request, Response } from 'express';

@Controller({ path: 'oauth/interaction', version: VERSION_NEUTRAL })
export class OAuthInteractionController {
	constructor(
		private readonly interactions: OAuthInteractionService,
		private readonly auth: AuthService
	) {}

	@Get(':uid')
	getDetails(
		@Param('uid') _uid: string,
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response
	) {
		return this.interactions.getDetails(req, res);
	}

	@Post(':uid/login')
	async login(
		@Param('uid') _uid: string,
		@Headers('authorization') authorization: string | undefined,
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response
	) {
		const session = await this.requireSession(authorization);
		const redirectTo = await this.interactions.finishLogin(
			req,
			res,
			String(session.userId)
		);
		return { redirectTo };
	}

	@Post(':uid/consent')
	async consent(
		@Param('uid') _uid: string,
		@Headers('authorization') authorization: string | undefined,
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response
	) {
		const session = await this.requireSession(authorization);
		const redirectTo = await this.interactions.finishConsent(
			req,
			res,
			String(session.userId)
		);
		return { redirectTo };
	}

	@Post(':uid/deny')
	async deny(
		@Param('uid') _uid: string,
		@Headers('authorization') authorization: string | undefined,
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response
	) {
		const session = await this.requireSession(authorization);
		const redirectTo = await this.interactions.deny(
			req,
			res,
			String(session.userId)
		);
		return { redirectTo };
	}

	private async requireSession(authorization: string | undefined) {
		const token = extractSessionToken(authorization);
		if (!token) throw new UnauthorizedException('Session token not found');
		try {
			return await this.auth.inspectSession(token);
		} catch {
			throw new UnauthorizedException('Invalid session token');
		}
	}
}
