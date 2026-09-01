import {
	BadRequestException,
	Controller,
	Get,
	Req,
	Res,
	Query
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { GoogleService } from './google.service.js';

@Controller('auth/google')
export class GoogleController {
	constructor(private readonly googleService: GoogleService) {}

	@Get('login')
	async googleLogin(
		@Res() res: Response,
		@Query('returnTo') returnTo?: string
	) {
		const safeReturnTo = this.safeReturnTo(returnTo);
		const nonce = randomUUID();
		const state = `${nonce}.${Buffer.from(safeReturnTo).toString('base64url')}`;
		res.cookie('googleOauthState', nonce, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'prd',
			sameSite: 'lax',
			maxAge: 10 * 60 * 1000
		});
		return res.redirect(this.googleService.getLoginAuthUrl(state));
	}

	@Get('signup')
	async googleSignup(@Res() res: Response) {
		return res.redirect(this.googleService.getSignupAuthUrl());
	}

	@Get('login/callback')
	async handleGoogleLoginCallback(
		@Req() req: Request,
		@Res() res: Response,
		@Query('code') code: string,
		@Query('state') state: string
	) {
		try {
			const returnTo = this.verifyState(state, req.cookies?.googleOauthState);
			res.clearCookie('googleOauthState');
			const { session, user } = await this.googleService.googleLogin(code);
			this.setRefreshCookie(res, session.refreshToken.refreshToken);
			return res.redirect(
				`${process.env.FRONTEND_URL}/auth/callback?userId=${user?.id}&returnTo=${encodeURIComponent(returnTo)}`
			);
		} catch {
			// 若使用者不存在或未綁定 provider，導向註冊頁
			return res.redirect(`${process.env.FRONTEND_URL}/auth/signup`);
		}
	}

	@Get('signup/callback')
	async handleGoogleSignupCallback(
		@Res() res: Response,
		@Query('code') code: string
	) {
		const { session } = await this.googleService.googleSignup(code);
		this.setRefreshCookie(res, session.refreshToken.refreshToken);
		return res.redirect(
			`${process.env.FRONTEND_URL}/auth/callback?token=${session.sessionToken}`
		);
	}

	private setRefreshCookie(res: Response, token: string) {
		res.cookie('refreshToken', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'prd',
			maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
		});
	}

	private safeReturnTo(returnTo?: string): string {
		if (!returnTo) return '/user/home';
		if (!/^\/oauth\/interaction\/[A-Za-z0-9_-]+$/.test(returnTo)) {
			throw new BadRequestException('Invalid OAuth return path');
		}
		return returnTo;
	}

	private verifyState(state?: string, cookieNonce?: string): string {
		const [nonce, encodedReturnTo] = state?.split('.') ?? [];
		if (!nonce || !encodedReturnTo || !cookieNonce) {
			throw new BadRequestException('Invalid Google OAuth state');
		}
		const actual = Buffer.from(nonce);
		const expected = Buffer.from(cookieNonce);
		if (
			actual.length !== expected.length ||
			!timingSafeEqual(actual, expected)
		) {
			throw new BadRequestException('Invalid Google OAuth state');
		}
		return this.safeReturnTo(
			Buffer.from(encodedReturnTo, 'base64url').toString()
		);
	}
}
