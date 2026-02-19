<script lang="ts">
  import { onMount } from 'svelte';
  import * as api from '$lib/api/admin';
  import { resolve } from '$app/paths';
  import { page } from '$app/stores';
  import { Button } from '$lib/components/ui/button';
  import { Plus, Search } from 'lucide-svelte';
  import { Input } from '$lib/components/ui/input';
  import UserList from '$lib/features/admin-users/components/UserList.svelte';
  import UserForm from '$lib/features/admin-users/components/UserForm.svelte';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import type { UserWithRoles, Role } from '@share/contract';
  import type { CreateUserDto } from '$lib/api/admin';
  import { toast } from 'svelte-sonner';

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
  let currentPage = 1;
  // Delete Dialog State
  let showDeleteDialog = false;
  let userToDelete: UserWithRoles | null = null;
  const pageSize = 10;

  // Reactive params
  $: currentPage = Number($page.url.searchParams.get('page')) || 1;
  $: searchQuery = $page.url.searchParams.get('q') || '';

  async function loadUsers() {
    loading = true;
    try {
        const response = await api.getUsers({
            page: currentPage,
            limit: pageSize,
            q: searchQuery
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
  $: { if (currentPage || searchQuery) loadUsers(); }

  onMount(async () => {
      const res = await api.getRoles();
      roles = res.data || [];
  });

  // Handlers
  function handleSearch() {
      window.location.href = `${resolve('/admin/users')}?page=1&q=${encodeURIComponent(searchQuery)}`;
  }

  function handlePageChange(newPage: number) {
      window.location.href = `${resolve('/admin/users')}?page=${newPage}&q=${encodeURIComponent(searchQuery)}`;
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
			<div class="relative w-full sm:w-64">
                <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  class="pl-9 bg-background"
                  bind:value={searchQuery}
                  onkeydown={(e) => e.key === 'Enter' && handleSearch()}
                />
            </div>
            <Button onclick={openCreate}>
                <Plus class="mr-2 h-4 w-4" />
                Add User
            </Button>
        </div>
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
