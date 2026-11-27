import type { Component } from 'svelte';

/** One entry of the shared More menu. Consumers own the callback and the permission check. */
export interface NotionCommand {
  key: string;
  label: string;
  icon?: Component;
  disabled?: boolean;
  onselect: () => void;
}
