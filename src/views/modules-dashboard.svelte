<script lang="ts">
  import type { Project } from "../lib/model/types";
  import { dashboardSummary } from "../lib/model/dashboard";
  import { mapStatus } from "../lib/semantics/status";
  import { messages as m } from "../lib/i18n";
  import { reader } from "../stores/index";
  import StatusChip from "../components/primitives/status-chip.svelte";

  let { project }: { project: Project } = $props();

  type TimelineFilter = "all" | number;

  let timelineFilter = $state<TimelineFilter>("all");

  const summary = $derived(dashboardSummary(project));
  const filters = $derived(
    summary.core ? [summary.core, ...summary.modules] : summary.modules,
  );
  const timeline = $derived(
    timelineFilter === "all"
      ? summary.timeline
      : summary.timeline.filter((entry) => entry.moduleNumber === timelineFilter),
  );
  const progressLabel = $derived(
    m["dashboard.progress"]
      .replace("{tested}", String(summary.progress.tested))
      .replace("{total}", String(summary.progress.total)),
  );
</script>

<div class="pt-prose">
  <h1 class="mb-1">{m["dashboard.title"]}</h1>
  <p class="mb-4 text-xs text-[var(--pt-muted)]">{project.name}</p>

  {#if summary.modules.length === 0 && !summary.core}
    <p class="text-sm text-[var(--pt-muted)]">{m["dashboard.empty"]}</p>
  {:else}
    <section class="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <div class="pt-panel p-3">
        <p class="text-xs text-[var(--pt-muted)]">{m["dashboard.total"]}</p>
        <p class="text-2xl font-semibold tabular-nums">{summary.counts.total}</p>
      </div>
      <div class="pt-panel p-3">
        <p class="text-xs text-[var(--pt-muted)]">{m["dashboard.tested"]}</p>
        <p class="text-2xl font-semibold tabular-nums">{summary.counts.tested}</p>
      </div>
      <div class="pt-panel p-3">
        <p class="text-xs text-[var(--pt-muted)]">{m["dashboard.inProgress"]}</p>
        <p class="text-2xl font-semibold tabular-nums">{summary.counts.inProgress}</p>
      </div>
      <div class="pt-panel p-3">
        <p class="text-xs text-[var(--pt-muted)]">{m["dashboard.pending"]}</p>
        <p class="text-2xl font-semibold tabular-nums">{summary.counts.pending}</p>
      </div>
      {#if summary.counts.blocked > 0}
        <div class="pt-panel p-3">
          <p class="text-xs text-[var(--pt-muted)]">{m["dashboard.blocked"]}</p>
          <p class="text-2xl font-semibold tabular-nums">{summary.counts.blocked}</p>
        </div>
      {/if}
    </section>

    {#if summary.core}
      <section class="pt-panel mb-4 flex flex-wrap items-center gap-3 p-3">
        <span
          class="text-xs font-semibold uppercase tracking-wider text-[var(--pt-muted)]"
        >
          {m["dashboard.core"]}
        </span>
        <span class="font-mono text-[0.78rem]">{summary.core.folder}</span>
        <span class="font-medium">{summary.core.name}</span>
        <StatusChip status={mapStatus(summary.core.state)} label={summary.core.state} />
        <span class="text-xs text-[var(--pt-muted)]">{m["dashboard.permanent"]}</span>
      </section>
    {/if}

    <section class="pt-panel mb-4 p-4">
      <p class="mb-2 text-sm font-medium">{progressLabel}</p>
      <div
        class="h-2 w-full overflow-hidden rounded-full bg-[var(--pt-surface-3)]"
        role="progressbar"
        aria-valuenow={summary.progress.percent}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={progressLabel}
      >
        <div
          class="h-full rounded-full bg-[var(--pt-accent)] transition-all"
          style:width={`${summary.progress.percent}%`}
        ></div>
      </div>
      {#if summary.progress.total === 0}
        <p class="mt-2 text-sm text-[var(--pt-muted)]">
          {m["dashboard.progressEmpty"]}
        </p>
      {/if}
    </section>

    <section class="mb-6">
      <h2 class="mb-2">{m["dashboard.modulesTitle"]}</h2>
      <div class="overflow-x-auto">
        <table class="pt-table pt-table--static">
          <thead>
            <tr>
              <th scope="col">{m["dashboard.module"]}</th>
              <th scope="col">{m["dashboard.name"]}</th>
              <th scope="col">{m["dashboard.state"]}</th>
              <th scope="col">{m["dashboard.lastUpdate"]}</th>
              <th scope="col">{m["dashboard.active"]}</th>
            </tr>
          </thead>
          <tbody>
            {#each summary.modules as module (module.number)}
              <tr>
                <td class="whitespace-nowrap font-mono text-[0.78rem]">{module.folder}</td
                >
                <td>{module.name}</td>
                <td>
                  <StatusChip status={mapStatus(module.state)} label={module.state} />
                </td>
                <td class="whitespace-nowrap">{module.lastUpdate ?? "—"}</td>
                <td class="whitespace-nowrap">
                  {module.active ? m["dashboard.active"] : "—"}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <div class="mb-2 flex flex-wrap items-end justify-between gap-2">
        <h2>{m["dashboard.timelineTitle"]}</h2>
        <label class="flex flex-col gap-1 text-xs text-[var(--pt-muted)]">
          <span>{m["dashboard.timelineFilter"]}</span>
          <select
            class="h-8 rounded-lg border border-[var(--pt-border)] bg-[var(--pt-surface)] px-2 text-[0.8125rem] text-[var(--pt-text)] shadow-[var(--pt-shadow-sm)]"
            value={String(timelineFilter)}
            onchange={(event) => {
              const value = event.currentTarget.value;
              timelineFilter = value === "all" ? "all" : Number.parseInt(value, 10);
            }}
          >
            <option value="all">{m["dashboard.allModules"]}</option>
            {#each filters as module (module.number)}
              <option value={String(module.number)}>{module.folder}</option>
            {/each}
          </select>
        </label>
      </div>

      {#if timeline.length === 0}
        <p class="text-sm text-[var(--pt-muted)]">{m["dashboard.timelineEmpty"]}</p>
      {:else}
        <ul class="space-y-1">
          {#each timeline as entry, index (`${entry.target.documentId}-${entry.date}-${entry.title}-${index}`)}
            <li>
              <button
                type="button"
                class="flex w-full flex-wrap items-baseline gap-2 rounded-md px-2 py-1 text-left hover:bg-[var(--pt-surface-2)]"
                onclick={() => reader.openRow([entry.target])}
              >
                <span class="font-mono text-xs text-[var(--pt-muted)]">{entry.date}</span>
                <span class="font-mono text-[0.72rem] text-[var(--pt-muted)]">
                  {entry.moduleFolder}
                </span>
                <span class="text-sm">{entry.title || m["dashboard.untitled"]}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/if}
</div>
