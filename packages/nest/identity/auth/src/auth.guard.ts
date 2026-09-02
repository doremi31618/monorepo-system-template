import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { extractSessionToken } from './utils/token.util.js';
import { IUserService } from '@platform/nest-identity-users';
@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly authService: AuthService,
		private readonly userService: IUserService
	) { }
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const sessionToken = extractSessionToken(request.headers.authorization);
		if (!sessionToken) {
			throw new UnauthorizedException('Session token not found');
		}
		const result = await this.authService.inspectSession(sessionToken);
		const userBasicInfo = await this.userService.getUserById(result.userId);
		if (!userBasicInfo) {
			throw new UnauthorizedException('Invalid session token');
		}
		request['user'] = {
			id: result.userId,
			name: userBasicInfo.name,
			email: userBasicInfo.email,
		}
		return true;
	}
}
