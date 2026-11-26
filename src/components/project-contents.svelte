<script lang="ts">
  import type { Document, Project } from "../lib/model/types";
  import { CATEGORY_ORDER, moduleFolderName } from "../lib/model/categories";
  import { mapStatus } from "../lib/semantics/status";
  import { categoryLabelKey, statusLabelKey, messages, t } from "../lib/i18n";
  import { navigation } from "../stores/index";
  import ModuleStatusIcon from "./primitives/module-status-icon.svelte";
  import Icon from "./primitives/icon.svelte";

  let {
    project,
    active,
    activeDocumentId,
    onselect,
    onopenmodule,
    onopenmodules,
  }: {
    project: Project;
    active: boolean;
    activeDocumentId: string | null;
    onselect: (documentId: string) => void;
    onopenmodule: (moduleNumber: number) => void;
    onopenmodules: () => void;
  } = $props();

  const m = messages;

  let modulesExpanded = $state(true);
  let expandedModules = $state<Record<number, boolean>>({});

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

  function toggleModule(number: number): void {
    expandedModules = {
      ...expandedModules,
      [number]: !expandedModules[number],
    };
  }

  function isModuleExpanded(number: number): boolean {
    return expandedModules[number] ?? false;
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

{#snippet documentList(items: Entry[], indent: string)}
  <ul class="mt-0.5 space-y-px">
    {#each items as item (item.document.id)}
      <li>
        <button
          type="button"
          class={`pt-nav-item ${indent} text-[0.8125rem]`}
          aria-current={active &&
          navigation.activeView === "document" &&
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
  </ul>
{/snippet}

{@render documentList(projectEntries, "pl-3")}

<div class="mt-1 flex items-center gap-0.5">
  <button
    type="button"
    class="rounded p-1 text-[var(--pt-muted)] hover:bg-[var(--pt-surface-2)]"
    aria-expanded={modulesExpanded}
    aria-label={m["nav.toggleModules"]}
    title={m["nav.toggleModules"]}
    onclick={() => (modulesExpanded = !modulesExpanded)}
  >
    <Icon name={modulesExpanded ? "ChevronDown" : "ChevronRight"} size={13} />
  </button>
  <button
    type="button"
    class="pt-nav-item pl-2 text-[0.8125rem] font-medium"
    class:text-[var(--pt-accent-strong)]={active && navigation.activeView === "modules"}
    aria-current={active && navigation.activeView === "modules" ? "page" : undefined}
    onclick={onopenmodules}
  >
    <Icon name="Boxes" size={13} class="shrink-0 text-[var(--pt-muted)]" />
    <span class="flex-1 truncate">{m["nav.modules"]}</span>
    <span class="text-[0.6875rem] text-[var(--pt-muted)]">{modules.length}</span>
  </button>
</div>

{#if modulesExpanded && modules.length > 0}
  <div class="ml-3 border-l border-[var(--pt-border)] pl-1">
    <ul class="space-y-0.5">
      {#each modules as group (group.module.number)}
        {@const folder = folderName(
          group.module.number,
          group.module.slug,
          group.module.name,
        )}
        <li>
          <div class="flex items-center gap-0.5">
            <button
              type="button"
              class="rounded p-1 text-[var(--pt-muted)] hover:bg-[var(--pt-surface-2)]"
              aria-expanded={isModuleExpanded(group.module.number)}
              aria-label={t("nav.toggleModule", { folder })}
              title={t("nav.toggleModule", { folder })}
              onclick={() => toggleModule(group.module.number)}
            >
              <Icon
                name={isModuleExpanded(group.module.number)
                  ? "ChevronDown"
                  : "ChevronRight"}
                size={13}
              />
            </button>
            <button
              type="button"
              class="pt-nav-item pt-nav-item--module min-w-0 flex-1 pl-2 text-[0.8125rem]"
              class:bg-[var(--pt-surface-2)]={active &&
                navigation.activeView === "module" &&
                navigation.activeModuleNumber === group.module.number}
              aria-current={active &&
              navigation.activeView === "module" &&
              navigation.activeModuleNumber === group.module.number
                ? "page"
                : undefined}
              onclick={() => onopenmodule(group.module.number)}
            >
              <Icon name="Folder" size={13} class="shrink-0 text-[var(--pt-muted)]" />
              <span class="min-w-0 flex-1 truncate">{folder}</span>
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
          {#if isModuleExpanded(group.module.number)}
            {@render documentList(group.entries, "pl-9")}
          {/if}
        </li>
      {/each}
    </ul>
  </div>
{/if}

{#if otherEntries.length > 0}
  <div class="mt-1">
    {@render documentList(otherEntries, "pl-3")}
  </div>
{/if}
