<script lang="ts">
  import { messages as m } from "../lib/i18n";
  import { projectStore } from "../stores/index";
  import Icon from "../components/primitives/icon.svelte";
</script>

<main class="flex min-h-screen flex-col items-center justify-center gap-5 p-6">
  <header class="text-center">
    <h1 class="text-2xl font-semibold">{m["app.title"]}</h1>
    <p class="text-sm text-[var(--pt-muted)]">{m["app.tagline"]}</p>
  </header>

  <section class="pt-panel w-full max-w-md p-6 text-center">
    <span
      class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--pt-accent-soft)] text-[var(--pt-accent-strong)]"
    >
      <Icon name="FolderOpen" size={24} />
    </span>
    <h2 class="mb-1 text-lg font-semibold">{m["empty.title"]}</h2>
    <p class="mb-4 text-sm text-[var(--pt-muted)]">{m["info.folders"]}</p>
    <button
      type="button"
      class="pt-button pt-button--primary"
      onclick={() => void projectStore.openFolder()}
    >
      <Icon name="FolderOpen" size={15} />
      <span>{m["empty.action"]}</span>
    </button>
    <p class="mt-4 text-xs text-[var(--pt-muted)]">{m["info.disclaimer"]}</p>
    <p class="mt-2 text-xs text-[var(--pt-muted)]">
      {m["info.madeBy"]} ·
      <a
        class="break-all text-[var(--pt-accent-strong)] underline underline-offset-2"
        href={m["info.github"]}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={m["info.githubLabel"]}
      >
        {m["info.githubLink"]}
      </a>
    </p>
  </section>
</main>
