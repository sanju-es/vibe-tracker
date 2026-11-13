<script lang="ts">
  import { messages as m } from "../lib/i18n";
  import Icon from "./primitives/icon.svelte";

  let {
    done,
    total,
    warning,
    oncancel,
  }: { done: number; total: number; warning: boolean; oncancel: () => void } = $props();

  const percent = $derived(total > 0 ? Math.round((done / total) * 100) : 0);
</script>

<div class="pt-panel mx-auto w-full max-w-md p-5" aria-live="polite">
  <p class="mb-3 flex items-center gap-2 font-semibold">
    <Icon name="LoaderCircle" size={16} class="pt-spin text-[var(--pt-accent)]" />
    <span>{m["scan.title"]}</span>
  </p>
  <div class="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--pt-surface-3)]">
    <div
      class="h-full rounded-full bg-[var(--pt-accent)] transition-all"
      style:width={`${percent}%`}
    ></div>
  </div>
  <p class="mb-3 text-sm text-[var(--pt-muted)]">
    {m["scan.progress"].replace("{done}", String(done)).replace("{total}", String(total))}
  </p>
  {#if warning}
    <p class="mb-3 text-sm text-[var(--pt-muted)]">{m["scan.warning"]}</p>
  {/if}
  <button type="button" class="pt-button" onclick={oncancel}>
    <Icon name="X" size={13} />
    <span>{m["scan.cancel"]}</span>
  </button>
</div>
