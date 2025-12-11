import * as userModel from './schema/userModel';
import * as authModel from './schema/authModel';
import * as mailModel from './schema/mailModel';

export { userModel, authModel, mailModel };
export const schema = {
	userModel,
	authModel,
	mailModel
};

export * from './schema/userModel';
export * from './schema/authModel';
export * from './schema/mailModel';
