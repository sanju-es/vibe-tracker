<script lang="ts">
  import type { Project } from "../lib/model/types";
  import { projectStore, navigation, tables } from "../stores/index";
  import { messages as m } from "../lib/i18n";
  import ProjectNavigation from "../components/project-navigation.svelte";
  import DocumentBody from "../components/document-body.svelte";
  import DetailModal from "../components/detail-modal.svelte";
  import ModulesOverview from "../components/modules-overview.svelte";
  import ModulePage from "../components/module-page.svelte";
  import BacklogBoard from "./backlog-board.svelte";
  import RequirementsCatalog from "./requirements-catalog.svelte";
  import ModulesDashboard from "./modules-dashboard.svelte";
  import Icon from "../components/primitives/icon.svelte";

  let { project }: { project: Project } = $props();

  const activeDocument = $derived(
    project.documents.find((entry) => entry.id === navigation.activeDocumentId) ?? null,
  );

  let previousDocumentId: string | null = null;

  $effect(() => {
    const current = navigation.activeDocumentId;
    if (previousDocumentId !== null && previousDocumentId !== current) {
      tables.resetDocument(previousDocumentId);
    }
    previousDocumentId = current;
  });
</script>

<div class="min-h-screen">
  <a
    class="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-[var(--pt-surface)] focus:px-3 focus:py-1"
    href="#document-content"
  >
    {m["a11y.skipToContent"]}
  </a>

  <header
    class="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-[var(--pt-border)] bg-[var(--pt-surface)] px-4"
  >
    <span
      class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--pt-accent-soft)] text-[var(--pt-accent-strong)]"
    >
      <Icon name="BookOpen" size={16} />
    </span>
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-semibold">{project.name}</p>
      <p class="truncate text-xs text-[var(--pt-muted)]">
        {navigation.activeView === "backlog"
          ? m["backlog.title"]
          : navigation.activeView === "requirements"
            ? m["requirements.title"]
            : navigation.activeView === "dashboard"
              ? m["dashboard.title"]
              : navigation.activeView === "modules"
                ? m["modules.title"]
                : navigation.activeView === "module"
                  ? (project.modules.find(
                      (entry) => entry.number === navigation.activeModuleNumber,
                    )?.name ?? m["modules.title"])
                  : (activeDocument?.title ?? "")}
      </p>
    </div>
    <button
      type="button"
      class="pt-button"
      title={m["backlog.home"]}
      aria-label={m["backlog.home"]}
      onclick={() => navigation.reset(project)}
    >
      <Icon name="House" size={14} />
    </button>
    <button
      type="button"
      class="pt-button"
      class:text-[var(--pt-accent-strong)]={navigation.activeView === "backlog"}
      title={m["backlog.entry"]}
      aria-label={m["backlog.entry"]}
      aria-current={navigation.activeView === "backlog" ? "page" : undefined}
      onclick={() => navigation.openBacklog()}
    >
      <Icon name="ListTodo" size={14} />
      <span>{m["backlog.entry"]}</span>
    </button>
    <button
      type="button"
      class="pt-button"
      class:text-[var(--pt-accent-strong)]={navigation.activeView === "requirements"}
      title={m["requirements.entry"]}
      aria-label={m["requirements.entry"]}
      aria-current={navigation.activeView === "requirements" ? "page" : undefined}
      onclick={() => navigation.openRequirements()}
    >
      <Icon name="ListChecks" size={14} />
      <span>{m["requirements.entry"]}</span>
    </button>
    <button
      type="button"
      class="pt-button"
      class:text-[var(--pt-accent-strong)]={navigation.activeView === "dashboard"}
      title={m["dashboard.entry"]}
      aria-label={m["dashboard.entry"]}
      aria-current={navigation.activeView === "dashboard" ? "page" : undefined}
      onclick={() => navigation.openDashboard()}
    >
      <Icon name="LayoutDashboard" size={14} />
      <span>{m["dashboard.entry"]}</span>
    </button>
    <button
      type="button"
      class="pt-button"
      title={m["nav.reload"]}
      aria-label={m["nav.reload"]}
      onclick={() => void projectStore.reload()}
    >
      <Icon name="RefreshCw" size={14} />
    </button>
    <button
      type="button"
      class="pt-button"
      onclick={() => void projectStore.openFolder()}
    >
      <Icon name="FolderOpen" size={14} />
      <span>{m["empty.action"]}</span>
    </button>
  </header>

  <div class="flex items-start">
    <aside
      id="documentation-menu"
      class="sticky top-12 h-[calc(100vh-3rem)] w-72 shrink-0 overflow-y-auto border-r border-[var(--pt-border)] bg-[var(--pt-surface)] p-3"
    >
      <ProjectNavigation
        {project}
        activeDocumentId={navigation.activeDocumentId}
        onselect={(id) => navigation.select(id)}
        onopenmodules={() => navigation.openModules()}
        onopenmodule={(number) => navigation.openModule(number)}
      />
    </aside>

    <main id="document-content" class="min-w-0 flex-1 px-5 py-5">
      {#if navigation.activeView === "backlog"}
        <BacklogBoard {project} />
      {:else if navigation.activeView === "requirements"}
        <RequirementsCatalog {project} />
      {:else if navigation.activeView === "dashboard"}
        <ModulesDashboard {project} />
      {:else if navigation.activeView === "modules"}
        <ModulesOverview
          {project}
          onopenmodule={(number) => navigation.openModule(number)}
        />
      {:else if navigation.activeView === "module" && navigation.activeModuleNumber !== null}
        <ModulePage {project} moduleNumber={navigation.activeModuleNumber} />
      {:else if activeDocument}
        <p class="mb-3 text-xs text-[var(--pt-muted)]">{activeDocument.path}</p>
        <DocumentBody document={activeDocument} />
      {:else}
        <p class="text-sm text-[var(--pt-muted)]">{m["nav.emptyBlock"]}</p>
      {/if}
    </main>
  </div>

  <DetailModal />
</div>
