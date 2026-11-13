import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { defineConfig, type Plugin } from "vite";

/**
 * Content security policy of the distributed artifact.
 *
 * A single-file build inlines the script and the stylesheet, so
 * `'unsafe-inline'` is required for both. The only allowed external origin is
 * jsDelivr, host of the allowlisted icon library and font files (D-22). The
 * fonts are fetched with their SRI hash, which is why `connect-src` names that
 * host; `connect-src` is otherwise unused.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "script-src 'unsafe-inline' https://cdn.jsdelivr.net",
  "style-src 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' https://cdn.jsdelivr.net",
  "connect-src https://cdn.jsdelivr.net",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

function injectContentSecurityPolicy(): Plugin {
  return {
    name: "project-tracking:csp",
    apply: "build",
    transformIndexHtml(html) {
      const meta = `<meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />`;
      return html.replace("<head>", `<head>\n    ${meta}`);
    },
  };
}

export default defineConfig({
  plugins: [svelte(), tailwindcss(), viteSingleFile(), injectContentSecurityPolicy()],
  build: {
    target: "es2022",
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    reportCompressedSize: false,
    modulePreload: false,
  },
  server: {
    port: 5173,
  },
});
