<script lang="ts">
  import type { Permission } from '$lib/api/admin';
  import * as Accordion from '@platform/svelte-ui/accordion';

  export let allPermissions: Permission[] = [];
  export let selectedPermissionIds: string[] = [];
  export let onChange: (selectedIds: string[]) => void;

  // Group permissions by module
  $: groupedPermissions = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  function togglePermission(id: string) {
    if (selectedPermissionIds.includes(id)) {
      selectedPermissionIds = selectedPermissionIds.filter(p => p !== id);
    } else {
      selectedPermissionIds = [...selectedPermissionIds, id];
    }
    onChange(selectedPermissionIds);
  }

  function toggleModule(moduleName: string) {
    const modulePerms = groupedPermissions[moduleName].map((p: any) => p.id);
    const allSelected = modulePerms.every((id: string) => selectedPermissionIds.includes(id));
    
    if (allSelected) {
      selectedPermissionIds = selectedPermissionIds.filter(id => !modulePerms.includes(id));
    } else {
      selectedPermissionIds = [...new Set([...selectedPermissionIds, ...modulePerms])];
    }
    onChange(selectedPermissionIds);
  }
</script>

<div class="space-y-2">
  <Accordion.Root type="multiple" class="w-full">
    {#each Object.entries(groupedPermissions) as [moduleName, permissions] (moduleName)}
        <Accordion.Item value={moduleName}>
            <Accordion.Trigger class="hover:no-underline hover:bg-muted/50 px-2 rounded">
                 <span class="text-sm font-bold uppercase text-foreground">{moduleName}</span>
            </Accordion.Trigger>
            <Accordion.Content class="px-2 pt-2 pb-4">
                 <div class="flex justify-end mb-2">
                    <button 
                      onclick={() => toggleModule(moduleName)}
                      class="text-xs text-primary hover:text-primary/90 font-medium"
                    >
                      Toggle All in {moduleName}
                    </button>
                 </div>
                 <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {#each permissions as perm}
                      <label class="flex items-start space-x-2 cursor-pointer p-2 hover:bg-muted/50 rounded border border-transparent hover:border-border transition-colors">
                        <input 
                          type="checkbox" 
                          checked={selectedPermissionIds.includes(perm.id)}
                          onchange={() => togglePermission(perm.id)}
                          class="mt-0.5 rounded text-primary focus:ring-primary"
                        />
                        <div class="flex flex-col">
                          <span class="text-sm font-medium text-foreground">{perm.action}</span>
                          <span class="text-xs text-muted-foreground">{perm.description}</span>
                        </div>
                      </label>
                    {/each}
                 </div>
            </Accordion.Content>
        </Accordion.Item>
    {/each}
  </Accordion.Root>
</div>
