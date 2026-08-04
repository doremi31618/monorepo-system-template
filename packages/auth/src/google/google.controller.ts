import { Controller, Get, Res, Query } from '@nestjs/common';
import type { Response } from 'express';
import { GoogleService } from './google.service.js';

@Controller('auth/google')
export class GoogleController {
	constructor(private readonly googleService: GoogleService) { }

	@Get('login')
	async googleLogin(@Res() res: Response) {
		return res.redirect(this.googleService.getLoginAuthUrl());
	}

	@Get('signup')
	async googleSignup(@Res() res: Response) {
		return res.redirect(this.googleService.getSignupAuthUrl());
	}

	@Get('login/callback')
	async handleGoogleLoginCallback(
		@Res() res: Response,
		@Query('code') code: string
	) {
		try {
			const { session, user } = await this.googleService.googleLogin(code);
			this.setRefreshCookie(res, session.refreshToken.refreshToken);
			return res.redirect(
				`${process.env.FRONTEND_URL}/auth/callback?token=${session.sessionToken}&userId=${user?.id}`
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
}
