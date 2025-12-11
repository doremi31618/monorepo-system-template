import * as userModel from '../../domain/user/user.schema.js';
import * as authModel from '../../domain/auth/auth.schema.js';
import * as mailModel from '../mail/mail.schema.js';
// import * as test from '../../domain/user/user.schema.js';

// Export all tables directly for Drizzle to use
export const schema = {
	...userModel,
	...authModel,
	...mailModel
};

export * from '../../domain/user/user.schema.js';
export * from '../../domain/auth/auth.schema.js';
export * from '../mail/mail.schema.js';
