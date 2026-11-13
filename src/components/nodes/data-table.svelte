<script lang="ts">
  import type {
    InlineRun,
    Row,
    RowTarget,
    StatusKey,
    Table,
  } from "../../lib/model/types";
  import {
    applyView,
    EMPTY_TABLE_VIEW,
    statusesExcluding,
    statusOptions,
    type TableView,
  } from "../../lib/semantics/tables";
  import { mapStatus } from "../../lib/semantics/status";
  import { messages as m, statusLabelKey } from "../../lib/i18n";
  import { reader, tables } from "../../stores/index";
  import { moduleInfoFromPath } from "../../lib/model/categories";
  import StatusChip from "../primitives/status-chip.svelte";
  import Icon from "../primitives/icon.svelte";
  import InlineRuns from "./inline-runs.svelte";

  let {
    table,
    documentId,
    documentTitle,
    excludeStatuses = [],
    rowTarget,
  }: {
    table: Table;
    documentId: string;
    documentTitle: string;
    excludeStatuses?: StatusKey[];
    rowTarget?: (row: Row) => RowTarget | null;
  } = $props();

  const fallback = $derived<TableView>({
    ...EMPTY_TABLE_VIEW,
    statuses:
      excludeStatuses.length === 0 ? null : statusesExcluding(table, excludeStatuses),
  });

  const view = $derived<TableView>(tables.view(table.id, fallback));
  const rows = $derived(applyView(table, view));
  const options = $derived(statusOptions(table));
  const optionKeys = $derived(options.map((option) => option.key));

  function isActive(key: StatusKey | null): boolean {
    return view.statuses === null || view.statuses.includes(key);
  }

  function hasReference(runs: readonly InlineRun[]): boolean {
    return runs.some(
      (run) =>
        run.kind === "reference" ||
        (run.children !== undefined && hasReference(run.children)),
    );
  }

  function statusText(column: number, text: string): string {
    if (table.statusColumn !== column) return text;
    const status = mapStatus(text);
    return status.key ? m[statusLabelKey(status.key)] : status.value;
  }

  function ariaSort(column: number): "ascending" | "descending" | "none" {
    if (!view.sort || view.sort.column !== column) return "none";
    return view.sort.direction === "asc" ? "ascending" : "descending";
  }

  function openRow(row: Row): void {
    const custom = rowTarget?.(row) ?? null;
    reader.openRow([
      custom ?? {
        kind: "row",
        documentId,
        documentTitle,
        moduleNumber: moduleInfoFromPath(documentId)?.number ?? null,
        tableId: table.id,
        rowId: row.id,
        headers: table.headers,
        cells: row.cells,
      },
    ]);
  }

  function onRowClick(event: MouseEvent, row: Row): void {
    const target = event.target;
    if (target instanceof Element && target.closest("button, a")) return;
    openRow(row);
  }

  function onRowKeydown(event: KeyboardEvent, row: Row): void {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openRow(row);
    }
  }
</script>

<div class="my-4">
  <div class="mb-2 flex flex-wrap items-center gap-2">
    <label class="sr-only" for={`filter-${table.id}`}>{m["table.filter.text"]}</label>
    <span class="relative min-w-48 flex-1">
      <Icon
        name="Search"
        size={14}
        class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[var(--pt-muted)]"
      />
      <input
        id={`filter-${table.id}`}
        class="h-8 w-full rounded-lg border border-[var(--pt-border)] bg-[var(--pt-surface)] pl-7 pr-2 text-[0.8125rem] shadow-[var(--pt-shadow-sm)]"
        type="search"
        placeholder={m["table.filter.text"]}
        value={view.text}
        oninput={(event) => tables.setText(table.id, event.currentTarget.value, fallback)}
      />
    </span>

    {#if options.length > 0}
      <div
        class="flex flex-wrap items-center gap-1"
        role="group"
        aria-label={m["table.filter.status"]}
      >
        {#each options as option (option.key ?? "neutral")}
          <button
            type="button"
            class="pt-chip"
            class:line-through={!isActive(option.key)}
            class:opacity-60={!isActive(option.key)}
            data-status={option.key ?? "neutral"}
            aria-pressed={isActive(option.key)}
            onclick={() =>
              tables.toggleStatus(table.id, option.key, optionKeys, fallback)}
          >
            {option.key ? m[statusLabelKey(option.key)] : option.label}
            <span class="font-normal opacity-70">({option.count})</span>
          </button>
        {/each}
      </div>
    {/if}

    <button type="button" class="pt-button" onclick={() => tables.reset(table.id)}>
      <Icon name="RotateCcw" size={13} />
      <span>{m["table.filter.reset"]}</span>
    </button>
  </div>

  <div class="overflow-x-auto">
    <table class="pt-table">
      <thead>
        <tr>
          {#each table.headers as header, column (column)}
            <th scope="col" aria-sort={ariaSort(column)}>
              <button
                type="button"
                class="inline-flex items-center gap-1 font-semibold"
                title={`${header}`}
                onclick={() => tables.sortBy(table.id, column, fallback)}
              >
                <span class="truncate">{header}</span>
                <span aria-hidden="true" class="text-[var(--pt-muted)]">
                  <Icon
                    name={view.sort && view.sort.column === column
                      ? view.sort.direction === "asc"
                        ? "ArrowUp"
                        : "ArrowDown"
                      : "ArrowUpDown"}
                    size={12}
                  />
                </span>
              </button>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each rows as row (row.id)}
          <tr
            data-row-id={row.id}
            class="cursor-pointer"
            class:pt-row--highlight={reader.highlightedRowId === row.id}
            tabindex="0"
            aria-label={`${m["table.openRow"]}: ${row.cells[0]?.text ?? ""}`}
            onclick={(event) => onRowClick(event, row)}
            onkeydown={(event) => onRowKeydown(event, row)}
          >
            {#each row.cells as cell (cell.column)}
              <td>
                {#if hasReference(cell.runs)}
                  <InlineRuns
                    runs={cell.runs}
                    onopenlink={(run) => {
                      if (run.linkKind === "document" && run.targetPath) {
                        reader.openDocument(run.targetPath);
                      }
                    }}
                    onopenimage={(run) => {
                      if (run.targetPath) reader.openImage(run.targetPath, run.text);
                    }}
                    onreference={(reference) =>
                      reader.openRow(reference.targets, reference.identifier)}
                  />
                {:else if table.statusColumn === cell.column}
                  <StatusChip
                    status={mapStatus(cell.text)}
                    label={statusText(cell.column, cell.text)}
                  />
                {:else if cell.ref}
                  <button
                    type="button"
                    class="pt-ref"
                    onclick={(event) => {
                      event.stopPropagation();
                      reader.openRow(cell.ref!.targets, cell.ref!.identifier);
                    }}
                  >
                    {cell.text}
                  </button>
                {:else if cell.runs.length > 0}
                  <InlineRuns
                    runs={cell.runs}
                    onopenlink={(run) => {
                      if (run.linkKind === "document" && run.targetPath) {
                        reader.openDocument(run.targetPath);
                      }
                    }}
                    onopenimage={(run) => {
                      if (run.targetPath) reader.openImage(run.targetPath, run.text);
                    }}
                  />
                {:else}
                  {cell.text}
                {/if}
              </td>
            {/each}
          </tr>
        {:else}
          <tr>
            <td
              colspan={Math.max(table.headers.length, 1)}
              class="text-[var(--pt-muted)]"
            >
              {m["table.empty"]}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
