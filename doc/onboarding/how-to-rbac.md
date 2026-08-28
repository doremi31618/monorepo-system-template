# How to Work with RBAC (Role-Based Access Control)

> **Last Updated**: 2026-01-26  
> **Purpose**: Complete guide for implementing and managing RBAC in the monorepo system.

---

## Table of Contents
1. [Overview](#overview)
2. [Adding a New Module](#adding-a-new-module)
3. [Adding Module Permissions](#adding-module-permissions)
4. [Adding Roles with Permissions](#adding-roles-with-permissions)
5. [Frontend Implementation](#frontend-implementation)
6. [Backend API Protection](#backend-api-protection)
7. [Testing & Verification](#testing--verification)

---

## Overview

Our RBAC system uses a **Single Source of Truth** approach:
- **Schema**: [`packages/contracts/src/lib/constants/permissions.ts`](../../packages/contracts/src/lib/constants/permissions.ts) defines all permission constants.
- **Config**: [`packages/config/src/access-control.config.ts`](../../packages/config/src/access-control.config.ts) derives permissions and role mappings from the schema.
- **Seeding**: Automatically runs on module init to sync DB with config.

### Key Components
- **PermissionSchema**: TypeScript constants (`PermissionSchema.Users.Read`)
- **@RequirePermissions**: Backend decorator for API protection
- **RBACGuard**: NestJS guard that enforces permissions
- **PermissionGuard.svelte**: Frontend component for conditional rendering

---

## 1. Adding a New Module

Let's add a **Blog** module with CRUD permissions.

### Step 1.1: Define Permission Schema

Edit [`packages/contracts/src/lib/constants/permissions.ts`](../../packages/contracts/src/lib/constants/permissions.ts):

```typescript
export const PermissionSchema = {
    Users: { /* existing */ },
    Roles: { /* existing */ },
    Permissions: { /* existing */ },
    
    // New Module: Blog
    Blog: {
        Read: 'blog.read',
        Create: 'blog.create',
        Update: 'blog.update',
        Delete: 'blog.delete',
        Publish: 'blog.publish',  // Custom action
    }
} as const;
```

> **Naming Convention**: `module.action` (e.g., `blog.publish`)

### Step 1.2: Rebuild Shared Package

```bash
cd packages/contracts
npm run build
```

---

## 2. Adding Module Permissions

### Step 2.1: Update Config

Edit [`packages/config/src/access-control.config.ts`](../../packages/config/src/access-control.config.ts):

```typescript
import { PermissionSchema } from '@packages/contracts';

const permissions = [
    // ... existing permissions ...
    
    // Blog Module
    { id: PermissionSchema.Blog.Read, module: 'blog', action: 'read', description: 'View blog posts' },
    { id: PermissionSchema.Blog.Create, module: 'blog', action: 'create', description: 'Create blog posts' },
    { id: PermissionSchema.Blog.Update, module: 'blog', action: 'update', description: 'Edit blog posts' },
    { id: PermissionSchema.Blog.Delete, module: 'blog', action: 'delete', description: 'Delete blog posts' },
    { id: PermissionSchema.Blog.Publish, module: 'blog', action: 'publish', description: 'Publish blog posts' },
];

export const ACCESS_CONTROL_CONFIG = {
    roles: [ /* existing roles */ ],
    permissions,
    rolePermissions: { /* will update next */ },
    rootAdmin: { /* existing */ }
};
```

### Step 2.2: Restart Backend

Permissions are auto-seeded on app startup:

```bash
cd backend
npm run start:dev
```

Check logs:
```
[AccessControlService] Creating Permissions...
[AccessControlService] Permissions seeded: blog.read, blog.create, ...
```

---

## 3. Adding Roles with Permissions

### Option A: Update Existing Roles

Edit the `rolePermissions` mapping in [`access-control.config.ts`](../../packages/config/src/access-control.config.ts):

```typescript
rolePermissions: {
    'admin': ['*'] as string[], // Admin has all permissions
    'user': [
        PermissionSchema.Users.Read,
        PermissionSchema.Blog.Read,  // Users can read blog
    ] as string[],
}
```

### Option B: Create New Role (e.g., "Editor")

```typescript
roles: [
    { id: 'admin', name: 'Administrator', description: 'Full access', isSystem: true },
    { id: 'user', name: 'User', description: 'Standard user', isSystem: true },
    { id: 'editor', name: 'Editor', description: 'Content manager', isSystem: false },
],

rolePermissions: {
    'admin': ['*'] as string[],
    'user': [PermissionSchema.Users.Read, PermissionSchema.Blog.Read] as string[],
    'editor': [
        PermissionSchema.Blog.Read,
        PermissionSchema.Blog.Create,
        PermissionSchema.Blog.Update,
        PermissionSchema.Blog.Publish,
    ] as string[],
}
```

Restart backend to seed new role:
```bash
npm run start:dev
```

---

## 4. Frontend Implementation

### 4.1 Conditional Rendering (Component-Level)

Use `PermissionGuard.svelte` to hide/show UI elements:

```svelte
<script lang="ts">
  import PermissionGuard from '$lib/components/admin/PermissionGuard.svelte';
  import { PermissionSchema } from '@packages/contracts';
  import { Button } from '$lib/components/ui/button';
</script>

<PermissionGuard permission={PermissionSchema.Blog.Create}>
  <Button onclick={createPost}>Create Post</Button>
</PermissionGuard>

<PermissionGuard permission={PermissionSchema.Blog.Delete}>
  <Button variant="destructive" onclick={deletePost}>Delete</Button>
</PermissionGuard>
```

**How it works**: `PermissionGuard` fetches user permissions from `/admin/me/permissions` and only renders children if the user has the required permission.

### 4.2 Route-Level Protection

Use SvelteKit's `+layout.ts` to protect admin routes in [`apps/web/src/routes/admin/+layout.ts`](../../apps/web/src/routes/admin/+layout.ts):

```typescript
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ fetch, parent }) => {
    try {
        const response = await fetch('/api/admin/me');
        if (!response.ok) {
            throw redirect(302, '/auth/login');
        }
        
        const { data: user } = await response.json();
        
        // Check if user has admin role
        const hasAdminRole = user.userRoles?.some(ur => ur.role.id === 'admin');
        if (!hasAdminRole) {
            throw redirect(302, '/');
        }
        
        return { user };
    } catch (e) {
        throw redirect(302, '/auth/login');
    }
};
```

> **Note**: Using `+layout.ts` provides server-side protection and runs before the page loads, preventing unauthorized access more securely than client-side `onMount`.

### 4.3 Navigation Menu (Permission-Based)

```svelte
<script lang="ts">
  import { PermissionSchema } from '@packages/contracts';
  import PermissionGuard from '$lib/components/admin/PermissionGuard.svelte';
</script>

<nav>
  <PermissionGuard permission={PermissionSchema.Users.Read}>
    <a href="/admin/users">Users</a>
  </PermissionGuard>
  
  <PermissionGuard permission={PermissionSchema.Blog.Read}>
    <a href="/admin/blog">Blog</a>
  </PermissionGuard>
</nav>
```

---

## 5. Backend API Protection

### 5.1 Protect Controller Endpoints

Example: `BlogController`

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RBACGuard } from '../access-control/rbac.guard';
import { RequirePermissions } from '../access-control/permissions.decorator';
import { PermissionSchema } from '@packages/contracts';

@Controller('blog')
@UseGuards(AuthGuard, RBACGuard)  // Apply guards
export class BlogController {

    @Get()
    @RequirePermissions(PermissionSchema.Blog.Read)
    async getPosts() {
        // Anyone with blog.read can view
        return this.blogService.findAll();
    }

    @Post()
    @RequirePermissions(PermissionSchema.Blog.Create)
    async createPost(@Body() dto: CreatePostDto) {
        // Only users with blog.create
        return this.blogService.create(dto);
    }

    @Put(':id/publish')
    @RequirePermissions(PermissionSchema.Blog.Publish)
    async publishPost(@Param('id') id: string) {
        // Only editors/admins with blog.publish
        return this.blogService.publish(id);
    }

    @Delete(':id')
    @RequirePermissions(PermissionSchema.Blog.Delete)
    async deletePost(@Param('id') id: string) {
        return this.blogService.delete(id);
    }
}
```

### 5.2 How Guards Work

1. **AuthGuard**: Verifies JWT token, attaches `req.user`.
2. **RBACGuard**: Reads `@RequirePermissions` metadata, queries user permissions via `AccessControlRepository`, returns `403` if unauthorized.

### 5.3 Multiple Permissions (OR Logic)

```typescript
@Post('draft')
@RequirePermissions(PermissionSchema.Blog.Create, PermissionSchema.Blog.Update)
async saveDraft() {
    // User needs EITHER blog.create OR blog.update
}
```

---

## 6. Testing & Verification

### 6.1 Check Seeded Permissions

Query DB or use Admin UI:

```bash
# Using Drizzle Studio
npx drizzle-kit studio

# Or via API
curl http://localhost:3000/admin/permissions \
  -H "Authorization: Bearer <TOKEN>"
```

### 6.2 Test API Protection

```bash
# As Admin (should succeed)
curl http://localhost:3000/blog \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# As User without blog.create (should fail 403)
curl -X POST http://localhost:3000/blog \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -d '{"title":"Test"}'
```

### 6.3 Frontend Testing

1. Login as different users (Admin, Editor, User)
2. Verify:
   - Navigation menu shows/hides based on permissions
   - Action buttons (Create, Delete) only appear for authorized users
   - Direct URL access to `/admin/blog` redirects if no permission

---

## 7. Best Practices

### ✅ DO
- **Always use `PermissionSchema`** constants instead of hardcoded strings (`PermissionSchema.Blog.Read` ✓ vs `'blog.read'` ✗)
- **Apply guards at controller level** (`@UseGuards(AuthGuard, RBACGuard)`)
- **Rebuild `packages/contracts`** after schema changes
- **Restart backend** after config changes to re-seed
- **Use descriptive permission names** (`blog.publish` is clearer than `blog.action3`)

### ❌ DON'T
- Don't hardcode permission strings in controllers/frontend
- Don't skip `@RequirePermissions` on sensitive endpoints
- Don't forget to add permissions to `ACCESS_CONTROL_CONFIG`
- Don't rely on frontend checks alone (always enforce on backend)

---

## 8. Common Patterns

### Pattern 1: Owner-Based Permissions (Future: ABAC)

```typescript
@Put('posts/:id')
@RequirePermissions(PermissionSchema.Blog.Update)
async updatePost(@Param('id') id: string, @Req() req) {
    const post = await this.blogService.findOne(id);
    
    // Custom logic: Only author or admin can edit
    if (post.authorId !== req.user.id && !req.user.isAdmin) {
        throw new ForbiddenException('Not the author');
    }
    
    return this.blogService.update(id, dto);
}
```

### Pattern 2: Conditional UI (Multiple Permissions)

```svelte
<script>
  import { PermissionSchema } from '@packages/contracts';
  let userPermissions = [...]; // from store or API
  
  $: canManageBlog = userPermissions.includes(PermissionSchema.Blog.Create) 
                  || userPermissions.includes(PermissionSchema.Blog.Update);
</script>

{#if canManageBlog}
  <Button>Manage Posts</Button>
{/if}
```

---

## 9. Troubleshooting

### Issue: `403 Forbidden` on API call
- **Check**: User has the required permission in DB (`user_roles` → `role_permissions`)
- **Check**: `@RequirePermissions` decorator is using correct schema constant
- **Check**: Guards are applied (`@UseGuards(AuthGuard, RBACGuard)`)

### Issue: Permission not appearing in UI
- **Check**: `packages/contracts` was rebuilt (`npm run build`)
- **Check**: Backend restarted to seed new permissions
- **Check**: User role includes the permission in `rolePermissions` config

### Issue: TS Error `PermissionSchema.X does not exist`
- **Solution**: Add to schema → rebuild `packages/contracts` → restart backend

---

## Summary

**RBAC Implementation Checklist**:
1. ✅ Define permissions in `PermissionSchema` (packages/contracts)
2. ✅ Add to `ACCESS_CONTROL_CONFIG.permissions` array
3. ✅ Assign to roles in `rolePermissions` mapping
4. ✅ Rebuild `packages/contracts` package
5. ✅ Restart backend (auto-seed)
6. ✅ Protect API with `@RequirePermissions(PermissionSchema.X.Y)`
7. ✅ Use `<PermissionGuard>` in frontend for conditional rendering
8. ✅ Test with different user roles

**Need Help?** Check existing implementations:
- Access Control Module: [`packages/access-control/src/access-control.controller.ts`](../../packages/access-control/src/access-control.controller.ts)
- Admin UI: [`apps/web/src/routes/admin/users/+page.svelte`](../../apps/web/src/routes/admin/users/+page.svelte)
