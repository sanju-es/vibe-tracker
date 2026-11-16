<script lang="ts">
  import { projectStore } from "../stores/index";
  import { navigation } from "../stores/index";
  import EmptyState from "../views/empty-state.svelte";
  import ReadingWorkspace from "../views/reading-workspace.svelte";
  import ScanProgress from "../components/scan-progress.svelte";
  import ErrorNotice from "../components/error-notice.svelte";

  $effect(() => {
    const project = projectStore.project;
    if (!project) return;
    const current = navigation.activeDocumentId;
    if (!current || !project.documents.some((entry) => entry.id === current)) {
      navigation.reset(project);
    }
  });
</script>

{#if projectStore.status === "ready" && projectStore.project}
  <ReadingWorkspace project={projectStore.project} />
{:else if projectStore.status === "opening" || projectStore.status === "scanning"}
  <main class="flex min-h-screen items-center justify-center p-6">
    <ScanProgress
      opening={projectStore.status === "opening"}
      done={projectStore.progress.done}
      total={projectStore.progress.total}
      warning={projectStore.warning}
      oncancel={() => projectStore.cancelScan()}
    />
  </main>
{:else if projectStore.error}
  <main class="flex min-h-screen items-center justify-center p-6">
    <ErrorNotice error={projectStore.error} onretry={() => projectStore.retry()} />
  </main>
{:else}
  <EmptyState />
{/if}
