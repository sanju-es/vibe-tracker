<script lang="ts">
  import type { Status } from "../../lib/model/types";

  let { status, label }: { status: Status; label: string } = $props();
</script>

<span class="pt-chip" data-status={status.key ?? "neutral"}>{label}</span>
