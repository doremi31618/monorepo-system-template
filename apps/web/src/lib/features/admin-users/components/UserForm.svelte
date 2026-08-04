<script lang="ts">

    import { Button } from '@platform/ui/button';
    import * as Sheet from '@platform/ui/sheet';
    import { Input } from '@platform/ui/input';
    import { Label } from '@platform/ui/label';
    import { Select, SelectTrigger, SelectContent, SelectItem } from '@platform/ui/select';
    import type { Role } from '@platform/contracts';
    
    // Props
    let { 
        open = $bindable(false),
        isCreating = $bindable(false),
        initialData = { name: '', email: '', roleIds: [] as string[], password: '' },
        roles = [],
        loading = false,
        onsubmit
    } = $props();
    
    // const dispatch = createEventDispatcher(); 
    
    let formData = $state({ ...initialData });
    
    // Reset form when opening/mode changes
    $effect(() => {
        if (open) {
            formData = { ...initialData };
        }
    });

    function handleSubmit() {
        onsubmit?.(formData);
    }
</script>

<Sheet.Root bind:open>
    <Sheet.Content class="w-full sm:max-w-xl overflow-y-auto">
        <Sheet.Header>
            <Sheet.Title>{isCreating ? 'Create User' : 'Edit User'}</Sheet.Title>
            <Sheet.Description>
                {isCreating ? 'Add a new user to the system.' : 'Make changes to the user profile here.'}
            </Sheet.Description>
        </Sheet.Header>
        
        <div class="grid gap-4 py-4">
            <div class="grid gap-2">
                <Label for="name">Name</Label>
                <Input id="name" bind:value={formData.name} placeholder="John Doe" />
            </div>
            
            <div class="grid gap-2">
                <Label for="email">Email</Label>
                <Input id="email" type="email" bind:value={formData.email} placeholder="john@example.com" />
            </div>

            {#if isCreating}
            <div class="grid gap-2">
                <Label for="password">Password</Label>
                <Input id="password" type="password" bind:value={formData.password} placeholder="••••••••" required />
            </div>
            {/if}
            
            <div class="grid gap-2">
                <Label>Roles (Multiple Selection)</Label>
                <div class="border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto">
                    {#each roles as role}
                        <label class="flex items-center space-x-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                value={role.id} 
                                checked={formData.roleIds?.includes(role.id)}
                                onchange={(e) => {
                                    const checked = e.currentTarget.checked;
                                    if (checked) {
                                        formData.roleIds = [...(formData.roleIds || []), role.id];
                                    } else {
                                        formData.roleIds = formData.roleIds?.filter((id: string) => id !== role.id) || [];
                                    }
                                }}
                                class="rounded border-gray-300"
                            />
                            <span class="text-sm">{role.name}</span>
                        </label>
                    {/each}
                </div>
            </div>
        </div>
        
        <Sheet.Footer>
            <Button variant="outline" onclick={() => open = false}>Cancel</Button>
            <Button onclick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : 'Save changes'}
            </Button>
        </Sheet.Footer>
    </Sheet.Content>
</Sheet.Root>
