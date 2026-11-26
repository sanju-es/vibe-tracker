<script lang="ts">
  import type { Project } from "../lib/model/types";
  import { projectStore, navigation, reader, search, tables } from "../stores/index";
  import { messages as m } from "../lib/i18n";
  import ProjectNavigation from "../components/project-navigation.svelte";
  import ProjectList from "../components/project-list.svelte";
  import DocumentBody from "../components/document-body.svelte";
  import DetailModal from "../components/detail-modal.svelte";
  import ModulesOverview from "../components/modules-overview.svelte";
  import ModulePage from "../components/module-page.svelte";
  import BacklogBoard from "./backlog-board.svelte";
  import RequirementsCatalog from "./requirements-catalog.svelte";
  import ModulesDashboard from "./modules-dashboard.svelte";
  import SearchView from "./search-view.svelte";
  import ProjectPortfolio from "./project-portfolio.svelte";
  import InfoModal from "../components/info-modal.svelte";
  import Icon from "../components/primitives/icon.svelte";

  let { project }: { project: Project | null } = $props();

  const portfolio = $derived(projectStore.workspace?.mode === "portfolio");
  let infoOpen = $state(false);
  const activeDocument = $derived(
    project?.documents.find((entry) => entry.id === navigation.activeDocumentId) ?? null,
  );

  let previousDocumentId: string | null = null;
  let previousProject: Project | null = null;
  let mainElement: HTMLElement | null = null;

  $effect(() => {
    const current = project;
    const mode = projectStore.workspace?.mode;
    if (!current && mode !== "portfolio") return;
    requestAnimationFrame(() => mainElement?.focus());
  });

  $effect(() => {
    if (previousProject !== null && previousProject !== project) search.clear();
    previousProject = project;
  });

  $effect(() => {
    const current = navigation.activeDocumentId;
    if (previousDocumentId !== null && previousDocumentId !== current) {
      tables.resetDocument(previousDocumentId);
    }
    previousDocumentId = current;
  });

  $effect(() => {
    const anchor = navigation.pendingAnchor;
    const rowId = navigation.pendingRowId;
    if (anchor === null && rowId === null) return;
    requestAnimationFrame(() => {
      if (anchor) {
        document.getElementById(anchor)?.scrollIntoView({ block: "center" });
      }
      if (rowId) reader.highlight(rowId);
      navigation.clearPendingTarget();
    });
  });

  $effect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if (!projectStore.project) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        navigation.openSearch();
        search.focus();
      }
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  });

  async function ensureProject(projectId: string): Promise<boolean> {
    const workspace = projectStore.workspace;
    if (!workspace) return false;
    if (workspace.selectedId === projectId && projectStore.project) return true;
    await projectStore.selectProject(projectId);
    return (
      projectStore.workspace?.selectedId === projectId && projectStore.project !== null
    );
  }

  async function openProjectDocument(
    projectId: string,
    documentId: string,
  ): Promise<void> {
    if (!(await ensureProject(projectId))) return;
    navigation.select(documentId);
  }

  async function openProjectModule(
    projectId: string,
    moduleNumber: number,
  ): Promise<void> {
    if (!(await ensureProject(projectId))) return;
    navigation.openModule(moduleNumber);
  }

  async function openProjectModules(projectId: string): Promise<void> {
    if (!(await ensureProject(projectId))) return;
    navigation.openModules();
  }
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
      <p class="truncate text-sm font-semibold">
        {project?.name ?? projectStore.workspace?.rootName ?? ""}
      </p>
      <p class="truncate text-xs text-[var(--pt-muted)]">
        {#if project}
          {navigation.activeView === "backlog"
            ? m["backlog.title"]
            : navigation.activeView === "requirements"
              ? m["requirements.title"]
              : navigation.activeView === "dashboard"
                ? m["dashboard.title"]
                : navigation.activeView === "search"
                  ? m["search.title"]
                  : navigation.activeView === "modules"
                    ? m["modules.title"]
                    : navigation.activeView === "module"
                      ? (project.modules.find(
                          (entry) => entry.number === navigation.activeModuleNumber,
                        )?.name ?? m["modules.title"])
                      : (activeDocument?.title ?? "")}
        {:else}
          {m["workspace.title"]}
        {/if}
      </p>
    </div>

    {#if project}
      <button
        type="button"
        class="pt-button"
        title={m["backlog.home"]}
        aria-label={m["backlog.home"]}
        onclick={() => navigation.reset(project)}
      >
        <Icon name="House" size={14} />
      </button>
    {/if}

    {#if !portfolio}
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
        <span class="hidden sm:inline">{m["backlog.entry"]}</span>
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
        <span class="hidden sm:inline">{m["requirements.entry"]}</span>
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
        <span class="hidden sm:inline">{m["dashboard.entry"]}</span>
      </button>
    {/if}

    {#if project}
      <button
        type="button"
        class="pt-button"
        class:text-[var(--pt-accent-strong)]={navigation.activeView === "search"}
        title={m["search.entry"]}
        aria-label={m["search.entry"]}
        aria-current={navigation.activeView === "search" ? "page" : undefined}
        onclick={() => {
          navigation.openSearch();
          search.focus();
        }}
      >
        <Icon name="Search" size={14} />
      </button>
    {/if}

    <button
      type="button"
      class="pt-button"
      title={m["info.entry"]}
      aria-label={m["info.entry"]}
      onclick={() => (infoOpen = true)}
    >
      <Icon name="Info" size={14} />
    </button>

    <button
      type="button"
      class="pt-button"
      title={project ? m["nav.reload"] : m["workspace.reload"]}
      aria-label={project ? m["nav.reload"] : m["workspace.reload"]}
      onclick={() => void projectStore.reload()}
    >
      <Icon name="RefreshCw" size={14} />
    </button>
    <button
      type="button"
      class="pt-button"
      title={m["empty.action"]}
      aria-label={m["empty.action"]}
      onclick={() => void projectStore.openFolder()}
    >
      <Icon name="FolderOpen" size={14} />
      <span class="hidden sm:inline">{m["empty.action"]}</span>
    </button>
  </header>

  <div class="flex items-start">
    <aside
      id="documentation-menu"
      class="sticky top-12 h-[calc(100vh-3rem)] w-72 shrink-0 overflow-y-auto border-r border-[var(--pt-border)] bg-[var(--pt-surface)] p-3"
    >
      {#if portfolio && projectStore.workspace}
        <ProjectList
          projects={projectStore.workspace.projects}
          activeId={projectStore.workspace.selectedId}
          activeDocumentId={navigation.activeDocumentId}
          onshowportfolio={() => projectStore.showPortfolio()}
          onselectdocument={(projectId, documentId) =>
            void openProjectDocument(projectId, documentId)}
          onopenmodule={(projectId, moduleNumber) =>
            void openProjectModule(projectId, moduleNumber)}
          onopenmodules={(projectId) => void openProjectModules(projectId)}
        />
      {:else if project}
        <ProjectNavigation
          {project}
          activeDocumentId={navigation.activeDocumentId}
          onselect={(id) => navigation.select(id)}
          onopenmodules={() => navigation.openModules()}
          onopenmodule={(number) => navigation.openModule(number)}
        />
      {/if}
    </aside>

    <main
      id="document-content"
      class="min-w-0 flex-1 px-5 py-5"
      tabindex="-1"
      bind:this={mainElement}
    >
      {#if !project && portfolio}
        <ProjectPortfolio />
      {:else if project}
        {#if navigation.activeView === "backlog"}
          <BacklogBoard {project} />
        {:else if navigation.activeView === "requirements"}
          <RequirementsCatalog {project} />
        {:else if navigation.activeView === "dashboard"}
          <ModulesDashboard {project} />
        {:else if navigation.activeView === "search"}
          <SearchView {project} />
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
      {:else}
        <p class="text-sm text-[var(--pt-muted)]">{m["nav.emptyBlock"]}</p>
      {/if}
    </main>
  </div>

  {#if project}
    <DetailModal />
  {/if}
  {#if infoOpen}
    <InfoModal onclose={() => (infoOpen = false)} />
  {/if}
</div>
