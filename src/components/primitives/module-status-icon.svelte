<script lang="ts">
  import type { Status } from "../../lib/model/types";
  import Icon from "./icon.svelte";

  const NAMES: Record<string, string> = {
    pending: "Circle",
    "in-analysis": "SearchCheck",
    "implementation-proposal": "FilePen",
    "in-development": "Wrench",
    implemented: "CircleCheck",
    tested: "BadgeCheck",
    blocked: "CircleSlash",
    active: "Play",
    new: "CirclePlus",
    "in-progress": "Loader",
    deferred: "Clock",
    discarded: "Trash2",
    moved: "ArrowRightLeft",
    draft: "FileText",
    proposed: "FilePen",
    approved: "BadgeCheck",
    current: "CircleCheck",
    superseded: "Archive",
    archived: "Archive",
    neutral: "Circle",
  };

  let { status, label }: { status: Status; label: string } = $props();

  const name = $derived(NAMES[status.key ?? "neutral"] ?? "Circle");
</script>

<span
  class="pt-status-icon inline-flex items-center"
  data-status={status.key ?? "neutral"}
  role="img"
  aria-label={label}
  title={label}
>
  <Icon {name} size={12} strokeWidth={2.4} />
</span>
