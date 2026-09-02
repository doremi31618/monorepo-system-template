# Role Deletion Reliability and Feedback Project Task

> **Work Item ID**: RBAC-001
> **Status**: Ready for Review
> **Actor**: Codex
> **Role**: Owner
> **Branch**: `feat/RBAC-001-role-delete-feedback`
> **Base**: local `dev` (`fc002d0`)
> **Worktree**: `/Users/ericzhan/Documents/side-projects/monorepo-system-template-worktrees/RBAC-001-role-delete-feedback`
> **PR**: [#20](https://github.com/doremi31618/monorepo-system-template/pull/20)
> **Related Spec**: `doc/system-spec/R2-admin-rbac/product-spec.md` (REQ-R-04), `doc/system-spec/R2-admin-rbac/technical-spec.md` (Role deletion), `doc/system-spec/R2-admin-rbac/design-spec.md` (Role deletion feedback)
> **Release**: Pending
> **Last updated**: 2026-09-02

## Objective

Make custom-role deletion reliable when the role has user and permission relationships, then give the administrator an unambiguous success toast after the deletion and refreshed role list both succeed.

## Discovery / Shared Understanding

- **Mode**: Grill Me skipped by explicit user request.
- **Gate status**: Bypassed on 2026-09-02.
- **Summary**: A custom role may be deleted even when assigned to users. The operation removes the role's user and permission relationships atomically, preserves user accounts, reloads the role list, and then shows `Role deleted successfully`.
- **Assumptions**:
  - The success message follows the existing English admin UI.
  - No undo action is included.
  - Existing failure feedback remains unchanged; a failed delete or failed list refresh must not show the success toast.
  - System roles remain protected from deletion in both UI and API behavior.
- **Risks and acceptance**:
  - A transaction is required to avoid partially removing relationships.
  - The toast is intentionally delayed until the refreshed list confirms the visible state is current.
  - Browser regression coverage must exercise the real role page and observable toast, not source text.

## Acceptance Criteria

- [x] Deleting a custom role removes its user-role and role-permission relationships before removing the role in one transaction.
- [x] Users previously assigned to that role are preserved.
- [x] After the delete request and role-list refresh both succeed, the role disappears and a `Role deleted successfully` toast is visible.
- [x] A failed delete or failed list refresh does not show the success toast.
- [x] System roles remain non-deletable.
- [x] API and Web regression suites pass.

## Scope

### In scope

- Access-control repository role-deletion transaction.
- API E2E regression for deleting a related custom role.
- Roles page success toast and browser regression coverage.
- Product, technical, design, and project-task documentation alignment.

### Out of scope

- Undo/restore, bulk deletion, audit-log expansion, or redesigning all admin error messages.
- Deleting user accounts when a role is deleted.
- Changing system-role protection.

## Required Tests

- [x] API E2E: custom role with a permission and assigned user is deleted while the user remains.
- [x] Web browser regression: deleting a custom role removes it from the list and shows the success toast.
- [x] Web check, lint, build, and full browser regression.
- [x] API unit/check/E2E regression.

## Tasks

- [x] Reproduce and fix relational role-deletion failure.
- [x] Verify API deletion against a running local service.
- [x] Record approved behavior and resolve the legacy specification conflict.
- [x] Add a failing browser regression for missing success feedback.
- [x] Implement the role-deletion success toast.
- [x] Run focused and full Web validation.
- [x] Commit and open the feature PR to `dev`; independent review remains pending.

## Decisions and Work Log

- 2026-09-02: Confirmed the original delete failure was caused by remaining `user_roles` and `role_permissions` references.
- 2026-09-02: Implemented transaction order `user_roles` -> `role_permissions` -> `roles`; focused and full API tests passed.
- 2026-09-02: User verified deletion succeeds and requested a success toast.
- 2026-09-02: User explicitly skipped the requirements interview; accepted existing English copy and post-refresh timing.
- 2026-09-02: Browser regression first failed waiting for the missing toast, then passed after the minimal implementation. Web check, lint, production build, and diff checks pass with existing warnings only.
- 2026-09-02: Opened feature PR [#20](https://github.com/doremi31618/monorepo-system-template/pull/20) targeting `dev`.

## Handoff

- **Commit/PR**: `74da248` / [#20](https://github.com/doremi31618/monorepo-system-template/pull/20)
- **Branch/Worktree**: `feat/RBAC-001-role-delete-feedback` at `/Users/ericzhan/Documents/side-projects/monorepo-system-template-worktrees/RBAC-001-role-delete-feedback`
- **Validation**: API E2E/unit/check and live deletion smoke passed; Web browser regression, check, lint, production build, and diff checks passed. Web retains existing non-blocking warnings.
- **Known issues**: None currently known in scope.
- **Next action**: Complete independent review and CI before merging PR #20 into `dev`.
