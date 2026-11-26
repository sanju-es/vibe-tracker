<script lang="ts">
  import type { CellReference, Document, InlineRun } from "../lib/model/types";
  import { messages as m, statusLabelKey } from "../lib/i18n";
  import { mapStatus } from "../lib/semantics/status";
  import StatusChip from "./primitives/status-chip.svelte";
  import InlineRuns from "./nodes/inline-runs.svelte";

  let {
    document,
    onopenlink,
    onopenimage,
    onreference,
  }: {
    document: Document;
    onopenlink: (run: InlineRun) => void;
    onopenimage: (run: InlineRun) => void;
    onreference: (reference: CellReference) => void;
  } = $props();

  const meta = $derived(document.meta);
  const status = $derived(meta.status ? mapStatus(meta.status.token) : null);
  const hasContent = $derived(
    meta.fields.length > 0 ||
      status !== null ||
      meta.lastUpdate !== null ||
      meta.history !== null,
  );

  const labels: Record<string, string> = {
    Purpose: m["meta.purpose"],
    "Read when": m["meta.readWhen"],
    "Canonical for": m["meta.canonicalFor"],
    "Do not duplicate": m["meta.doNotDuplicate"],
  };
</script>

{#if hasContent}
  <aside
    class="mb-8 rounded-xl border border-[var(--pt-border)] bg-[var(--pt-surface-2)] px-4 py-3"
    aria-label={m["meta.title"]}
  >
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      {#if status}
        <StatusChip
          {status}
          label={status.key ? m[statusLabelKey(status.key)] : status.value}
        />
      {/if}
      {#if meta.status?.date}
        <time class="text-[0.75rem] text-[var(--pt-muted)]" datetime={meta.status.date}>
          {meta.status.date}
        </time>
      {/if}
      {#if meta.lastUpdate}
        <span class="text-[0.75rem] text-[var(--pt-muted)]">
          {m["meta.lastUpdate"]}:
          <time datetime={meta.lastUpdate}>{meta.lastUpdate}</time>
        </span>
      {/if}
      {#if meta.history}
        <span class="text-[0.75rem] text-[var(--pt-muted)]">
          {m["meta.history"]}: {meta.history}
        </span>
      {/if}
    </div>

    {#if meta.fields.length > 0}
      <dl class="mt-3 grid gap-x-6 gap-y-2 text-[0.8125rem] sm:grid-cols-2">
        {#each meta.fields as field (field.key)}
          <div>
            <dt class="font-semibold text-[var(--pt-muted)]">
              {labels[field.key] ?? field.key}
            </dt>
            <dd class="text-[var(--pt-text)]">
              <InlineRuns runs={field.runs} {onopenlink} {onopenimage} {onreference} />
            </dd>
          </div>
        {/each}
      </dl>
    {/if}
  </aside>
{/if}
