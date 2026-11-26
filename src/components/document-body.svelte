<script lang="ts">
  import type {
    BlockNode,
    CellReference,
    Document,
    InlineRun,
    Table,
  } from "../lib/model/types";
  import { reader } from "../stores/index";
  import Node from "./nodes/node.svelte";
  import DocumentHeader from "./document-header.svelte";

  let { document }: { document: Document } = $props();

  const tables = $derived(new Map<string, Table>(document.tables.map((t) => [t.id, t])));

  function openLink(run: InlineRun): void {
    if (run.linkKind === "document" && run.targetPath) {
      reader.openDocument(run.targetPath);
    }
  }

  function openImage(run: InlineRun): void {
    if (run.targetPath) reader.openImage(run.targetPath, run.text);
  }

  function openReference(reference: CellReference): void {
    reader.openRow(reference.targets, reference.identifier);
  }

  const headingsFirst = $derived(document.nodes[0]?.type === "heading");
</script>

{#snippet header()}
  <DocumentHeader
    {document}
    onopenlink={openLink}
    onopenimage={openImage}
    onreference={openReference}
  />
{/snippet}

{#snippet nodeItem(node: BlockNode)}
  <Node
    {node}
    table={node.type === "table" ? tables.get(node.tableId) : undefined}
    documentId={document.id}
    documentTitle={document.title}
    onopenlink={openLink}
    onopenimage={openImage}
    onreference={openReference}
  />
{/snippet}

{#if !headingsFirst}
  {@render header()}
{/if}

<article class="pt-prose">
  {#each document.nodes as node, index (index)}
    {@render nodeItem(node)}
    {#if index === 0 && headingsFirst}
      {@render header()}
    {/if}
  {/each}
</article>
