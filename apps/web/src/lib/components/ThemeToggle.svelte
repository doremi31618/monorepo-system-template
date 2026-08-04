<script lang="ts">
  import { toggleMode, mode } from 'mode-watcher';
  import { Sun, Moon } from 'lucide-svelte';
  import { Button } from '@platform/ui/button';
</script>

<Button variant="ghost" size="icon" onclick={toggleMode}>
  <Sun
    class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
  />
  <Moon
    class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
  />
  <span class="sr-only">Toggle theme</span>
</Button>
