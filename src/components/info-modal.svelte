<script lang="ts">
  import Modal from "./primitives/modal.svelte";
  import { messages as m } from "../lib/i18n";

  let { onclose }: { onclose: () => void } = $props();
</script>

<Modal title={m["info.title"]} {onclose}>
  <div class="space-y-3 text-sm">
    <p>{m["info.disclaimer"]}</p>
    <p>{m["info.folders"]}</p>
    <p class="font-medium">{m["info.madeBy"]}</p>
    <a
      class="break-all text-[var(--pt-accent-strong)] underline underline-offset-2"
      href={m["info.github"]}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={m["info.githubLabel"]}
    >
      {m["info.githubLink"]}
    </a>
  </div>
</Modal>
