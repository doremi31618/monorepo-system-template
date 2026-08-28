import * as usersModel from '@platform/users/schema';
import * as authModel from '@platform/auth/schema';
import * as mailModel from '@platform/mail/schema';
import * as schedulingModel from '@platform/scheduling/schema';
import * as accessControlModel from '@platform/access-control/schema';
import * as assetsModel from '@platform/assets/schema';
import * as cmsModel from '@platform/cms/schema';
import * as oauthServerModel from '@platform/oauth-server/schema';
import * as relationModels from './relations.js';

export const schema = {
  ...usersModel,
  ...authModel,
  ...mailModel,
  ...schedulingModel,
  ...accessControlModel,
  ...assetsModel,
  ...cmsModel,
  ...oauthServerModel,
  ...relationModels,
};

export * from '@platform/users/schema';
export * from '@platform/auth/schema';
export * from '@platform/mail/schema';
export * from '@platform/scheduling/schema';
export * from '@platform/access-control/schema';
export * from '@platform/assets/schema';
export * from '@platform/cms/schema';
export * from '@platform/oauth-server/schema';
export * from './relations.js';
