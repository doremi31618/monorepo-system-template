<script lang="ts">

    import { Plus, Search, Ellipsis, Pencil, Trash2, Key } from 'lucide-svelte';
    import { Button } from '@platform/ui/button';
    import * as DropdownMenu from '@platform/ui/dropdown-menu';
    import { Badge } from '@platform/ui/badge';
    import { Input } from '@platform/ui/input';
    import type { Role } from '@platform/contracts';

    let {
        roles = [],
        oncreate,
        onedit,
        ondelete
    } = $props<{
        roles: Role[];
        oncreate?: () => void;
        onedit?: (role: Role) => void;
        ondelete?: (role: Role) => void;
    }>();
    
    // const dispatch = createEventDispatcher(); // Deprecated
    
    let searchQuery = $state('');
    let filteredRoles = $derived.by(() => {
        if (!searchQuery) return [...roles];
        const q = searchQuery.toLowerCase();
        return roles.filter((r: Role) => 
            r.name.toLowerCase().includes(q) || 
            (r.description && r.description.toLowerCase().includes(q))
        );
    });

    function handleCreate() {
        oncreate?.();
    }

    function handleEdit(role: Role) {
        onedit?.(role);
    }

    function handleDelete(role: Role) {
        ondelete?.(role);
    }
</script>

<div class="space-y-6">
    <!-- Toolbar -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <h1 class="text-2xl font-bold tracking-tight">Roles</h1>
            <p class="text-muted-foreground">Manage roles and permissions.</p>
        </div>
        <div class="flex items-center gap-2">
            <div class="relative w-full sm:w-64">
                <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search roles..."
                  class="pl-9 bg-background"
                  bind:value={searchQuery}
                />
            </div>
            <Button onclick={handleCreate}>
                <Plus class="mr-2 h-4 w-4" />
                Create Role
            </Button>
        </div>
    </div>

    <!-- Grid Layout -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each filteredRoles as role}
        <div class="group relative flex flex-col justify-between rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
            <div class="p-6">
                 <div class="flex justify-between items-start">
                     <div class="space-y-1">
                         <div class="flex items-center gap-2">
                             <h3 class="font-semibold leading-none tracking-tight">{role.name}</h3>
                             {#if role.isSystem}
                                <Badge variant="secondary" class="text-xs">System</Badge>
                             {/if}
                         </div>
                         <p class="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                             {role.description || 'No description provided.'}
                         </p>
                     </div>
                     
                     <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                            {#snippet child({ props })}
                                <Button {...props} variant="ghost" size="icon" class="h-8 w-8 -mr-2">
                                    <span class="sr-only">Open menu</span>
                                    <Ellipsis class="h-4 w-4" />
                                </Button>
                            {/snippet}
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content align="end">
                            <DropdownMenu.Label>Actions</DropdownMenu.Label>
                            <DropdownMenu.Item 
								onclick={() => handleEdit(role)}
								disabled={role.isSystem}
							>
                                <Pencil class="mr-2 h-4 w-4" />
                                Edit & Permissions
                            </DropdownMenu.Item>
                            <DropdownMenu.Item 
                                onclick={() => handleDelete(role)}
                                disabled={role.isSystem}
                                class="text-destructive focus:text-destructive disabled:opacity-50"
                            >
                                <Trash2 class="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                 </div>
            </div>
            <div class="p-4 pt-0 mt-auto">
                 <Button variant="outline" class="w-full" onclick={() => handleEdit(role)} disabled={role.isSystem}>
                    <Key class="mr-2 h-3.5 w-3.5" />
                    Manage Permissions
                 </Button>
            </div>
        </div>
        {/each}
        
        {#if filteredRoles.length === 0}
            <div class="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                 No roles found matching "{searchQuery}".
            </div>
        {/if}
    </div>
</div>
