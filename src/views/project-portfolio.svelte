<script lang="ts">
  import { projectStore } from "../stores/index";
  import { messages as m } from "../lib/i18n";
  import ProjectCard from "../components/project-card.svelte";

  const workspace = $derived(projectStore.workspace);

  $effect(() => {
    const id = projectStore.focusProjectId;
    if (id === null || !workspace) return;
    requestAnimationFrame(() => {
      document.getElementById(`workspace-card-${id === "" ? "root" : id}`)?.focus();
      projectStore.clearFocusProject();
    });
  });
</script>

{#if workspace}
  <div class="max-w-6xl">
    <h1 class="mb-1 text-xl font-semibold">{m["workspace.title"]}</h1>
    <p class="mb-5 text-sm text-[var(--pt-muted)]">{m["workspace.description"]}</p>

    {#if workspace.projects.length === 0}
      <p class="pt-panel p-4 text-sm text-[var(--pt-muted)]">
        {m["workspace.empty"]}
      </p>
    {:else}
      <ul class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {#each workspace.projects as entry (entry.id)}
          <li class="h-full">
            <ProjectCard
              {entry}
              onselect={(id) => void projectStore.selectProject(id)}
              onretry={(id) => void projectStore.retryProject(id)}
            />
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}
