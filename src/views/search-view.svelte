<script lang="ts">
  import type { Project } from "../lib/model/types";
  import { documentIndex, searchProject } from "../lib/model/search";
  import { categoryLabelKey, messages as m, t } from "../lib/i18n";
  import { navigation, search } from "../stores/index";
  import Icon from "../components/primitives/icon.svelte";

  let { project }: { project: Project } = $props();

  let input = $state<HTMLInputElement | null>(null);

  $effect(() => {
    const request = search.focusRequest;
    if (request >= 0) input?.focus();
  });

  const hasQuery = $derived(search.query.trim() !== "");
  const index = $derived(documentIndex(project));
  const groups = $derived(searchProject(project, search.query));
  const resultCount = $derived(
    groups.reduce((total, group) => total + group.matches.length, 0),
  );

  function clear(): void {
    search.clear();
  }
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === "Escape") clear();
  }}
/>

<div class="pt-prose">
  <h1 class="mb-1">{m["search.title"]}</h1>
  <p class="mb-4 text-xs text-[var(--pt-muted)]">{project.name}</p>

  <label class="mb-4 flex flex-col gap-1 text-xs text-[var(--pt-muted)]">
    <span>{m["search.label"]}</span>
    <span class="relative">
      <Icon
        name="Search"
        size={15}
        class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[var(--pt-muted)]"
      />
      <input
        class="h-9 w-full rounded-lg border border-[var(--pt-border-control)] bg-[var(--pt-surface)] pl-8 pr-16 text-sm shadow-[var(--pt-shadow-sm)]"
        type="search"
        placeholder={m["search.placeholder"]}
        value={search.query}
        bind:this={input}
        oninput={(event) => {
          search.query = event.currentTarget.value;
        }}
      />
      {#if hasQuery}
        <button
          type="button"
          class="absolute right-1 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-[var(--pt-muted)] hover:bg-[var(--pt-surface-2)]"
          onclick={clear}
        >
          {m["search.clear"]}
        </button>
      {/if}
    </span>
  </label>

  {#if hasQuery && groups.length > 0}
    <p class="sr-only" aria-live="polite">
      {t("search.results", { count: resultCount })}
    </p>
  {/if}

  {#if project.documents.length === 0}
    <p class="text-sm text-[var(--pt-muted)]">{m["search.empty"]}</p>
  {:else if !hasQuery}
    <div class="space-y-4">
      {#each index as group (group.category)}
        <section>
          <h2 class="mb-1 text-sm font-semibold">
            {m[categoryLabelKey(group.category)]}
          </h2>
          <ul class="space-y-1">
            {#each group.documents as document (document.id)}
              <li>
                <button
                  type="button"
                  class="flex w-full flex-wrap items-baseline gap-2 rounded-md px-2 py-1 text-left hover:bg-[var(--pt-surface-2)]"
                  onclick={() => navigation.select(document.id)}
                >
                  <span class="text-sm">{document.title}</span>
                  <span class="font-mono text-[0.72rem] text-[var(--pt-muted)]">
                    {document.path}
                  </span>
                </button>
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    </div>
  {:else if groups.length === 0}
    <p class="text-sm text-[var(--pt-muted)]" aria-live="polite">
      {m["search.noResults"]}
    </p>
  {:else}
    <div class="space-y-5">
      {#each groups as group (group.documentId)}
        <section>
          <h2 class="mb-1 flex flex-wrap items-baseline gap-2 text-sm font-semibold">
            <span>{group.documentTitle}</span>
            <span class="font-mono text-[0.72rem] font-normal text-[var(--pt-muted)]">
              {group.moduleFolder ?? m[categoryLabelKey(group.category)]}
            </span>
          </h2>
          <ul class="space-y-1">
            {#each group.matches as match, index (index)}
              <li>
                <button
                  type="button"
                  class="w-full rounded-md px-2 py-1 text-left hover:bg-[var(--pt-surface-2)]"
                  onclick={() =>
                    navigation.select(match.documentId, match.anchor, match.rowId)}
                >
                  {#if match.sectionTitle}
                    <span class="block text-[0.72rem] text-[var(--pt-muted)]">
                      {match.sectionTitle}
                    </span>
                  {/if}
                  <span class="text-sm">
                    {match.before}<mark class="pt-search-mark">{match.match}</mark
                    >{match.after}
                  </span>
                </button>
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    </div>
  {/if}
</div>
