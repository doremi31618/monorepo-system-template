import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { SessionRepository } from './auth.repository.js';
import type { UserRepository } from '../user/user.repository.js';
import { AuthService } from './auth.service.js';
import { MailService } from '../../infra/mail/mail.service.js';
import { LoggerService } from '../../infra/logger/logger.service.js';

describe('AuthService', () => {

	let service: AuthService;
	let userRepository: jest.Mocked<UserRepository>;
	let sessionRepository: jest.Mocked<SessionRepository>;
	let mailService: jest.Mocked<MailService>;
	let logger: jest.Mocked<LoggerService>;

	beforeEach(() => {
		userRepository = {
			getUserByEmail: jest.fn(),
			createUser: jest.fn(),
			updatePassword: jest.fn()
		} as unknown as jest.Mocked<UserRepository>;

		sessionRepository = {
			createSession: jest.fn(),
			cleanupExpiredSessions: jest.fn(),
			createRefreshToken: jest.fn(),
			deleteRefreshToken: jest.fn(),
			deleteAllTokensByUser: jest.fn(),
			createResetToken: jest.fn(),
			consumeResetToken: jest.fn(),
			getUserIdByToken: jest.fn(),
			deleteSessionAndRefreshTokens: jest.fn()
		} as unknown as jest.Mocked<SessionRepository>;

		mailService = {
			sendResetPasswordEmail: jest.fn()
		} as unknown as jest.Mocked<MailService>;

		logger = {
			setContext: jest.fn(),
			log: jest.fn(),
			error: jest.fn()
		} as unknown as jest.Mocked<LoggerService>;

		service = new AuthService(
			userRepository,
			sessionRepository,
			mailService,
			logger
		);
		jest.clearAllMocks();
	});

	const buildUser = () => ({
		id: 1,
		email: 'user@example.com',
		name: 'Existing User',
		password: 'hashed-password',
		createdAt: new Date(),
		updatedAt: new Date()
	});

	describe('createSession', () => {
		it('persists a session and returns the tokens', async () => {
			sessionRepository.createSession.mockResolvedValue({
				id: 'session-id',
				userId: 1,
			sessionToken: 'session-token',
			expiresAt: new Date()
			} as any);
			sessionRepository.createRefreshToken.mockResolvedValue({
				id: 'refresh-token-id',
				userId: 1,
				refreshToken: 'refresh-token',
				expiresAt: new Date()
			} as any);

			const result = await service.createSession(1);

			expect(sessionRepository.createSession).toHaveBeenCalledTimes(1);
			const savedSession = sessionRepository.createSession.mock.calls[0][0];
			expect(savedSession.userId).toBe(1);
			// The sessionToken passed to repository is randomUUID, we can't strictly equality check it against our mock return unless we mock crypto
			// But createSession returns { sessionToken: <session object>, refreshToken: ... }
			// The implementation returns raw session object from repository.
			expect(result.sessionToken).toBeDefined();
			expect(result.refreshToken).toBeDefined();
		});
	});

	describe('login', () => {
		const loginDto = {
			email: 'user@example.com',
			password: 'plain-password'
		};

		it('returns user identity when credentials are valid', async () => {
			const user = buildUser();
			user.password = await bcrypt.hash(loginDto.password, 10);
			userRepository.getUserByEmail.mockResolvedValue(user);
			sessionRepository.createSession.mockResolvedValue({
				id: 'session-id',
				userId: user.id,
				sessionToken: 'session-token',
				expiresAt: new Date()
			} as any);
			sessionRepository.createRefreshToken.mockResolvedValue({
				id: 'refresh-token-id',
				userId: user.id,
				refreshToken: 'refresh-token',
				expiresAt: new Date()
			} as any);

			const result = await service.login(loginDto);

			expect(userRepository.getUserByEmail).toHaveBeenCalledWith(
				loginDto.email
			);
			expect(sessionRepository.createSession).toHaveBeenCalledTimes(1);
			expect(result).toEqual(
				expect.objectContaining({
					token: 'session-token',
					userId: user.id,
					name: user.name
				})
			);
		});

		it('throws when the user does not exist', async () => {
			userRepository.getUserByEmail.mockResolvedValue(null);

			await expect(service.login(loginDto)).rejects.toThrow(
				new BadRequestException('Invalid credentials')
			);
			expect(sessionRepository.createSession).not.toHaveBeenCalled();
		});

		it('throws when the password is invalid', async () => {
			const user = buildUser();
			user.password = await bcrypt.hash('different-password', 10);
			userRepository.getUserByEmail.mockResolvedValue(user);
			sessionRepository.createSession.mockResolvedValue({
				id: 'session-id',
				userId: user.id,
				sessionToken: 'session-token',
				expiresAt: new Date()
			} as any);

			await expect(service.login(loginDto)).rejects.toThrow(
				new BadRequestException('Invalid credentials')
			);
		});
	});

	describe('signup', () => {
		const signupDto = {
			email: 'new-user@example.com',
			password: 'plain',
			name: 'New User'
		};

		it('hashes the password, creates the user, and returns identity', async () => {
			userRepository.getUserByEmail.mockResolvedValue(null);
			userRepository.createUser.mockResolvedValue({
				id: 2,
				email: signupDto.email,
				name: signupDto.name,
				password: 'stored-hash',
				createdAt: new Date(),
				updatedAt: new Date()
			});
			sessionRepository.createSession.mockResolvedValue({
				id: 'session-id',
				userId: 2,
				sessionToken: 'session-token',
				expiresAt: new Date()
			} as any);
			sessionRepository.createRefreshToken.mockResolvedValue({
				id: 'refresh-token-id',
				userId: 2,
				refreshToken: 'refresh-token',
				expiresAt: new Date()
			} as any);

			const result = await service.signup(signupDto);

			expect(userRepository.getUserByEmail).toHaveBeenCalledWith(
				signupDto.email
			);
			expect(userRepository.createUser).toHaveBeenCalledWith(
				expect.objectContaining({
					email: signupDto.email,
					name: signupDto.name
				})
			);
			const createdUser = userRepository.createUser.mock.calls[0][0];
			expect(createdUser.password).not.toBe(signupDto.password);
			await expect(
				bcrypt.compare(signupDto.password, createdUser.password)
			).resolves.toBe(true);
			expect(sessionRepository.createSession).toHaveBeenCalledWith(
				expect.objectContaining({
					userId: 2
				})
			);
			expect(result).toEqual(
				expect.objectContaining({
					token: 'session-token',
					userId: 2,
					name: signupDto.name
				})
			);
		});

		it('throws when the email is already registered', async () => {
			userRepository.getUserByEmail.mockResolvedValue(buildUser());

			await expect(service.signup(signupDto)).rejects.toThrow(
				new BadRequestException('User already exists')
			);
			expect(userRepository.createUser).not.toHaveBeenCalled();
			expect(sessionRepository.createSession).not.toHaveBeenCalled();
		});
	});
});
