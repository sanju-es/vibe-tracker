<script lang="ts">
  import type { Project } from "../lib/model/types";
  import { backlogBoard } from "../lib/model/selectors";
  import { messages as m } from "../lib/i18n";
  import DataTable from "../components/nodes/data-table.svelte";

  let { project }: { project: Project } = $props();

  type Grouping = "none" | "module" | "status";

  let grouping = $state<Grouping>("none");

  const board = $derived(backlogBoard(project));
  const groupBy = $derived(
    grouping === "module"
      ? { column: 0, label: m["backlog.groupModule"] }
      : grouping === "status"
        ? { column: board.table.statusColumn ?? -1, label: m["backlog.groupStatus"] }
        : null,
  );
</script>

<div class="pt-prose">
  <h1 class="mb-1">{m["backlog.title"]}</h1>
  <p class="mb-4 text-xs text-[var(--pt-muted)]">
    {board.table.rows.length} · {project.name}
  </p>

  {#if board.table.rows.length === 0}
    <p class="text-sm text-[var(--pt-muted)]">{m["backlog.empty"]}</p>
  {:else}
    <div class="mb-2 flex flex-wrap items-end gap-2">
      <label class="flex flex-col gap-1 text-xs text-[var(--pt-muted)]">
        <span>{m["backlog.group"]}</span>
        <select
          class="h-8 rounded-lg border border-[var(--pt-border-control)] bg-[var(--pt-surface)] px-2 text-[0.8125rem] text-[var(--pt-text)] shadow-[var(--pt-shadow-sm)]"
          value={grouping}
          onchange={(event) => {
            grouping = event.currentTarget.value as Grouping;
          }}
        >
          <option value="none">{m["backlog.groupNone"]}</option>
          <option value="module">{m["backlog.groupModule"]}</option>
          <option value="status">{m["backlog.groupStatus"]}</option>
        </select>
      </label>
    </div>

    <DataTable
      table={board.table}
      documentId="backlog-board"
      documentTitle={m["backlog.title"]}
      rowTarget={(row) => board.targets.get(row.id) ?? null}
      {groupBy}
    />
  {/if}
</div>
