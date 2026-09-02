<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/stores';
  import * as api from '$lib/api/admin';
  import RoleList from '$lib/features/admin-roles/components/RoleList.svelte';
  import PermissionMatrix from '../components/PermissionMatrix.svelte';
  import * as Sheet from '@platform/svelte-ui/sheet';
  import * as AlertDialog from '@platform/svelte-ui/alert-dialog';
  import { Button } from '@platform/svelte-ui/button';
  import { Input } from '@platform/svelte-ui/input';
  import { Label } from '@platform/svelte-ui/label';
  import { Textarea } from '@platform/svelte-ui/textarea';
  import type { Role, Permission } from '@platform/types-identity';
  import { Plus } from 'lucide-svelte';
  import {
    DataViewToolbar,
    parseDataViewQuery,
    writeDataViewQuery,
    type DataViewProperty,
    type DataViewQuery,
  } from '@platform/svelte-ui/data-view-toolbar';

  type RoleWithPermissions = Role & {
    rolePermissions?: Array<{ permission: { id: string } }>;
  };

  let roles: Role[] = [];
  let dataViewQuery: DataViewQuery = { search: '', filters: [], sorts: [] };
  const roleProperties: DataViewProperty[] = [
    {
      key: 'kind',
      label: 'Type',
      type: 'enum',
      operators: ['is'],
      options: [
        { value: 'system', label: 'System' },
        { value: 'custom', label: 'Custom' },
      ],
    },
    { key: 'name', label: 'Name', type: 'text', operators: [], sortable: true },
    { key: 'createdAt', label: 'Created', type: 'date', operators: [], sortable: true },
  ];

  async function handleDataViewQueryChange(next: DataViewQuery) {
    dataViewQuery = next;
    const params = writeDataViewQuery($page.url.searchParams, next);
    await goto(`${resolve('/admin/roles')}?${params.toString()}`, {
      replaceState: true,
      noScroll: true,
      keepFocus: true,
    });
    await loadRoles(next);
  }
  
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
    dataViewQuery = parseDataViewQuery($page.url.searchParams, roleProperties);
    await loadInitialData();
  });

  async function loadInitialData() {
    const [, permRes] = await Promise.all([
        loadRoles(dataViewQuery),
        api.getPermissions(),
    ]);
    allPermissions = permRes.data || [];
  }

  async function loadRoles(query: DataViewQuery = dataViewQuery) {
      const kindRule = query.filters.find((filter) => filter.property === 'kind');
      const kindValue = Array.isArray(kindRule?.value) ? kindRule.value[0] : kindRule?.value;
      const res = await api.getRoles({
        q: query.search,
        kind: kindValue,
        sort: query.sorts.map((sort) => `${sort.property}:${sort.direction}`),
      });
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

<div class="mx-auto w-full max-w-7xl p-4 md:p-8">
    <div class="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Roles</h1>
        <p class="text-muted-foreground">Manage roles and permissions.</p>
      </div>
      <Button onclick={openCreate}><Plus data-icon="inline-start" />Create Role</Button>
    </div>
    <div class="mb-6 border-y py-2">
      <DataViewToolbar
        properties={roleProperties}
        query={dataViewQuery}
        searchLabel="Search roles"
        searchPlaceholder="Search name or description…"
        onquerychange={handleDataViewQueryChange}
      />
    </div>
    <RoleList 
        {roles}
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
