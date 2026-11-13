<script lang="ts">
  import type { Project } from "../lib/model/types";
  import { moduleBacklog, moduleByNumber } from "../lib/model/selectors";
  import { moduleFolderName } from "../lib/model/categories";
  import { mapStatus } from "../lib/semantics/status";
  import { messages as m, statusLabelKey } from "../lib/i18n";
  import StatusChip from "./primitives/status-chip.svelte";
  import ModuleStatusIcon from "./primitives/module-status-icon.svelte";
  import DataTable from "./nodes/data-table.svelte";

  let { project, moduleNumber }: { project: Project; moduleNumber: number } = $props();

  const module = $derived(moduleByNumber(project, moduleNumber));
  const backlog = $derived(moduleBacklog(project, moduleNumber));
  const status = $derived(module?.state ? mapStatus(module.state) : null);
</script>

<div class="pt-prose">
  {#if module}
    <div class="mb-1 flex flex-wrap items-center gap-2">
      <h1 class="!m-0">{moduleFolderName(module.number, module.slug, module.name)}</h1>
      {#if status}
        <span class="inline-flex items-center gap-1.5">
          <ModuleStatusIcon
            {status}
            label={status.key ? m[statusLabelKey(status.key)] : status.value}
          />
          <StatusChip
            {status}
            label={status.key ? m[statusLabelKey(status.key)] : status.value}
          />
        </span>
      {/if}
    </div>
    <p class="mb-4 text-xs text-[var(--pt-muted)]">
      {module.name}{backlog ? ` · ${backlog.document.path}` : ""}
    </p>

    <h2>{m["modules.backlog"]}</h2>
    {#if backlog && backlog.tables.length > 0}
      {#each backlog.tables as table (table.id)}
        <DataTable
          {table}
          documentId={backlog.document.id}
          documentTitle={backlog.document.title}
          excludeStatuses={["implemented", "discarded", "deferred"]}
        />
      {/each}
    {:else}
      <p class="text-sm text-[var(--pt-muted)]">{m["modules.backlogEmpty"]}</p>
    {/if}
  {:else}
    <p class="text-sm text-[var(--pt-muted)]">{m["modules.empty"]}</p>
  {/if}
</div>
