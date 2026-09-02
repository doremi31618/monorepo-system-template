<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import * as api from '$lib/api/admin';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { appRoutePath } from '$lib/config/route';
	import { Button } from '@platform/svelte-ui/button';
	import * as Sidebar from '@platform/svelte-ui/sidebar';
	import { FileText, Image, LayoutDashboard, LogOut, Shield, Users } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let { children } = $props();
	let user: api.UserWithRoles | null = null;
	let isLoading = $state(true);
	let sidebarOpen = $state(true);
	let sidebarMobileOpen = $state(false);

	const menuItems = [
		{ label: 'Dashboard', href: appRoutePath.admin.dashboard, icon: 'dashboard' },
		{ label: 'Users', href: appRoutePath.admin.users, icon: 'users' },
		{ label: 'Roles', href: appRoutePath.admin.roles, icon: 'shield' },
		{ label: 'CMS', href: appRoutePath.admin.cms, icon: 'cms' },
		{ label: 'Assets', href: appRoutePath.admin.assets, icon: 'assets' }
	];

	async function handleLogout() {
		try {
			await goto(appRoutePath.auth.login);
		} catch (error) {
			console.error('Logout failed', error);
			await goto(appRoutePath.auth.login);
		}
	}

	onMount(async () => {
		try {
			const response = await api.getMe();
			user = response.data ?? null;
			if (!user) {
				throw new Error('Not authenticated');
			}

			const hasAdminRole = user.userRoles?.some(
				(userRole) => userRole.role.name === 'Administrator' || userRole.role.id === 'admin'
			);

			if (!hasAdminRole) {
				console.error('User is not an admin', user);
				alert('You do not have permission to access the admin panel.');
				await goto(appRoutePath.base);
			}
		} catch (error) {
			console.error('Admin Guard Failed', error);
			await goto(appRoutePath.auth.login);
		} finally {
			isLoading = false;
		}
	});
</script>

{#if isLoading}
	<div class="flex h-screen items-center justify-center">
		<div class="text-muted-foreground">Loading Admin Panel...</div>
	</div>
{:else}
	<Sidebar.Provider bind:open={sidebarOpen} bind:openMobile={sidebarMobileOpen}>
		<Sidebar.Root collapsible="offcanvas">
			<Sidebar.Header class="h-16 flex-row items-center justify-between border-b p-4">
				<h1 class="truncate text-xl font-bold">Admin Panel</h1>
				<Sidebar.Trigger aria-label="Collapse sidebar" />
			</Sidebar.Header>

			<Sidebar.Content>
				<Sidebar.Group>
					<Sidebar.GroupLabel>Administration</Sidebar.GroupLabel>
					<Sidebar.GroupContent>
						<Sidebar.Menu>
							{#each menuItems as item (item.href)}
								<Sidebar.MenuItem>
									<Sidebar.MenuButton isActive={$page.url.pathname === item.href}>
										{#snippet child({ props })}
											<a
												{...props}
												href={item.href}
												aria-current={$page.url.pathname === item.href ? 'page' : undefined}
												onclick={() => (sidebarMobileOpen = false)}
											>
												{#if item.icon === 'dashboard'}
													<LayoutDashboard />
												{:else if item.icon === 'users'}
													<Users />
												{:else if item.icon === 'shield'}
													<Shield />
												{:else if item.icon === 'cms'}
													<FileText />
												{:else if item.icon === 'assets'}
													<Image />
												{/if}
												<span>{item.label}</span>
											</a>
										{/snippet}
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
							{/each}
						</Sidebar.Menu>
					</Sidebar.GroupContent>
				</Sidebar.Group>
			</Sidebar.Content>

			<Sidebar.Footer class="border-t p-4">
				<div class="flex items-center gap-3">
					<div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
						<Users />
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">Admin User</p>
						<p class="truncate text-xs text-muted-foreground">admin@company.com</p>
					</div>
				</div>
				<Button onclick={handleLogout} variant="ghost" class="justify-start">
					<LogOut data-icon="inline-start" />
					Logout
				</Button>
			</Sidebar.Footer>

			<Sidebar.Rail />
		</Sidebar.Root>

		<Sidebar.Inset class="h-svh min-w-0 overflow-hidden">
			<header class="flex h-16 items-center justify-between gap-4 border-b bg-card p-4">
				<div class="flex min-w-0 items-center gap-4">
					<Sidebar.Trigger
						class={sidebarOpen ? 'md:hidden' : undefined}
						aria-label={sidebarOpen ? 'Open navigation' : 'Expand sidebar'}
					/>
					<h2 class="truncate text-lg font-semibold">
						{menuItems.find((item) => item.href === $page.url.pathname)?.label ?? 'Admin'}
					</h2>
				</div>
				<ThemeToggle />
			</header>

			<main class="relative flex-1 overflow-auto p-6">
				{@render children?.()}
			</main>
		</Sidebar.Inset>
	</Sidebar.Provider>
{/if}
