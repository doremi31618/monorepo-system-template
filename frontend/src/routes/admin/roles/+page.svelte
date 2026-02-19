<script lang="ts">
  import { onMount } from 'svelte';
  import * as api from '$lib/api/admin';
  import RoleList from '$lib/features/admin-roles/components/RoleList.svelte';
  import PermissionMatrix from '../components/PermissionMatrix.svelte';
  import * as Sheet from '$lib/components/ui/sheet';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import type { Role, Permission } from '@share/contract';

  type RoleWithPermissions = Role & {
    rolePermissions?: Array<{ permission: { id: string } }>;
  };

  let roles: Role[] = [];
  
  // Edit/Create Sheet
  let showSheet = false;
  let isCreating = false;
  let currentRole: Partial<Role> = { name: '', description: '' };
  
  // Permissions State
  let allPermissions: Permission[] = [];
  let selectedPermissionIds: string[] = [];

  // Delete State
  let showDeleteDialog = false;
  let roleToDelete: Role | null = null;
  
  onMount(async () => {
    await loadInitialData();
  });

  async function loadInitialData() {
    const [roleRes, permRes] = await Promise.all([
        api.getRoles(),
        api.getPermissions()
    ]);
    roles = roleRes.data || [];
    allPermissions = permRes.data || [];
  }

  async function loadRoles() {
      const res = await api.getRoles();
      roles = res.data || [];
  }

  function openCreate() {
      currentRole = { name: '', description: '' };
      selectedPermissionIds = [];
      isCreating = true;
      showSheet = true;
  }

  function openEdit(role: Role) {
      currentRole = { ...role };
      isCreating = false;
      // Note: Ideally backend should return role permissions in the list or detail view
      // For now, assuming backend structure or re-fetching might be needed if not in list.
      // Based on previous code, `rolePermissions` was on the object.
      // We might need to cast or ensure backend returns it.
      // Let's assume the mapped type from API includes it or check.
      // If Types don't match, we might need to fetch detailed role.
      // For simplicity/speed, using as any cast similar to previous code if needed, 
      // but strictly we should have `RoleWithPermissions`.
      // Let's rely on what we have, or maybe fetch filtered permissions for this role if not present.
      // Checking old code: `role.rolePermissions.map...`.
      // If Shared Type `Role` doesn't have `rolePermissions`, we have a mismatch.
      // Shared `Role` only has basic fields.
      // We should probably check if `api.getRoles` returns enriched objects.
      
      const roleWithPermissions = role as RoleWithPermissions;
      selectedPermissionIds = roleWithPermissions.rolePermissions?.map((rp) => rp.permission.id) || [];
      showSheet = true;
  }

  function openDelete(role: Role) {
      roleToDelete = role;
      showDeleteDialog = true;
  }

  async function saveRole() {
      try {
          let saved: Role | null = null;
          if (isCreating) {
              const res = await api.createRole({
                  name: currentRole.name ?? '',
                  description: currentRole.description,
              });
              saved = res.data ?? null;
          } else {
              const res = await api.updateRole(currentRole.id!, currentRole);
              saved = res.data ?? null;
          }

          if (saved?.id) {
              await api.updateRolePermissions(saved.id, selectedPermissionIds);
          }
          await loadRoles();
          showSheet = false;
      } catch {
          alert('Failed to save role');
      }
  }

  async function confirmDelete() {
      if (roleToDelete) {
          try {
              await api.deleteRole(roleToDelete.id);
              await loadRoles();
          } catch {
              alert('Failed to delete role');
          } finally {
              showDeleteDialog = false;
              roleToDelete = null;
          }
      }
  }

</script>

<div class="p-4 md:p-8 max-w-7xl mx-auto w-full">
    <RoleList 
        {roles}
        oncreate={openCreate}
        onedit={openEdit}
        ondelete={openDelete}
    />
</div>

<!-- Edit Sheet -->
<Sheet.Root bind:open={showSheet}>
    <Sheet.Content class="w-full sm:max-w-xl overflow-y-auto">
      <Sheet.Header>
        <Sheet.Title>{isCreating ? 'Create Role' : 'Edit Role'}</Sheet.Title>
        <Sheet.Description>
          {isCreating ? 'Create a new role and assign permissions.' : 'Edit role details and permissions.'}
        </Sheet.Description>
      </Sheet.Header>
      
        <div class="grid gap-4 py-4">
            <div class="grid gap-2">
                <Label for="role-name">Name</Label>
                <Input id="role-name" bind:value={currentRole.name} placeholder="Role Name" />
            </div>
            <div class="grid gap-2">
                <Label for="role-desc">Description</Label>
                <Textarea id="role-desc" bind:value={currentRole.description} placeholder="Description" rows={3} />
            </div>
            
            <div class="pt-4">
                 <h3 class="mb-2 text-sm font-medium">Permissions</h3>
                 <div class="border rounded-md p-4 max-h-[400px] overflow-y-auto">
                     <PermissionMatrix 
                        {allPermissions}
                        {selectedPermissionIds}
                        onChange={(ids) => selectedPermissionIds = ids}
                    />
                 </div>
            </div>
        </div>
 
      <Sheet.Footer>
        <Button variant="outline" onclick={() => showSheet = false}>Cancel</Button>
        <Button onclick={saveRole}>Save changes</Button>
      </Sheet.Footer>
    </Sheet.Content>
</Sheet.Root>

<!-- Delete Dialog -->
<AlertDialog.Root open={showDeleteDialog} onOpenChange={(v) => showDeleteDialog = v}>
    <AlertDialog.Content>
      <AlertDialog.Header>
        <AlertDialog.Title>Delete Role?</AlertDialog.Title>
        <AlertDialog.Description>
          This will permanently delete the role <strong>{roleToDelete?.name}</strong>.
          Users assigned to this role may lose access.
        </AlertDialog.Description>
      </AlertDialog.Header>
      <AlertDialog.Footer>
        <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
        <AlertDialog.Action class="bg-destructive text-destructive-foreground hover:bg-destructive/90" onclick={confirmDelete}>
            Delete
        </AlertDialog.Action>
      </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
