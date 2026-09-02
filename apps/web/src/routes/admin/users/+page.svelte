<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import * as api from '$lib/api/admin';
  import { resolve } from '$app/paths';
  import { page } from '$app/stores';
  import { Button } from '@platform/svelte-ui/button';
  import { Plus } from 'lucide-svelte';
  import UserList from '$lib/features/admin-users/components/UserList.svelte';
  import UserForm from '$lib/features/admin-users/components/UserForm.svelte';
  import * as AlertDialog from '@platform/svelte-ui/alert-dialog';
  import type { UserWithRoles, Role } from '@platform/types-identity';
  import type { CreateUserDto } from '$lib/api/admin';
  import { toast } from 'svelte-sonner';
  import {
    DataViewToolbar,
    parseDataViewQuery,
    writeDataViewQuery,
    type DataViewProperty,
    type DataViewQuery,
  } from '@platform/svelte-ui/data-view-toolbar';

  // State
  let users: UserWithRoles[] = [];
  let roles: Role[] = [];
  let totalUsers = 0;
  let loading = false;
  
  // Sheet State
  let showSheet = false;
  let isCreating = false;
  let currentUser: UserWithRoles | null = null;
  let initialFormData: CreateUserDto & { roleIds: string[] } = { name: '', email: '', roleIds: [], password: '' };

  // Query Params
  let searchQuery = '';
  let dataViewQuery: DataViewQuery = { search: '', filters: [], sorts: [] };
  let querySignature = '';
  let userProperties: DataViewProperty[] = [];
  let currentPage = 1;
  // Delete Dialog State
  let showDeleteDialog = false;
  let userToDelete: UserWithRoles | null = null;
  const pageSize = 10;

  // Reactive params
  $: currentPage = Number($page.url.searchParams.get('page')) || 1;
  $: userProperties = [
    {
      key: 'roleId',
      label: 'Role',
      type: 'relation',
      operators: ['isAnyOf'],
      options: roles.map((role) => ({ value: role.id, label: role.name })),
    },
    { key: 'name', label: 'Name', type: 'text', operators: [], sortable: true },
    { key: 'email', label: 'Email', type: 'text', operators: [], sortable: true },
    { key: 'createdAt', label: 'Created', type: 'date', operators: [], sortable: true },
  ];
  $: dataViewQuery = parseDataViewQuery($page.url.searchParams, userProperties);
  $: searchQuery = dataViewQuery.search;
  $: querySignature = JSON.stringify(dataViewQuery);

  async function loadUsers() {
    loading = true;
    try {
        const response = await api.getUsers({
            page: currentPage,
            limit: pageSize,
            q: searchQuery,
            roleId: dataViewQuery.filters
              .filter((filter) => filter.property === 'roleId')
              .flatMap((filter) => Array.isArray(filter.value) ? filter.value : [filter.value]),
            sort: dataViewQuery.sorts.map((sort) => `${sort.property}:${sort.direction}`),
        });
        
        // Handle ApiResponse wrapper
        const result = response.data;
        
        if (result && 'data' in result && 'meta' in result) {
            users = result.data;
            totalUsers = result.meta.total;
        } else if (Array.isArray(result)) {
             // Fallback if API returns array directly in data
             users = result;
             totalUsers = users.length;
        } else {
             // Fallback if API hasn't deployed or type mismatch at runtime
             console.warn('API returned unexpected format');
             // Try assuming response is array if nothing else matches
             if (Array.isArray(response)) {
                 users = response;
                 totalUsers = users.length;
             }
        }
    } catch (e) {
        console.error('Failed to load users', e);
    } finally {
        loading = false;
    }
  }

  // Reload when params change
  $: { if (currentPage || querySignature) loadUsers(); }

  onMount(async () => {
      const res = await api.getRoles();
      roles = res.data || [];
  });

  // Handlers
  async function handleDataViewQueryChange(next: DataViewQuery) {
      const params = writeDataViewQuery($page.url.searchParams, next);
      await goto(`${resolve('/admin/users')}?${params.toString()}`, {
        replaceState: true,
        noScroll: true,
        keepFocus: true,
      });
  }

  async function handlePageChange(newPage: number) {
      const params = writeDataViewQuery($page.url.searchParams, dataViewQuery);
      params.set('page', String(newPage));
      await goto(`${resolve('/admin/users')}?${params.toString()}`, {
        noScroll: true,
        keepFocus: true,
      });
  }

  function openCreate() {
      isCreating = true;
      currentUser = null;
      initialFormData = { name: '', email: '', roleIds: [], password: '' };
      showSheet = true;
  }

  function openEdit(user: UserWithRoles) {
      isCreating = false;
      currentUser = user;
      // Extract all user role IDs
      const currentRoleIds = user.userRoles?.map(ur => ur.role.id) || [];
      initialFormData = { name: currentUser.name, email: currentUser.email, roleIds: currentRoleIds, password: '' };
      showSheet = true;
  }

  function openDelete(user: UserWithRoles) {
      userToDelete = user;
      showDeleteDialog = true;
  }

  async function confirmDelete() {
      if (!userToDelete) return;
      
      try {
          await api.deleteUser(userToDelete.id);
          toast.success('User deleted successfully');
          loadUsers();
      } catch {
          toast.error('Failed to delete user');
      } finally {
          showDeleteDialog = false;
          userToDelete = null;
      }
  }

  async function handleDelete(user: UserWithRoles) {
      // Deprecated in favor of openDelete
      openDelete(user);
  }

  async function handleSubmit(data: CreateUserDto & { roleIds: string[] }) {
      loading = true;
      try {
          if (isCreating) {
               await api.createUser({
                   name: data.name,
                   email: data.email,
                   password: data.password,
                   roleIds: data.roleIds
               });
          } else if (currentUser) {
                await api.updateUser(currentUser.id, {
                    name: data.name,
                    email: data.email,
                    roleIds: data.roleIds
                });
          }
          showSheet = false;
          loadUsers();
          toast.success(isCreating ? 'User created' : 'User updated');
      } catch(error: unknown) {
          console.error(error);
          const message = error instanceof Error ? error.message : 'Operation failed';
          toast.error(message);
      } finally {
          loading = false;
      }
  }

</script>

<div class="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <h1 class="text-2xl font-bold tracking-tight">Users</h1>
            <p class="text-muted-foreground">Manage users and their roles.</p>
        </div>
        <div class="flex items-center gap-2">
            <Button onclick={openCreate}>
                <Plus data-icon="inline-start" />
                Add User
            </Button>
        </div>
    </div>

    <div class="border-y py-2">
      <DataViewToolbar
        properties={userProperties}
        query={dataViewQuery}
        searchLabel="Search users"
        searchPlaceholder="Search name or email…"
        onquerychange={handleDataViewQueryChange}
      />
    </div>
    
    <!-- Content -->
    <UserList 
        {users} 
        total={totalUsers} 
        page={currentPage} 
        limit={pageSize} 
        {loading} 
        onedit={openEdit}
        ondelete={handleDelete}
        onpageChange={handlePageChange}
    />
    
    <UserForm
        bind:open={showSheet}
        {isCreating}
        initialData={initialFormData}
        {roles}
        {loading}
        onsubmit={handleSubmit}
    />
    
    <AlertDialog.Root open={showDeleteDialog} onOpenChange={(v) => showDeleteDialog = v}>
        <AlertDialog.Content>
            <AlertDialog.Header>
                <AlertDialog.Title>Delete User?</AlertDialog.Title>
                <AlertDialog.Description>
                    This will permanently delete user <strong>{userToDelete?.name}</strong>.
                    This action cannot be undone.
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
</div>
