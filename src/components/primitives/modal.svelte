<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import { messages as m } from "../../lib/i18n";
  import Icon from "./icon.svelte";

  let {
    title,
    onclose,
    children,
  }: { title: string; onclose: () => void; children: Snippet } = $props();

  let container = $state<HTMLDivElement | null>(null);

  const FOCUSABLE =
    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

  function trap(event: KeyboardEvent): void {
    const root = container;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (element) => element.offsetParent !== null,
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first?.focus();
    } else if (event.shiftKey && active === first) {
      event.preventDefault();
      last?.focus();
    }
  }

  onMount(() => {
    const previous =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    container?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onclose();
        return;
      }
      if (event.key === "Tab") trap(event);
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      previous?.focus();
    };
  });
</script>

<div
  class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4 sm:p-8"
  role="presentation"
  onclick={(event) => {
    if (event.target === event.currentTarget) onclose();
  }}
>
  <div
    bind:this={container}
    class="pt-panel w-full max-w-3xl p-4 shadow-xl"
    role="dialog"
    aria-modal="true"
    aria-label={title}
    tabindex="-1"
  >
    <header class="mb-3 flex items-start justify-between gap-4">
      <h2 class="text-base font-semibold">{title}</h2>
      <button type="button" class="pt-button" onclick={onclose}>
        <Icon name="X" size={14} />
        <span>{m["modal.close"]}</span>
      </button>
    </header>
    {@render children()}
  </div>
</div>
