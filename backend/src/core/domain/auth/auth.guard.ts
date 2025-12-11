import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { extractSessionToken } from './utils/token.util.js';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private readonly authService: AuthService) { }
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const sessionToken = extractSessionToken(request.headers.authorization);
		if (!sessionToken) {
			throw new UnauthorizedException('Session token not found');
		}
		const result = await this.authService.inspectSession(sessionToken);
		if (!result) {
			throw new UnauthorizedException('Invalid session token');
		}
		return true;
	}
}
