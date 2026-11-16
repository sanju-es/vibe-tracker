<script lang="ts">
  import type { CellReference, InlineRun } from "../../lib/model/types";
  import { messages as m, t } from "../../lib/i18n";
  import ImageNode from "./image.svelte";

  let {
    runs,
    onopenlink,
    onopenimage,
    onreference = () => {},
  }: {
    runs: InlineRun[];
    onopenlink: (run: InlineRun) => void;
    onopenimage: (run: InlineRun) => void;
    onreference?: (reference: CellReference) => void;
  } = $props();
</script>

{#snippet renderRuns(list: InlineRun[])}
  {#each list as run, index (index)}
    {#if run.kind === "text"}
      {run.text}
    {:else if run.kind === "break"}
      <br />
    {:else if run.kind === "strong"}
      <strong>{@render renderRuns(run.children ?? [])}</strong>
    {:else if run.kind === "em"}
      <em>{@render renderRuns(run.children ?? [])}</em>
    {:else if run.kind === "code"}
      <code>{run.text}</code>
    {:else if run.kind === "reference" && run.ref}
      <button
        type="button"
        class="pt-ref"
        title={t("reference.open", { id: run.ref.identifier })}
        aria-label={t("reference.open", { id: run.ref.identifier })}
        onclick={(event) => {
          event.stopPropagation();
          if (run.ref) onreference(run.ref);
        }}
      >
        {run.text}
      </button>
    {:else if run.kind === "link"}
      {#if run.linkKind === "document" || run.linkKind === "image"}
        <button
          type="button"
          class="pt-link"
          onclick={(event) => {
            event.stopPropagation();
            onopenlink(run);
          }}
        >
          {@render renderRuns(run.children ?? [{ kind: "text", text: run.text }])}
        </button>
      {:else if run.linkKind === "anchor"}
        <a
          class="pt-link"
          href={`#${run.anchor ?? ""}`}
          onclick={(event) => event.stopPropagation()}
          >{@render renderRuns(run.children ?? [{ kind: "text", text: run.text }])}</a
        >
      {:else}
        <span
          class="text-[var(--pt-muted)] underline decoration-dotted"
          title={run.linkKind === "broken" ? m["document.brokenLink"] : run.href}
        >
          {@render renderRuns(run.children ?? [{ kind: "text", text: run.text }])}
        </span>
      {/if}
    {:else if run.kind === "image"}
      <ImageNode
        path={run.targetPath ?? run.href ?? ""}
        alt={run.text}
        onclick={() => onopenimage(run)}
      />
    {/if}
  {/each}
{/snippet}

{@render renderRuns(runs)}
