<script lang="ts">
  import type { Project, StatusKey } from "../lib/model/types";
  import { moduleFolderName } from "../lib/model/categories";
  import {
    backlogStatusKeys,
    backlogSummary,
    moduleBacklogCounts,
  } from "../lib/model/selectors";
  import DataTable from "./nodes/data-table.svelte";
  import { mapStatus } from "../lib/semantics/status";
  import { messages as m, statusLabelKey, t } from "../lib/i18n";
  import StatusChip from "./primitives/status-chip.svelte";
  import ModuleStatusIcon from "./primitives/module-status-icon.svelte";

  let {
    project,
    onopenmodule,
  }: { project: Project; onopenmodule: (moduleNumber: number) => void } = $props();

  const summary = $derived(backlogSummary(project));
  const statusKeys = $derived(backlogStatusKeys(project));
  const statusLabel = (key: StatusKey) => m[`status.${key}`];
</script>

<div class="pt-prose">
  <h1 class="mb-1">{m["modules.title"]}</h1>
  <p class="mb-4 text-xs text-[var(--pt-muted)]">
    {project.modules.length} · {project.name}
  </p>

  {#if project.modules.length === 0}
    <p class="text-sm text-[var(--pt-muted)]">{m["modules.empty"]}</p>
  {:else}
    <div class="overflow-x-auto">
      <table class="pt-table">
        <thead>
          <tr>
            <th scope="col" class="w-48">{m["modules.folder"]}</th>
            <th scope="col" class="w-full">{m["modules.name"]}</th>
            <th scope="col" class="whitespace-nowrap text-right">
              {m["modules.countAll"]}
            </th>
            {#each statusKeys as key (key)}
              <th
                scope="col"
                class="whitespace-nowrap text-right"
                style={`color: var(--pt-status-${key})`}
              >
                {statusLabel(key)}
              </th>
            {/each}
            <th scope="col" class="w-36 whitespace-nowrap text-right"
              >{m["modules.state"]}</th
            >
          </tr>
        </thead>
        <tbody>
          {#each project.modules as module (module.number)}
            {@const status = module.state ? mapStatus(module.state) : null}
            {@const folder = moduleFolderName(module.number, module.slug, module.name)}
            {@const counts = moduleBacklogCounts(project, module.number)}
            <tr
              tabindex="0"
              aria-label={t("modules.openModule", { folder })}
              onclick={() => onopenmodule(module.number)}
              onkeydown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onopenmodule(module.number);
                }
              }}
            >
              <td class="w-48 whitespace-nowrap font-mono text-[0.78rem]">{folder}</td>
              <td class="w-full">{module.name}</td>
              <td class="whitespace-nowrap text-right tabular-nums">{counts.all}</td>
              {#each statusKeys as key (key)}
                <td
                  class="whitespace-nowrap text-right tabular-nums"
                  style={`color: var(--pt-status-${key})`}
                >
                  {counts.byStatus[key] ?? 0}
                </td>
              {/each}
              <td class="w-36 whitespace-nowrap text-right">
                {#if status}
                  <span class="inline-flex items-center justify-end gap-1.5">
                    <ModuleStatusIcon
                      {status}
                      label={status.key ? m[statusLabelKey(status.key)] : status.value}
                    />
                    <StatusChip
                      {status}
                      label={status.key ? m[statusLabelKey(status.key)] : status.value}
                    />
                  </span>
                {:else}
                  <span class="text-[var(--pt-muted)]">—</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <h2 class="mt-8">{m["modules.backlogItems"]}</h2>
    {#if summary.table.rows.length > 0}
      <DataTable
        table={summary.table}
        documentId="backlog-summary"
        documentTitle={m["modules.backlogItems"]}
        rowTarget={(row) => summary.targets.get(row.id) ?? null}
      />
    {:else}
      <p class="text-sm text-[var(--pt-muted)]">{m["modules.backlogItemsEmpty"]}</p>
    {/if}
  {/if}
</div>
