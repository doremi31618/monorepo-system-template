<script lang="ts">
	import { Ellipsis, Pencil, Trash2, Search, Plus } from 'lucide-svelte';
	import { Button } from '@platform/svelte-ui/button';
	import * as DropdownMenu from '@platform/svelte-ui/dropdown-menu';
	import { Badge } from '@platform/svelte-ui/badge';
	import type { UserWithRoles } from '@platform/types-identity';

	let {
		users = [],
		total = 0,
		page = 1,
		limit = 10,
		loading = false,
		onedit,
		ondelete,
		onpageChange
	} = $props<{
		users: UserWithRoles[];
		total: number;
		page: number;
		limit: number;
		loading: boolean;
		onedit?: (user: UserWithRoles) => void;
		ondelete?: (user: UserWithRoles) => void;
		onpageChange?: (page: number) => void;
	}>();

	function handleEdit(user: UserWithRoles) {
		onedit?.(user);
	}

	function handleDelete(user: UserWithRoles) {
		ondelete?.(user);
	}

	function handlePageChange(newPage: number) {
		onpageChange?.(newPage);
	}
</script>

<div class="space-y-4">
	<!-- Desktop Table View -->
	<div class="hidden rounded-md border md:block">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-muted/50 text-left text-muted-foreground">
					<tr>
						<th class="h-12 px-4 font-medium">Name</th>
						<th class="h-12 px-4 font-medium">Email</th>
						<th class="h-12 px-4 font-medium">Roles</th>
						<th class="h-12 px-4 text-right font-medium">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y">
					{#each users as user}
						<tr class="hover:bg-muted/50">
							<td class="flex items-center gap-3 p-4 font-medium">
								<div
									class="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary"
								>
									<span class="text-xs font-semibold">
										{user.name[0]?.toUpperCase()}
									</span>
								</div>
								{user.name}
							</td>
							<td class="p-4 text-muted-foreground">{user.email}</td>
							<td class="p-4">
								<div class="flex flex-wrap gap-1">
									{#if user.userRoles?.length > 0}
										{#each user.userRoles as ur}
											<Badge variant="outline">{ur.role.name}</Badge>
										{/each}
									{:else}
										<span class="text-xs text-muted-foreground italic">No roles</span>
									{/if}
								</div>
							</td>
							<td class="p-4 text-right">
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										{#snippet child({ props })}
											<Button {...props} variant="ghost" size="icon" class="size-8">
												<Ellipsis class="size-4" />
												<span class="sr-only">Actions</span>
											</Button>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end">
										<DropdownMenu.Item onclick={() => handleEdit(user)}>
											<Pencil class="mr-2 size-4" />
											Edit
										</DropdownMenu.Item>
										<DropdownMenu.Item
											class="text-destructive focus:text-destructive"
											onclick={() => handleDelete(user)}
										>
											<Trash2 class="mr-2 size-4" />
											Delete
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</td>
						</tr>
					{/each}
					{#if users.length === 0 && !loading}
						<tr>
							<td colspan="4" class="p-8 text-center text-muted-foreground"> No users found. </td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Mobile Card View -->
	<div class="grid gap-4 md:hidden">
		{#each users as user}
			<div class="flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
				<div class="flex items-start justify-between">
					<div class="flex items-center gap-3">
						<div
							class="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary"
						>
							<span class="text-sm font-semibold">
								{user.name[0]?.toUpperCase()}
							</span>
						</div>
						<div>
							<div class="font-semibold">{user.name}</div>
							<div class="text-sm text-muted-foreground">{user.email}</div>
						</div>
					</div>

					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="ghost" size="icon" class="-mt-2 -mr-2 size-8">
									<Ellipsis class="size-4" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end">
							<DropdownMenu.Item onclick={() => handleEdit(user)}>
								<Pencil class="mr-2 size-4" />
								Edit
							</DropdownMenu.Item>
							<DropdownMenu.Item
								class="text-destructive focus:text-destructive"
								onclick={() => handleDelete(user)}
							>
								<Trash2 class="mr-2 size-4" />
								Delete
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>

				<div class="mt-1 flex flex-wrap gap-1">
					{#if user.userRoles?.length > 0}
						{#each user.userRoles as ur}
							<Badge variant="secondary" class="text-xs">{ur.role.name}</Badge>
						{/each}
					{:else}
						<span class="text-xs text-muted-foreground italic">No roles</span>
					{/if}
				</div>
			</div>
		{/each}
		{#if users.length === 0 && !loading}
			<div class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
				No users found.
			</div>
		{/if}
	</div>

	<!-- Pagination -->
	{#if total > 0}
		<div class="flex items-center justify-between pt-4">
			<div class="text-sm text-muted-foreground">
				Page {page} of {Math.ceil(total / limit)}
			</div>
			<div class="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					onclick={() => handlePageChange(page - 1)}
					disabled={page <= 1 || loading}
				>
					Previous
				</Button>
				<Button
					variant="outline"
					size="sm"
					onclick={() => handlePageChange(page + 1)}
					disabled={page >= Math.ceil(total / limit) || loading}
				>
					Next
				</Button>
			</div>
		</div>
	{/if}
</div>
