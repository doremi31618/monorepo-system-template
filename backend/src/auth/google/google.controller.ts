import {
	Controller,
	Get,
	Res,
	Query,
	UnauthorizedException
} from '@nestjs/common';
import { google } from 'googleapis';
import { Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { UserRepository } from 'src/user/user.repository';
import { AuthService } from 'src/auth/auth.service';
import { randomUUID } from 'crypto';
// import { LimitExceededException } from '@aws-sdk/client-ses';

@Controller('auth/google')
export class GoogleController {
	private readonly redirectUrl: string;
	private readonly oauth2Client: OAuth2Client;
	// private readonly authService: AuthService;

	constructor(
		private readonly userRepository: UserRepository,
		private readonly authService: AuthService
	) {
		this.redirectUrl = `${process.env.HOST_URL}/auth/google/callback`;
		this.oauth2Client = new google.auth.OAuth2(
			process.env.GOOGLE_SSO_CLIENT_ID,
			process.env.GOOGLE_SSO_CLIENT_SECRET,
			this.redirectUrl
		);
	}
	@Get('login')
	async googleLogin(@Res() res: Response) {
		return res.redirect(
			this.oauth2Client.generateAuthUrl({
				access_type: 'offline',
				prompt: 'consent',
				scope: ['openid', 'email', 'profile']
			})
		);
	}

	@Get('callback')
	async handleGoogleCallback(
		@Res() res: Response,
		@Query('code') code: string
	) {
		const tokenResponse = await this.oauth2Client.getToken(code);
		this.oauth2Client.setCredentials(tokenResponse.tokens);

		const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
		const { data } = await oauth2.userinfo.get();

		if (!data.email) {
			throw new UnauthorizedException('Google profile missing email');
		}

		let existingUser = await this.userRepository.getUserByEmail(data.email);

		// create user if not exists
		if (!existingUser) {
			existingUser = await this.userRepository.createUser({
				email: data.email,
				name: data.name ?? 'Google User',
				// Placeholder password for federated users; replace with proper handling.
				password: randomUUID()
			});
		}

		// create session for user
		const { refreshToken } = await this.authService.CreateSession(
			existingUser.id
		);

		res.cookie('refreshToken', refreshToken.refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
		});

		return res.redirect(`${process.env.FRONTEND_URL}/auth/callback`);


		// return { data: { message: 'Google callback successful' } };
	}
}
