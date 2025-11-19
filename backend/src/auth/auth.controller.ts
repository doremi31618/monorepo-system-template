import {
	Controller,
	HttpCode,
	HttpStatus,
	Get,
	Post,
	Body,
	Req as NestRequest,
	Response as NestResponse,
	Headers as ReqHeaders,
	BadRequestException,
	UnauthorizedException,
	UseGuards
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags
} from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';
import {
	LoginDto,
	SignupDto,
	UserIdentityDto,
	SignoutDto
} from 'src/auth/dto/auth.dto';
import { Response, Request } from 'express';
import { AuthGuard } from 'src/auth/auth.guard';
import { extractSessionToken } from 'src/auth/utils/token.util';

const refreshCookieBaseOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'strict' as const,
	path: '/auth/refresh'
};
const refreshCookieMaxAge = 1000 * 60 * 60 * 24 * 30; // 30 days

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@UseGuards(AuthGuard)
	@Get('testguard')
	async testGuard() {
		return {
			message: 'Test guard success'
		};
	}

	@Get('inspect')
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth('access-token')
	@ApiOperation({ summary: 'Inspect current session token' })
	@ApiResponse({
		status: 200,
		description: 'Valid session token',
		type: UserIdentityDto
	})
	async inspectSession(@ReqHeaders('Authorization') token: string) {
		const sessionToken = extractSessionToken(token);
		if (!sessionToken) {
			throw new BadRequestException(
				'Authorization header missing or malformed'
			);
		}
		return this.authService.inspectSession(sessionToken);
	}

	@Post('login')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Login with email/password' })
	@ApiResponse({ status: 200, type: UserIdentityDto })
	async login(
		@Body() dto: LoginDto,
		@NestResponse({ passthrough: true }) response: Response
	) {
		console.log('body', dto);
		const result = await this.authService.login(dto);
		// set refresh token in cookie
		response.cookie('refreshToken', result.data.refreshToken, {
			...refreshCookieBaseOptions,
			maxAge: refreshCookieMaxAge
		});
		return {
			data: {
				token: result.data.token,
				userId: result.data.userId,
				name: result.data.name
			}
		};
	}

	@Post('signup')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Create account with email/password' })
	@ApiResponse({ status: 200, type: UserIdentityDto })
	async signup(
		@Body() signupDto: SignupDto,
		@NestResponse({ passthrough: true }) response: Response
	) {
		const result = await this.authService.signup(signupDto);
		// set refresh token in cookie
		response.cookie('refreshToken', result.data.refreshToken, {
			...refreshCookieBaseOptions,
			maxAge: refreshCookieMaxAge
		});
		return {
			data: {
				token: result.data.token,
				userId: result.data.userId,
				name: result.data.name
			}
		};
	}

	@Post('signout')
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth('access-token')
	@ApiOperation({ summary: 'Sign out and revoke current session' })
	@ApiResponse({ status: 200, type: SignoutDto })
	async signout(
		@ReqHeaders('Authorization') token: string,
		@NestResponse({ passthrough: true }) response: Response
	) {
		const sessionToken = extractSessionToken(token);
		if (!sessionToken) {
			throw new BadRequestException(
				'Authorization header missing or malformed'
			);
		}

		const result = await this.authService.signout(sessionToken);
		response.clearCookie('refreshToken', {
			...refreshCookieBaseOptions,
			maxAge: 0
		});

		return {
			data: {
				userId: result.data.userId,
				message: 'Sign out successful'
			}
		};
	}

	@Post('refresh')
	async refresh(
		@NestRequest() request: Request,
		@NestResponse({ passthrough: true }) response: Response
	) {
		// get refresh token from cookie
		const refreshToken = request.cookies['refreshToken'];
		if (!refreshToken) {
			throw new UnauthorizedException('Refresh token not found');
		}

		const result = await this.authService.refresh(refreshToken);
		if (!result.data) {
			throw new UnauthorizedException('Invalid refresh token');
		}
		// set new refresh token cookie
		response.cookie('refreshToken', result.data.refreshToken.refreshToken, {
			...refreshCookieBaseOptions,
			maxAge: refreshCookieMaxAge
		});

		return {
			data: {
				sessionToken: result.data.sessionToken
			}
		};
	}
}
