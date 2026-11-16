<script lang="ts">
  interface LucideApi {
    icons: Record<string, unknown>;
    createElement(node: unknown): SVGElement;
  }

  const FALLBACK: Record<string, string> = {
    RefreshCw: "↻",
    FolderOpen: "▸",
    Folder: "▸",
    ChevronDown: "▾",
    ChevronRight: "▸",
    FileText: "·",
    Files: "≡",
    Search: "⌕",
    RotateCcw: "↺",
    ArrowUpDown: "↕",
    ArrowUp: "▲",
    ArrowDown: "▼",
    Info: "i",
    X: "×",
    Circle: "•",
    CircleCheck: "✓",
    CircleSlash: "⊘",
    Clock: "◷",
    Play: "▶",
    Wrench: "🔧",
    SearchCheck: "⌕",
    FilePen: "✎",
    BadgeCheck: "✓",
    TriangleAlert: "!",
    LoaderCircle: "◌",
    BookOpen: "▤",
    Filter: "⛃",
    House: "⌂",
    ListTodo: "☰",
    ListChecks: "☑",
    LayoutDashboard: "▦",
  };

  let {
    name,
    size = 16,
    strokeWidth = 2,
    label,
    class: className = "",
  }: {
    name: string;
    size?: number;
    strokeWidth?: number;
    label?: string;
    class?: string;
  } = $props();

  let host = $state<HTMLSpanElement | null>(null);

  $effect(() => {
    const element = host;
    if (!element) return;
    element.replaceChildren();

    const api = (window as unknown as { lucide?: LucideApi }).lucide;
    const node = api?.icons?.[name];
    if (api && node) {
      const svg = api.createElement(node);
      svg.setAttribute("width", String(size));
      svg.setAttribute("height", String(size));
      svg.setAttribute("stroke-width", String(strokeWidth));
      svg.setAttribute("aria-hidden", label ? "false" : "true");
      element.append(svg);
      return;
    }

    element.textContent = FALLBACK[name] ?? "•";
  });
</script>

<span
  bind:this={host}
  class={`pt-icon ${className}`}
  style:font-size={`${size}px`}
  role={label ? "img" : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : "true"}
></span>
