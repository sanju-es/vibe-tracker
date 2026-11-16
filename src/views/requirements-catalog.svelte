<script lang="ts">
  import type { Project } from "../lib/model/types";
  import { REQUIREMENT_SECTIONS, requirementsCatalog } from "../lib/model/requirements";
  import { messages as m } from "../lib/i18n";
  import DataTable from "../components/nodes/data-table.svelte";

  let { project }: { project: Project } = $props();

  type Grouping = "none" | "module" | "section";

  let grouping = $state<Grouping>("none");

  const catalogue = $derived(requirementsCatalog(project, m["requirements.noEntries"]));
  const groupBy = $derived(
    grouping === "module"
      ? { column: 0, label: m["requirements.groupModule"] }
      : grouping === "section"
        ? {
            column: 2,
            label: m["requirements.groupSection"],
            order: REQUIREMENT_SECTIONS,
          }
        : null,
  );
</script>

<div class="pt-prose">
  <h1 class="mb-1">{m["requirements.title"]}</h1>
  <p class="mb-4 text-xs text-[var(--pt-muted)]">
    {catalogue.table.rows.length} · {project.name}
  </p>

  {#if catalogue.table.rows.length === 0}
    <p class="text-sm text-[var(--pt-muted)]">{m["requirements.empty"]}</p>
  {:else}
    <div class="mb-2 flex flex-wrap items-end gap-2">
      <label class="flex flex-col gap-1 text-xs text-[var(--pt-muted)]">
        <span>{m["requirements.group"]}</span>
        <select
          class="h-8 rounded-lg border border-[var(--pt-border)] bg-[var(--pt-surface)] px-2 text-[0.8125rem] text-[var(--pt-text)] shadow-[var(--pt-shadow-sm)]"
          value={grouping}
          onchange={(event) => {
            grouping = event.currentTarget.value as Grouping;
          }}
        >
          <option value="none">{m["requirements.groupNone"]}</option>
          <option value="module">{m["requirements.groupModule"]}</option>
          <option value="section">{m["requirements.groupSection"]}</option>
        </select>
      </label>
    </div>

    <DataTable
      table={catalogue.table}
      documentId="requirements-catalog"
      documentTitle={m["requirements.title"]}
      rowTarget={(row) => catalogue.targets.get(row.id) ?? null}
      {groupBy}
    />
  {/if}
</div>
