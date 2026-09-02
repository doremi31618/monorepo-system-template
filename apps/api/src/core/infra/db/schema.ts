import * as usersModel from '@platform/nest-identity-users/schema';
import * as authModel from '@platform/nest-identity-auth/schema';
import * as mailModel from '@platform/nest-infra-mail/schema';
import * as schedulingModel from '@platform/nest-infra-scheduling/schema';
import * as accessControlModel from '@platform/nest-identity-access-control/schema';
import * as assetsModel from '@platform/nest-content-assets/schema';
import * as cmsModel from '@platform/nest-content-cms/schema';
import * as relationModels from './relations.js';

export const schema = {
  ...usersModel,
  ...authModel,
  ...mailModel,
  ...schedulingModel,
  ...accessControlModel,
  ...assetsModel,
  ...cmsModel,
  ...relationModels,
};

export * from '@platform/nest-identity-users/schema';
export * from '@platform/nest-identity-auth/schema';
export * from '@platform/nest-infra-mail/schema';
export * from '@platform/nest-infra-scheduling/schema';
export * from '@platform/nest-identity-access-control/schema';
export * from '@platform/nest-content-assets/schema';
export * from '@platform/nest-content-cms/schema';
export * from './relations.js';
