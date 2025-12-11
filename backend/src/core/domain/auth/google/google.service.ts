import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { randomUUID } from 'crypto';
import { AuthService } from '../auth.service';
import { UserRepository } from 'src/core/domain/user/user.repository';
import { type DB, schema } from 'src/core/infra/db/db';
import { and, eq } from 'drizzle-orm';

type FlowMode = 'login' | 'signup';

@Injectable()
export class GoogleService {
	private readonly loginRedirect: string;
	private readonly signupRedirect: string;
	private readonly clientId = process.env.GOOGLE_SSO_CLIENT_ID;
	private readonly clientSecret = process.env.GOOGLE_SSO_CLIENT_SECRET;

	constructor(
		private readonly authService: AuthService,
		private readonly userRepository: UserRepository,
		@Inject('DB') private readonly db: DB
	) {
		this.loginRedirect = `${process.env.HOST_URL}/auth/google/login/callback`;
		this.signupRedirect = `${process.env.HOST_URL}/auth/google/signup/callback`;
	}

	getLoginAuthUrl() {
		return this.createOAuthClient(this.loginRedirect).generateAuthUrl({
			access_type: 'offline',
			prompt: 'consent',
			scope: ['openid', 'email', 'profile']
		});
	}

	getSignupAuthUrl() {
		return this.createOAuthClient(this.signupRedirect).generateAuthUrl({
			access_type: 'offline',
			prompt: 'consent',
			scope: ['openid', 'email', 'profile']
		});
	}

	async googleLogin(code: string) {
		const profile = await this.fetchProfile(code, 'login');

		if (!profile.email) {
			throw new BadRequestException('Google profile missing email');
		}

		const user = await this.userRepository.getUserByEmail(profile.email);
		if (!user) {
			throw new BadRequestException('User not found, please sign up first');
		}

		const provider = await this.findProviderLink(user.id, profile.id);
		if (!provider) {
			throw new BadRequestException(
				'Google account not linked, please sign up first'
			);
		}

		const session = await this.authService.createSession(user.id);
		return { session, user };
	}

	async googleSignup(code: string) {
		const profile = await this.fetchProfile(code, 'signup');

		if (!profile.email) {
			throw new BadRequestException('Google profile missing email');
		}

		const existingUser = await this.userRepository.getUserByEmail(profile.email);
		let userId: number;

		if (existingUser) {
			userId = existingUser.id;
			const provider = await this.findProviderLink(userId, profile.id);
			if (!provider) {
				await this.createProviderLink(userId, profile.id);
			}
		} else {
			const newUser = await this.userRepository.createUser({
				email: profile.email,
				name: profile.name ?? 'Google User',
				password: randomUUID()
			});
			userId = newUser.id;
			await this.createProviderLink(userId, profile.id);
		}

		const session = await this.authService.createSession(userId);
		return { session };
	}

	private createOAuthClient(redirectUri: string): OAuth2Client {
		return new google.auth.OAuth2(
			this.clientId,
			this.clientSecret,
			redirectUri
		);
	}

	private async fetchProfile(code: string, mode: FlowMode): Promise<{
		email?: string | null;
		name?: string | null;
		id: string;
	}> {
		const redirectUri =
			mode === 'login' ? this.loginRedirect : this.signupRedirect;
		const client = this.createOAuthClient(redirectUri);
		const tokenResponse = await client.getToken(code);
		client.setCredentials(tokenResponse.tokens);

		const oauth2 = google.oauth2({ version: 'v2', auth: client });
		const { data } = await oauth2.userinfo.get();
		if (!data.id) {
			throw new BadRequestException('Google profile missing id');
		}
		return { email: data.email, name: data.name, id: data.id };
	}

	private async findProviderLink(userId: number, providerId: string) {
		const rows = await this.db
			.select()
			.from(schema.authModel.authProviders)
			.where(
				and(
					eq(schema.authModel.authProviders.userId, userId),
					eq(schema.authModel.authProviders.providerId, providerId)
				)
			);
		return rows[0] ?? null;
	}

	private async createProviderLink(userId: number, providerId: string) {
		await this.db.insert(schema.authModel.authProviders).values({
			userId,
			provider: 'google',
			providerId
		});
	}
}
