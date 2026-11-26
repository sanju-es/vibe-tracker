<script lang="ts">
  import { projectStore, reader, navigation } from "../stores/index";
  import { messages as m } from "../lib/i18n";
  import Modal from "./primitives/modal.svelte";
  import DocumentBody from "./document-body.svelte";

  const modal = $derived(reader.modal);

  let imageUrl = $state<string | null>(null);
  let imageFailed = $state(false);

  $effect(() => {
    imageUrl = null;
    imageFailed = false;
    if (!modal || modal.kind !== "image") return;
    const current = modal.path;
    let active = true;
    void projectStore.loadImage(current).then((value) => {
      if (!active) return;
      imageUrl = value;
      imageFailed = value === null;
    });
    return () => {
      active = false;
    };
  });

  const rowModalTitle = $derived.by(() => {
    if (!modal || modal.kind !== "row") return m["modal.rowHeading"];
    const onlyRows = modal.targets.every((target) => target.kind === "row");
    const heading = onlyRows ? m["modal.rowHeading"] : m["modal.itemHeading"];
    return modal.identifier ? `${heading} · ${modal.identifier}` : heading;
  });

  function goTo(
    documentId: string,
    rowId: string | null,
    anchor: string | null = null,
  ): void {
    reader.close();
    navigation.select(documentId);
    if (rowId) reader.highlight(rowId);
    requestAnimationFrame(() => {
      const target = rowId
        ? document.querySelector<HTMLElement>(`[data-row-id="${rowId}"]`)
        : anchor
          ? document.getElementById(anchor)
          : null;
      target?.scrollIntoView({ block: "center" });
    });
  }
</script>

{#if modal}
  {#if modal.kind === "row"}
    <Modal title={rowModalTitle} onclose={() => reader.close()}>
      {#if modal.targets.length > 1}
        <p class="mb-3 text-sm text-[var(--pt-muted)]">{m["modal.ambiguous"]}</p>
      {/if}
      <div class="space-y-4">
        {#each modal.targets as target, targetIndex (targetIndex)}
          <section class="pt-panel p-3">
            <h3 class="mb-1 text-sm font-semibold">{target.documentTitle}</h3>
            {#if target.kind === "item"}
              {#if target.sectionTitle}
                <p class="mb-2 text-xs text-[var(--pt-muted)]">{target.sectionTitle}</p>
              {/if}
              <p class="text-sm">{target.text}</p>
              <button
                type="button"
                class="pt-button mt-3"
                onclick={() => goTo(target.documentId, null, target.anchor)}
              >
                {m["modal.goToDocument"]}
              </button>
            {:else}
              <dl class="grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-3 gap-y-1 text-sm">
                {#each target.headers as header, index (index)}
                  <dt class="font-medium text-[var(--pt-muted)]">{header}</dt>
                  <dd class="break-words">{target.cells[index]?.text ?? ""}</dd>
                {/each}
              </dl>
              <button
                type="button"
                class="pt-button mt-3"
                onclick={() => goTo(target.documentId, target.rowId)}
              >
                {m["modal.goToDocument"]}
              </button>
            {/if}
          </section>
        {/each}
      </div>
    </Modal>
  {:else if modal.kind === "document"}
    {@const target = projectStore.project?.documents.find(
      (doc) => doc.id === modal.documentId,
    )}
    {#if target}
      <Modal title={target.title} onclose={() => reader.close()}>
        <div class="max-h-[70vh] overflow-y-auto pr-1">
          <DocumentBody document={target} />
        </div>
        <button
          type="button"
          class="pt-button mt-3"
          onclick={() => goTo(target.id, null)}
        >
          {m["modal.goToDocument"]}
        </button>
      </Modal>
    {/if}
  {:else}
    <Modal title={m["modal.document"]} onclose={() => reader.close()}>
      {#if imageUrl}
        <img class="mx-auto max-h-[70vh] w-auto" src={imageUrl} alt={modal.alt} />
      {:else if imageFailed}
        <p class="text-sm text-[var(--pt-muted)]">{m["modal.missingImage"]}</p>
      {:else}
        <p class="text-sm text-[var(--pt-muted)]" aria-busy="true">{modal.alt}</p>
      {/if}
    </Modal>
  {/if}
{/if}
