# Technical Specification: Admin & RBAC (R2)

> **Owner**: System Designer
> **Feature**: Admin Panel & Role-Based Access Control
> **Implementation Guide**: [implementation-guide.md](./implementation-guide.md)
> **Traceability**: `RBAC-001` role deletion reliability and success feedback

## 1. Architecture
基於 `Strategy Pattern` 實現的 RBAC 守衛。

### 1.1 Diagram
(Mermaid Diagram link or code)

## 2. Database Schema
> Update `core/domain/access-control/access-control.schema.ts`

- **roles**: `id`, `name`, `code`, `description`
- **permissions**: `id`, `code` (module.action), `description`
- **user_roles**: `user_id`, `role_id`
- **role_permissions**: `role_id`, `permission_id`

## 3. API Contract

### Roles
- `GET /admin/roles`
- `POST /admin/roles`
- `PUT /admin/roles/:id`
- `DELETE /admin/roles/:id`

#### Role deletion (`RBAC-001`)

- The repository deletes a custom role inside one database transaction in this order: `user_roles`, `role_permissions`, then `roles`.
- Removing role assignments must not remove user accounts.
- System-role protection remains enforced by the existing service/UI policy.
- The Web client awaits `DELETE /admin/roles/:id`, then awaits a fresh `GET /admin/roles`. Only after both operations succeed may it show `Role deleted successfully`.
- Any failure keeps success feedback hidden and follows the existing error path.

### Permissions
- `GET /admin/permissions` (Grouped by module)

## 4. Security
- **Guard**: `RBACGuard` runs after `AuthGuard`.
- **Decorator**: `@Permissions('user.read')`
- **Frontend**: `<Guard permission="user.read">` component.
