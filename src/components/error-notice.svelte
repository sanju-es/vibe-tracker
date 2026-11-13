<script lang="ts">
  import { messages as m, t, type MessageKey } from "../lib/i18n";
  import type { ProjectError } from "../stores/index";
  import Icon from "./primitives/icon.svelte";

  let { error, onretry }: { error: ProjectError; onretry: () => void } = $props();

  const message = $derived(
    t(error.key as MessageKey, {
      path: error.path ?? "",
    }),
  );
</script>

<div class="pt-panel mx-auto w-full max-w-md p-5" role="alert">
  <p class="mb-2 flex items-center gap-2 font-semibold">
    <Icon name="TriangleAlert" size={16} class="text-[var(--pt-status-blocked)]" />
    <span>{m["error.title"]}</span>
  </p>
  <p class="mb-4 text-sm text-[var(--pt-muted)]">{message}</p>
  <button type="button" class="pt-button pt-button--primary" onclick={onretry}>
    <Icon name="RotateCcw" size={14} />
    <span>{m["error.retry"]}</span>
  </button>
</div>
