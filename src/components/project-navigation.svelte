<script lang="ts">
  import type { Document, Project } from "../lib/model/types";
  import { CATEGORY_ORDER, moduleFolderName } from "../lib/model/categories";
  import { mapStatus } from "../lib/semantics/status";
  import { categoryLabelKey, statusLabelKey, messages } from "../lib/i18n";
  import { navigation } from "../stores/index";
  import ModuleStatusIcon from "./primitives/module-status-icon.svelte";
  import Icon from "./primitives/icon.svelte";

  let {
    project,
    activeDocumentId,
    onselect,
    onopenmodules,
    onopenmodule,
  }: {
    project: Project;
    activeDocumentId: string | null;
    onselect: (documentId: string) => void;
    onopenmodules: () => void;
    onopenmodule: (moduleNumber: number) => void;
  } = $props();

  const m = messages;

  interface Entry {
    document: Document;
    label: string;
  }

  function order(documents: Document[]): Document[] {
    return [...documents].sort(
      (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
    );
  }

  /**
   * A document is shown by its file name. When the same name appears more than
   * once in the same list, the folder is added so both entries can be told apart.
   */
  function entries(documents: Document[]): Entry[] {
    return order(documents).map((document) => {
      const repeated =
        documents.filter((other) => other.fileName === document.fileName).length > 1;
      return {
        document,
        label: repeated ? document.path : document.fileName,
      };
    });
  }

  function folderName(number: number, slug: string, name: string): string {
    return moduleFolderName(number, slug, name);
  }

  const projectEntries = $derived(
    entries(
      project.documents.filter((d) => d.scope === "project" && d.category !== "other"),
    ),
  );
  const otherEntries = $derived(
    entries(
      project.documents.filter((d) => d.scope === "project" && d.category === "other"),
    ),
  );
  const modules = $derived(
    project.modules.map((module) => {
      const status = module.state ? mapStatus(module.state) : null;
      return {
        module,
        status,
        statusLabel: status
          ? status.key
            ? m[statusLabelKey(status.key)]
            : status.value
          : null,
        entries: entries(
          project.documents.filter((d) => d.moduleNumber === module.number),
        ),
      };
    }),
  );
</script>

{#snippet documentList(items: Entry[])}
  <ul class="mt-0.5 space-y-px">
    {#each items as item (item.document.id)}
      <li>
        <button
          type="button"
          class="pt-nav-item pl-6 text-[0.8125rem]"
          aria-current={navigation.activeView === "document" &&
          item.document.id === activeDocumentId
            ? "page"
            : undefined}
          title={`${m[categoryLabelKey(item.document.category)]} · ${item.document.path}`}
          onclick={() => onselect(item.document.id)}
        >
          <Icon name="FileText" size={13} class="shrink-0 text-[var(--pt-muted)]" />
          <span class="truncate">{item.label}</span>
        </button>
      </li>
    {/each}
    {#if items.length === 0}
      <li class="px-6 py-1 text-[var(--pt-muted)]">{m["nav.emptyBlock"]}</li>
    {/if}
  </ul>
{/snippet}

<nav class="text-sm" aria-label={m["a11y.navigation"]}>
  <section class="mb-4">
    <div
      class="flex w-full items-center gap-2 rounded-md px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--pt-muted)]"
    >
      <Icon name="FolderKanban" size={14} />
      <span class="flex-1 text-left">{m["nav.project"]}</span>
    </div>
    {@render documentList(projectEntries)}
  </section>

  <section class="mb-4">
    <div class="flex items-center gap-0.5">
      <button
        type="button"
        class="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-wider hover:bg-[var(--pt-surface-2)]"
        class:text-[var(--pt-accent-strong)]={navigation.activeView === "modules"}
        class:text-[var(--pt-muted)]={navigation.activeView !== "modules"}
        aria-current={navigation.activeView === "modules" ? "page" : undefined}
        onclick={onopenmodules}
      >
        <Icon name="Boxes" size={14} />
        <span class="flex-1 text-left">{m["nav.modules"]}</span>
      </button>
      <button
        type="button"
        class="rounded p-1 text-[var(--pt-muted)] hover:bg-[var(--pt-surface-2)]"
        aria-expanded={navigation.modulesExpanded}
        aria-label={m["nav.toggleModules"]}
        title={m["nav.toggleModules"]}
        onclick={() => navigation.toggleModules()}
      >
        <Icon
          name={navigation.modulesExpanded ? "ChevronDown" : "ChevronRight"}
          size={14}
        />
      </button>
    </div>
    {#if navigation.modulesExpanded}
      <ul class="mt-0.5 space-y-0.5">
        {#each modules as group (group.module.number)}
          <li>
            <div class="flex items-center gap-0.5">
              <button
                type="button"
                class="rounded p-1 text-[var(--pt-muted)] hover:bg-[var(--pt-surface-2)]"
                aria-expanded={navigation.isModuleExpanded(group.module.number)}
                aria-label={m["nav.toggleModules"]}
                title={m["nav.toggleModules"]}
                onclick={() => navigation.toggleModule(group.module.number)}
              >
                <Icon
                  name={navigation.isModuleExpanded(group.module.number)
                    ? "ChevronDown"
                    : "ChevronRight"}
                  size={13}
                />
              </button>
              <button
                type="button"
                class="pt-nav-item pt-nav-item--module min-w-0 flex-1 text-[0.8125rem] font-medium"
                class:bg-[var(--pt-surface-2)]={navigation.activeView === "module" &&
                  navigation.activeModuleNumber === group.module.number}
                aria-current={navigation.activeView === "module" &&
                navigation.activeModuleNumber === group.module.number
                  ? "page"
                  : undefined}
                onclick={() => onopenmodule(group.module.number)}
              >
                <Icon name="Folder" size={13} class="shrink-0 text-[var(--pt-muted)]" />
                <span class="min-w-0 flex-1 truncate">
                  {folderName(group.module.number, group.module.slug, group.module.name)}
                </span>
                {#if group.status && group.statusLabel}
                  <span
                    class="flex shrink-0 items-center gap-1 text-[0.6875rem]"
                    style={`color: var(--pt-status-${group.status.key ?? "neutral"})`}
                  >
                    <ModuleStatusIcon status={group.status} label={group.statusLabel} />
                    <span>{group.statusLabel}</span>
                  </span>
                {/if}
              </button>
            </div>
            {#if navigation.isModuleExpanded(group.module.number)}
              {@render documentList(group.entries)}
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  {#if otherEntries.length > 0}
    <section>
      <button
        type="button"
        class="flex w-full items-center gap-2 rounded-md px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--pt-muted)] hover:bg-[var(--pt-surface-2)]"
        aria-expanded={navigation.otherExpanded}
        onclick={() => navigation.toggleOther()}
      >
        <Icon name="Files" size={14} />
        <span class="flex-1 text-left">{m["nav.other"]}</span>
        <Icon
          name={navigation.otherExpanded ? "ChevronDown" : "ChevronRight"}
          size={14}
        />
      </button>
      {#if navigation.otherExpanded}
        {@render documentList(otherEntries)}
      {/if}
    </section>
  {/if}
</nav>
