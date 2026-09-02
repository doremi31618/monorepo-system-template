export {
  AccessControlModule,
  type AccessControlModuleAsyncOptions,
} from './access-control.module.js';
export {
  ACCESS_CONTROL_BOOTSTRAP_CONFIG,
  type AccessControlBootstrapConfig,
} from './access-control.config.js';
export { AccessControlRepository } from './access-control.repository.js';
export { AccessControlService } from './access-control.service.js';
export {
  RequirePermissions,
  PERMISSIONS_KEY,
} from './permissions.decorator.js';
export { RBACGuard } from './rbac.guard.js';
export * from './access-control.schema.js';
