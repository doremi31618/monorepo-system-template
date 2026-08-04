<script lang="ts">
  import { permissionStore } from '$lib/store/permissionStore';

  export let permission: string;

  // Reactive check
  $: hasPermission = $permissionStore.isLoaded && permissionStore.hasPermission(permission);
</script>

{#if hasPermission}
  <slot />
{/if}
