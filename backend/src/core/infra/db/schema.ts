import * as userModel from '../../domain/user/user.schema.js';
import * as authModel from '../../domain/auth/auth.schema.js';
import * as mailModel from '../mail/mail.schema.js';
import * as accessControlModel from '../../domain/access-control/access-control.schema.js';
// import * as test from '../../domain/user/user.schema.js';

import * as cmsModel from '../../domain/cms/cms.schema.js';
import * as assetsModel from '../../domain/assets/assets.schema.js';
import * as relations from './relations.js';

// Export all tables directly for Drizzle to use
export const schema = {
	...userModel,
	...authModel,
	...mailModel,
	...accessControlModel,
	...cmsModel,
	...assetsModel,
	...relations,
};

export * from '../../domain/user/user.schema.js';
export * from '../../domain/auth/auth.schema.js';
export * from '../mail/mail.schema.js';
export * from '../../domain/access-control/access-control.schema.js';
export * from '../../domain/cms/cms.schema.js';
export * from '../../domain/assets/assets.schema.js';
export * from './relations.js';
