<script lang="ts">
  import type { WorkspaceProject } from "../lib/workspace/types";
  import { messages as m, t, type MessageKey } from "../lib/i18n";
  import Icon from "./primitives/icon.svelte";

  let {
    entry,
    onselect,
    onretry,
  }: {
    entry: WorkspaceProject;
    onselect: (id: string) => void;
    onretry: (id: string) => void;
  } = $props();

  const headingId = $derived(
    `workspace-project-${entry.id === "" ? "root" : entry.id}`.replace(
      /[^a-zA-Z0-9_-]/g,
      "-",
    ),
  );
  const progressLabel = $derived(
    entry.summary
      ? t("dashboard.progress", {
          tested: entry.summary.progress.tested,
          total: entry.summary.progress.total,
        })
      : "",
  );
</script>

<article
  id={`workspace-card-${entry.id === "" ? "root" : entry.id}`}
  class="pt-panel flex h-full flex-col gap-3 p-4"
  aria-labelledby={headingId}
  tabindex="-1"
>
  <header class="flex items-start gap-2">
    <span
      class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--pt-accent-soft)] text-[var(--pt-accent-strong)]"
    >
      <Icon name="Folder" size={16} />
    </span>
    <div class="min-w-0">
      <h2 id={headingId} class="truncate text-base font-semibold">{entry.name}</h2>
      {#if entry.path !== "" && entry.path !== entry.name}
        <p class="truncate text-xs text-[var(--pt-muted)]">{entry.path}</p>
      {/if}
    </div>
  </header>

  {#if entry.error}
    <p class="text-sm text-[var(--pt-muted)]">
      {t(entry.error.key as MessageKey, { path: entry.error.path ?? "" })}
    </p>
    <div class="mt-auto">
      <button
        type="button"
        class="pt-button"
        title={t("workspace.retryProject", { name: entry.name })}
        onclick={() => onretry(entry.id)}
      >
        <Icon name="RotateCcw" size={14} />
        <span>{m["workspace.retry"]}</span>
      </button>
    </div>
  {:else if entry.summary}
    <dl class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
      <div>
        <dt class="text-[var(--pt-muted)]">{m["dashboard.tested"]}</dt>
        <dd class="font-semibold tabular-nums">
          {entry.summary.progress.tested}/{entry.summary.progress.total}
        </dd>
      </div>
      <div>
        <dt class="text-[var(--pt-muted)]">{m["dashboard.inProgress"]}</dt>
        <dd class="font-semibold tabular-nums">{entry.summary.counts.inProgress}</dd>
      </div>
      <div>
        <dt class="text-[var(--pt-muted)]">{m["dashboard.pending"]}</dt>
        <dd class="font-semibold tabular-nums">{entry.summary.counts.pending}</dd>
      </div>
      {#if entry.summary.counts.blocked > 0}
        <div>
          <dt class="text-[var(--pt-muted)]">{m["dashboard.blocked"]}</dt>
          <dd class="font-semibold tabular-nums">{entry.summary.counts.blocked}</dd>
        </div>
      {/if}
      {#if entry.summary.counts.implemented > 0}
        <div>
          <dt class="text-[var(--pt-muted)]">{m["dashboard.implemented"]}</dt>
          <dd class="font-semibold tabular-nums">
            {entry.summary.counts.implemented}
          </dd>
        </div>
      {/if}
      {#if entry.summary.counts.other > 0}
        <div>
          <dt class="text-[var(--pt-muted)]">{m["dashboard.other"]}</dt>
          <dd class="font-semibold tabular-nums">{entry.summary.counts.other}</dd>
        </div>
      {/if}
    </dl>

    <div
      class="h-2 w-full overflow-hidden rounded-full bg-[var(--pt-surface-3)]"
      role="progressbar"
      aria-valuenow={entry.summary.progress.percent}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label={progressLabel}
    >
      <div
        class="h-full rounded-full bg-[var(--pt-accent)] transition-all"
        style:width={`${entry.summary.progress.percent}%`}
      ></div>
    </div>
    <p class="text-xs text-[var(--pt-muted)]">{progressLabel}</p>

    <dl class="grid gap-1 text-xs">
      <div class="flex items-baseline justify-between gap-2">
        <dt class="text-[var(--pt-muted)]">{m["workspace.activeModule"]}</dt>
        <dd class="truncate font-medium">
          {entry.summary.activeModule ?? m["dashboard.none"]}
        </dd>
      </div>
      <div class="flex items-baseline justify-between gap-2">
        <dt class="text-[var(--pt-muted)]">{m["workspace.lastUpdate"]}</dt>
        <dd class="font-medium">{entry.summary.lastUpdate ?? m["dashboard.none"]}</dd>
      </div>
    </dl>

    <div class="mt-auto">
      <button
        type="button"
        class="pt-button pt-button--primary"
        title={t("workspace.openProject", { name: entry.name })}
        onclick={() => onselect(entry.id)}
      >
        <span>{m["workspace.open"]}</span>
        <Icon name="ArrowRight" size={14} />
      </button>
    </div>
  {:else}
    <p class="text-sm text-[var(--pt-muted)]">{m["workspace.notReady"]}</p>
    <div class="mt-auto">
      <button
        type="button"
        class="pt-button"
        title={t("workspace.openProject", { name: entry.name })}
        onclick={() => onselect(entry.id)}
      >
        <span>{m["workspace.open"]}</span>
      </button>
    </div>
  {/if}
</article>
