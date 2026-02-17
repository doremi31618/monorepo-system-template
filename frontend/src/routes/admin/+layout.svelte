
<script lang="ts">
  import { LayoutDashboard, LogOut, Menu, Users, Shield, FileText, Image } from 'lucide-svelte';
  import {Button} from '$lib/components/ui/button/index.js';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import * as api from '$lib/api/admin';
  import { appRoutePath } from '$lib/config/route';

  import * as Sheet from '$lib/components/ui/sheet';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';

  let isCollapsed = false;
  let user: api.UserWithRoles | null = null;
  let isLoading = true;
  let isMobileMenuOpen = false;

  const menuItems = [
    { label: 'Dashboard', href: appRoutePath.admin.dashboard, icon: 'dashboard' },
    { label: 'Users', href: appRoutePath.admin.users, icon: 'users' },
    { label: 'Roles', href: appRoutePath.admin.roles, icon: 'shield' },
    { label: 'CMS', href: appRoutePath.admin.cms, icon: 'cms' },
    { label: 'Assets', href: appRoutePath.admin.assets, icon: 'assets' },
  ];

  function toggleSidebar() {
    isCollapsed = !isCollapsed;
  }

  async function handleLogout() {
    try {
      // Assuming generic auth api exists in separate module but not imported here
      // For now, simple redirect
      goto(appRoutePath.auth.login);
    } catch (error) {
      console.error('Logout failed', error);
      goto(appRoutePath.auth.login);
    }
  }

  onMount(async () => {
    try {
      const response = await api.getMe();
      user = response.data ?? null;
      if (!user) {
         throw new Error('Not authenticated');
      }
      
      const hasAdminRole = user.userRoles?.some(ur => ur.role.name === 'Administrator' || ur.role.id === 'admin');
      
      if (!hasAdminRole) {
          // Check for permissions if role check fails
          // const perms = await api.getMyPermissions(); // If we had this
          console.error('User is not an admin', user);
          alert('You do not have permission to access the admin panel.');
          goto(appRoutePath.base); // Redirect to home
      }
    } catch (e) {
      console.error('Admin Guard Failed', e);
      goto(appRoutePath.auth.login);
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
<div class="flex h-screen bg-background">
  <!-- Sidebar (Desktop) -->
  <aside 
    class="bg-card border-r shadow-none transition-all duration-300 ease-in-out flex-col hidden md:flex"
    class:w-64={!isCollapsed}
    class:w-20={isCollapsed}
  >
    <div class="p-4 border-b flex justify-between items-center h-16">
      {#if !isCollapsed}
        <h1 class="text-xl font-bold text-foreground truncate">Admin Panel</h1>
      {/if}
      <button 
        onclick={toggleSidebar}
        class="p-1 rounded hover:bg-muted text-muted-foreground"
        title={isCollapsed ? "Expand" : "Collapse"}
      >
        <Menu />
      </button>
    </div>
    <nav class="p-4 md:flex-1 hidden md:block overflow-y-auto ">
      <ul class="space-y-2">
        {#each menuItems as item}
          <li>
            <a
              href={item.href}
              class="flex items-center p-2 text-foreground/80 rounded hover:bg-muted hover:text-foreground transition-colors duration-200
                     {$page.url.pathname === item.href ? 'bg-muted font-semibold text-foreground' : ''}
                     {isCollapsed ? 'justify-center' : ''}"
              title={isCollapsed ? item.label : ''}
            >
              <!-- Icon placeholder (using generic symbols or Lucide if available) -->
              <span class="text-xl leading-none">
                 {#if item.icon === 'dashboard'} <LayoutDashboard />
                 {:else if item.icon === 'users'} <Users />
                 {:else if item.icon === 'shield'} <Shield />
                 {:else if item.icon === 'cms'} <FileText />
                 {:else if item.icon === 'assets'} <Image />
                 {/if}
              </span>
              
              {#if !isCollapsed}
                <span class="ml-3 truncate">{item.label}</span>
              {/if}
            </a>
          </li>
        {/each}
      </ul>
    </nav>
    <div class="p-4 border-t {isCollapsed ? 'flex flex-col items-center gap-4' : ''}">
      <div class="flex items-center gap-3 {isCollapsed ? 'mb-0 justify-center' : 'mb-3'}">
        <div class="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <Users class="size-4 text-muted-foreground" />
        </div>
        {#if !isCollapsed}
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-foreground truncate">Admin User</p>
          <p class="text-xs text-muted-foreground truncate">admin@company.com</p>
        </div>
        {/if}
      </div>
      <Button onclick={handleLogout} variant="ghost" class={isCollapsed ? "w-10 h-10 p-0 rounded-full flex items-center justify-center" : "w-full justify-start gap-2"}>
        <LogOut class="size-4" />
        {#if !isCollapsed}
        Logout
        {/if}
      </Button>
    </div>
    
    <!-- Logout in Sidebar Footer if collapsed, or just relying on header -->
  </aside>

  <!-- Main Content -->
  <div class="flex-1 flex flex-col overflow-hidden min-w-0">
    <!-- Header -->
    <header class="bg-card border-b p-4 flex justify-between items-center z-10 h-16">
      <div class="flex items-center gap-4">
        <Sheet.Root bind:open={isMobileMenuOpen}>
            <Sheet.Trigger>
                {#snippet child({ props })}
                    <Button {...props} variant="ghost" size="icon" class="md:hidden">
                        <Menu class="h-6 w-6" />
                    </Button>
                {/snippet}
            </Sheet.Trigger>
            <Sheet.Content side="left" class="w-64 p-0">
                <div class="flex flex-col h-full">
                    <div class="p-4 border-b h-16 flex items-center">
                        <h1 class="text-xl font-bold text-foreground">Admin Panel</h1>
                    </div>
                    <nav class="flex-1 overflow-y-auto p-4">
                        <ul class="space-y-2">
                            {#each menuItems as item}
                            <li>
                                <a
                                    href={item.href}
                                    class="flex items-center p-2 text-foreground/80 rounded hover:bg-muted hover:text-foreground transition-colors duration-200
                                            {$page.url.pathname === item.href ? 'bg-muted font-semibold text-foreground' : ''}"
                                    onclick={() => isMobileMenuOpen = false}
                                >
                                    <span class="text-xl leading-none">
                                        {#if item.icon === 'dashboard'} <LayoutDashboard />
                                        {:else if item.icon === 'users'} <Users />
                                        {:else if item.icon === 'shield'} <Shield />
                                        {:else if item.icon === 'cms'} <FileText />
                                        {:else if item.icon === 'assets'} <Image />
                                        {/if}
                                    </span>
                                    <span class="ml-3 truncate">{item.label}</span>
                                </a>
                            </li>
                            {/each}
                        </ul>
                    </nav>
                    <div class="p-4 border-t">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <Users class="size-4 text-muted-foreground" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-foreground truncate">Admin User</p>
                                <p class="text-xs text-muted-foreground truncate">admin@company.com</p>
                            </div>
                        </div>
                        <Button onclick={handleLogout} variant="ghost" class="w-full justify-start gap-2">
                            <LogOut class="size-4" />
                            登出
                        </Button>
                    </div>
                </div>
            </Sheet.Content>
        </Sheet.Root>
        <h2 class="text-lg font-semibold text-foreground truncate ml-2">
            {menuItems.find(i => i.href === $page.url.pathname)?.label || 'Admin'}
        </h2>
      </div>
      <div class="flex items-center space-x-4">
        <ThemeToggle />
      </div>
    </header>

    <!-- Page Content -->
    <main class="flex-1 overflow-auto p-6 relative">
      <slot />
    </main>
  </div>
</div>
{/if}
