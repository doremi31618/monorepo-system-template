import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { SessionRepository } from './repository/session.repository';
import type { UserRepository } from '../user/user.repository';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
	compare: jest.fn(),
	hash: jest.fn()
}));

describe('AuthService', () => {
	let service: AuthService;
	let userRepository: jest.Mocked<UserRepository>;
	let sessionRepository: jest.Mocked<SessionRepository>;

	const compareMock = bcrypt.compare as jest.MockedFunction<
		typeof bcrypt.compare
	>;
	const hashMock = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

	beforeEach(() => {
		userRepository = {
			getUserByEmail: jest.fn(),
			createUser: jest.fn()
		} as unknown as jest.Mocked<UserRepository>;

		sessionRepository = {
			createSession: jest.fn(),
			cleanupExpiredSessions: jest.fn()
		} as unknown as jest.Mocked<SessionRepository>;

		service = new AuthService(userRepository, sessionRepository);
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

	describe('CreateSession', () => {
		it('persists a session and returns the generated token', async () => {
			sessionRepository.createSession.mockResolvedValue({
				id: 'session-id',
				userId: 1,
				sessionToken: 'session-token',
				expiresAt: new Date()
			} as any);

			const token = await service.CreateSession(1);

			expect(sessionRepository.createSession).toHaveBeenCalledTimes(1);
			const savedSession = sessionRepository.createSession.mock.calls[0][0];
			expect(savedSession.userId).toBe(1);
			expect(savedSession.sessionToken).toBe(token);
			expect(savedSession.expiresAt).toBeInstanceOf(Date);
			expect(savedSession.expiresAt.getTime()).toBeGreaterThan(Date.now());
			expect(typeof token).toBe('string');
			expect(token.length).toBeGreaterThan(0);
		});
	});

	describe('login', () => {
		const loginDto = {
			email: 'user@example.com',
			password: 'plain-password'
		};

		it('returns user identity when credentials are valid', async () => {
			const user = buildUser();
			userRepository.getUserByEmail.mockResolvedValue(user);
			compareMock.mockResolvedValue(true);
			sessionRepository.createSession.mockResolvedValue({
				id: 'session-id',
				userId: user.id,
				sessionToken: 'session-token',
				expiresAt: new Date()
			} as any);

			const result = await service.login(loginDto);

			expect(userRepository.getUserByEmail).toHaveBeenCalledWith(
				loginDto.email
			);
			expect(compareMock).toHaveBeenCalledWith(
				loginDto.password,
				user.password
			);
			expect(sessionRepository.createSession).toHaveBeenCalledTimes(1);
			const persistedSession = sessionRepository.createSession.mock.calls[0][0];
			expect(result).toEqual(
				expect.objectContaining({
					token: persistedSession.sessionToken,
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
			expect(compareMock).not.toHaveBeenCalled();
			expect(sessionRepository.createSession).not.toHaveBeenCalled();
		});

		it('throws when the password is invalid', async () => {
			const user = buildUser();
			userRepository.getUserByEmail.mockResolvedValue(user);
			compareMock.mockResolvedValue(false);
			sessionRepository.createSession.mockResolvedValue({
				id: 'session-id',
				userId: user.id,
				sessionToken: 'session-token',
				expiresAt: new Date()
			} as any);

			await expect(service.login(loginDto)).rejects.toThrow(
				new BadRequestException('Invalid credentials')
			);
			expect(compareMock).toHaveBeenCalledWith(
				loginDto.password,
				user.password
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
			hashMock.mockResolvedValue('hashed-password');
			userRepository.createUser.mockResolvedValue({
				id: 2,
				email: signupDto.email,
				name: signupDto.name,
				password: 'hashed-password',
				createdAt: new Date(),
				updatedAt: new Date()
			});
			sessionRepository.createSession.mockResolvedValue({
				id: 'session-id',
				userId: 2,
				sessionToken: 'session-token',
				expiresAt: new Date()
			} as any);

			const result = await service.signup(signupDto);

			expect(userRepository.getUserByEmail).toHaveBeenCalledWith(
				signupDto.email
			);
			expect(hashMock).toHaveBeenCalledWith(signupDto.password, 10);
			expect(userRepository.createUser).toHaveBeenCalledWith({
				email: signupDto.email,
				password: 'hashed-password',
				name: signupDto.name
			});
			expect(sessionRepository.createSession).toHaveBeenCalledWith(
				expect.objectContaining({
					userId: 2
				})
			);
			const persistedSession = sessionRepository.createSession.mock.calls[0][0];
			expect(result).toEqual(
				expect.objectContaining({
					token: persistedSession.sessionToken,
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
			expect(hashMock).not.toHaveBeenCalled();
			expect(userRepository.createUser).not.toHaveBeenCalled();
			expect(sessionRepository.createSession).not.toHaveBeenCalled();
		});
	});
});
