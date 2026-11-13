<script lang="ts">
  import type { BlockNode, CellReference, InlineRun, Table } from "../../lib/model/types";
  import { messages as m } from "../../lib/i18n";
  import InlineRuns from "./inline-runs.svelte";
  import ImageNode from "./image.svelte";
  import DataTable from "./data-table.svelte";

  let {
    node,
    table,
    documentId,
    documentTitle,
    onopenlink,
    onopenimage,
    onreference = () => {},
  }: {
    node: BlockNode;
    table?: Table;
    documentId: string;
    documentTitle: string;
    onopenlink: (run: InlineRun) => void;
    onopenimage: (run: InlineRun) => void;
    onreference?: (reference: CellReference) => void;
  } = $props();
</script>

{#if node.type === "heading"}
  <svelte:element
    this={`h${Math.min(Math.max(node.level, 1), 6)}`}
    id={node.anchor}
    data-anchor={node.anchor}
  >
    <InlineRuns runs={node.runs} {onopenlink} {onopenimage} {onreference} />
  </svelte:element>
{:else if node.type === "paragraph"}
  <p><InlineRuns runs={node.runs} {onopenlink} {onopenimage} {onreference} /></p>
{:else if node.type === "list"}
  <svelte:element this={node.ordered ? "ol" : "ul"}>
    {#each node.items as item, index (index)}
      <li><InlineRuns runs={item} {onopenlink} {onopenimage} {onreference} /></li>
    {/each}
  </svelte:element>
{:else if node.type === "code"}
  <pre><code class:language-unknown={false}>{node.text}</code></pre>
{:else if node.type === "quote"}
  <blockquote>
    <InlineRuns runs={node.runs} {onopenlink} {onopenimage} {onreference} />
  </blockquote>
{:else if node.type === "table"}
  {#if table}
    <DataTable {table} {documentId} {documentTitle} />
  {/if}
{:else if node.type === "image"}
  <ImageNode
    path={node.path}
    alt={node.alt}
    onclick={() =>
      onopenimage({
        kind: "image",
        text: node.alt,
        targetPath: node.path,
      })}
  />
{:else if node.type === "rule"}
  <hr />
{:else}
  <p class="text-sm text-[var(--pt-muted)]">
    {m["unknown.node"].replace("{type}", node.tokenType)}
  </p>
{/if}
