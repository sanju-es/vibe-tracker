<script lang="ts">
  import { projectStore } from "../../stores/index";
  import { messages as m } from "../../lib/i18n";

  let { path, alt, onclick }: { path: string; alt: string; onclick?: () => void } =
    $props();

  let url = $state<string | null>(null);
  let failed = $state(false);

  $effect(() => {
    const current = path;
    let active = true;
    url = null;
    failed = false;
    void projectStore.loadImage(current).then((value) => {
      if (!active) return;
      url = value;
      failed = value === null;
    });
    return () => {
      active = false;
    };
  });
</script>

{#if url}
  {#if onclick}
    <button
      type="button"
      class="block w-full cursor-zoom-in border-0 bg-transparent p-0"
      {onclick}
    >
      <img src={url} {alt} loading="lazy" />
    </button>
  {:else}
    <img src={url} {alt} loading="lazy" />
  {/if}
{:else if failed}
  <span class="text-sm text-[var(--pt-muted)]">
    {alt || m["document.imageAlt"].replace("{name}", path)} · {m["modal.missingImage"]}
  </span>
{:else}
  <span class="text-sm text-[var(--pt-muted)]" aria-busy="true">{alt || path}</span>
{/if}
