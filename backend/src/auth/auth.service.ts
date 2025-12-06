import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
	SessionDto,
	SignupDto,
	LoginDto,
	UserIdentityDto,
	SignoutDto,
	ResetRequestDto,
	ResetConfirmDto
} from './dto/auth.dto';
import { UserRepository } from 'src/user/user.repository';
import { SessionRepository } from 'src/auth/repository/session.repository';
import { MailService } from 'src/mail/mail.service';
// import { BadRequestException } from '@nestjs/common';

@Injectable()
export class AuthService {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly sessionRepository: SessionRepository,
		private readonly mailService: MailService
	) {}

	async inspectSession(token: string) {
		const session = await this.sessionRepository.getValidSessionByToken(token);
		if (!session) {
			throw new BadRequestException('Invalid token');
		}
		const dto = new SessionDto();
		dto.userId = session.userId;
		dto.sessionToken = session.token;
		dto.expiresAt = session.expiresAt;
		dto.createdAt = session.createdAt;
		dto.updatedAt = session.updatedAt;
		return { data: dto };
	}

	async CreateSession(userId: number) {
		const _sessionToken = crypto.randomUUID();
		const _refreshToken = crypto.randomUUID();

		const [session, refreshToken] = await Promise.all([
			this.sessionRepository.createSession({
				userId: userId,
				sessionToken: _sessionToken,
				expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
			}),
			this.sessionRepository.createRefreshToken(_refreshToken, userId)
		]);
		if (!session || !refreshToken) {
			throw new BadRequestException(
				'Failed to create session or refresh token'
			);
		}
		return { sessionToken: session, refreshToken: refreshToken };
	}

	async signout(sessionToken: string) {
		const userId = await this.sessionRepository.getUserIdByToken(sessionToken);
		if (!userId) {
			throw new BadRequestException('Session not found');
		}
		const { deletedSession, deletedRefreshTokens } =
			await this.sessionRepository.deleteSessionAndRefreshTokens(userId.userId);

		// const deleteRefreshToken =
		if (!deletedSession || !deletedRefreshTokens) {
			throw new BadRequestException('Session or refresh token not found');
		}

		const dto = new SignoutDto();
		dto.userId = userId.userId;
		return { data: dto };
	}

	async login(loginDto: LoginDto) {
		const { email, password } = loginDto;

		// check if user exists
		const user = await this.userRepository.getUserByEmail(email);
		if (!user) {
			throw new BadRequestException('Invalid credentials');
		}

		// check if password is valid
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			throw new BadRequestException('Invalid credentials');
		}

		// create session for user
		const { sessionToken, refreshToken } = await this.CreateSession(user.id);

		return {
			data: new UserIdentityDto(
				sessionToken.sessionToken,
				refreshToken.refreshToken,
				user.id,
				user.name
			)
		};
	}

	async refresh(_refreshToken: string) {
		try {
			const { userId } =
				(await this.sessionRepository.deleteRefreshToken(_refreshToken)) ?? null;
			if (!userId) {
				throw new BadRequestException('Invalid refresh token');
			}
			const { sessionToken, refreshToken } = await this.CreateSession(userId);
			return {
				data: {
					sessionToken,
					refreshToken
				}
			};
		}
		catch (error) {
			console.error('refresh failed', error);
			throw error;
		}
	}

	async signup(signupDto: SignupDto) {
		// check if user already exists
		const existingUser = await this.userRepository.getUserByEmail(
			signupDto.email
		);
		if (existingUser) {
			throw new BadRequestException('User already exists');
		}

		// hash password
		const { email, password, name } = signupDto;
		const hashedPassword = await bcrypt.hash(password, 10);
		const user = await this.userRepository.createUser({
			email,
			password: hashedPassword,
			name
		});
		const { sessionToken, refreshToken } = await this.CreateSession(user.id);
		// const sessionToken = await this.CreateSession(user.id);

		return {
			data: new UserIdentityDto(
				sessionToken.sessionToken,
				refreshToken.refreshToken,
				user.id,
				user.name
			)
		};
	}

	async requestPasswordReset(dto: ResetRequestDto) {
		const user = await this.userRepository.getUserByEmail(dto.email);
		if (!user) {
			throw new BadRequestException('User not found');
		}
		const token = await this.sessionRepository.createResetToken(
			user.id,
			1000 * 60 * 5
		);
		const resetLink = `${process.env.FRONTEND_URL}/auth/reset?token=${token.token}`;
		try {
			await this.mailService.sendResetPasswordEmail(user.email, resetLink);
		} catch (error) {
			// 如果寄信失敗，仍回傳連結以便手動測試
			console.error('sendResetPasswordEmail failed', error);
		}
		return {
			data: {
				token: token.token,
				expiresAt: token.expiresAt,
				resetLink
			}
		};
	}

	async resetPassword(dto: ResetConfirmDto) {
		const consumed = await this.sessionRepository.consumeResetToken(dto.token);
		if (!consumed) {
			throw new BadRequestException('Invalid or expired reset token');
		}
		const hashedPassword = await bcrypt.hash(dto.password, 10);
		await this.userRepository.updatePassword(consumed.userId, hashedPassword);
		await this.sessionRepository.deleteAllTokensByUser(consumed.userId);
		return {
			data: {
				userId: consumed.userId,
				redirect: `${process.env.FRONTEND_URL}/auth/login`
			}
		};
	}
}
