<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    label,
    onclick,
    children,
  }: { label: string; onclick: () => void; children?: Snippet } = $props();
</script>

<button type="button" class="pt-icon-button" aria-label={label} title={label} {onclick}>
  {#if children}
    {@render children()}
  {:else}
    i
  {/if}
</button>
