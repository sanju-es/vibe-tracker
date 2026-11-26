<script lang="ts">
  import type { WorkspaceProject } from "../lib/workspace/types";
  import { projectStore } from "../stores/index";
  import { messages as m, t } from "../lib/i18n";
  import ProjectContents from "./project-contents.svelte";
  import Icon from "./primitives/icon.svelte";

  let {
    projects,
    activeId,
    activeDocumentId,
    onselectdocument,
    onopenmodule,
    onopenmodules,
    onshowportfolio,
  }: {
    projects: WorkspaceProject[];
    activeId: string | null;
    activeDocumentId: string | null;
    onselectdocument: (projectId: string, documentId: string) => void;
    onopenmodule: (projectId: string, moduleNumber: number) => void;
    onopenmodules: (projectId: string) => void;
    onshowportfolio: () => void;
  } = $props();
</script>

<section class="mb-4 border-b border-[var(--pt-border)] pb-3">
  <button
    type="button"
    class="flex w-full items-center gap-2 rounded-md px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-wider hover:bg-[var(--pt-surface-2)]"
    class:text-[var(--pt-accent-strong)]={activeId === null}
    class:text-[var(--pt-muted)]={activeId !== null}
    aria-current={activeId === null ? "page" : undefined}
    onclick={onshowportfolio}
  >
    <Icon name="LayoutGrid" size={14} />
    <span class="flex-1 text-left">{m["workspace.title"]}</span>
    <span class="text-[var(--pt-muted)]">{projects.length}</span>
  </button>

  <ul class="mt-0.5 space-y-px">
    {#each projects as entry (entry.id)}
      <li>
        <div class="flex items-center gap-0.5">
          <button
            type="button"
            class="rounded p-1 text-[var(--pt-muted)] hover:bg-[var(--pt-surface-2)]"
            aria-expanded={projectStore.isProjectExpanded(entry.id)}
            aria-label={t("workspace.toggleProject", { name: entry.name })}
            title={t("workspace.toggleProject", { name: entry.name })}
            onclick={() => projectStore.toggleProject(entry.id)}
          >
            <Icon
              name={projectStore.isProjectExpanded(entry.id)
                ? "ChevronDown"
                : "ChevronRight"}
              size={13}
            />
          </button>
          <button
            type="button"
            class="pt-nav-item min-w-0 flex-1 text-[0.8125rem]"
            aria-current={entry.id === activeId ? "page" : undefined}
            onclick={() => projectStore.activateProject(entry.id)}
          >
            <Icon name="Folder" size={13} class="shrink-0 text-[var(--pt-muted)]" />
            <span class="min-w-0 flex-1 truncate">{entry.name}</span>
            {#if entry.summary}
              <span class="shrink-0 text-[0.6875rem] text-[var(--pt-muted)]">
                {entry.summary.progress.tested}/{entry.summary.progress.total}
              </span>
            {/if}
          </button>
        </div>

        {#if projectStore.isProjectExpanded(entry.id) && entry.project}
          <div class="ml-3 border-l border-[var(--pt-border)] pl-2">
            <ProjectContents
              project={entry.project}
              active={entry.id === activeId}
              activeDocumentId={entry.id === activeId ? activeDocumentId : null}
              onselect={(documentId) => onselectdocument(entry.id, documentId)}
              onopenmodule={(moduleNumber) => onopenmodule(entry.id, moduleNumber)}
              onopenmodules={() => onopenmodules(entry.id)}
            />
          </div>
        {/if}
      </li>
    {/each}
  </ul>
</section>
