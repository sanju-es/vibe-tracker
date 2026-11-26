import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
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

/**
 * The distributed file keeps its `index.html` name; the version is metadata for
 * support and release identification. It comes from `package.json` and carries
 * no build date, so the same inputs produce the same artifact.
 */
function injectArtifactMetadata(): Plugin {
  return {
    name: "project-tracking:artifact-metadata",
    apply: "build",
    transformIndexHtml(html) {
      if (html.includes('name="project-tracking-version"')) return html;
      const pkg = JSON.parse(
        readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf8"),
      ) as { version?: string };
      const version = String(pkg.version ?? "");
      if (!version) throw new Error("package.json has no version");
      return html.replace(
        "<head>",
        `<head>\n    <meta name="project-tracking-version" content="${version}" />`,
      );
    },
  };
}

/**
 * Third-party notices travel with the distributed file: the single-file build
 * is often copied on its own, so the copyright and permission notices of the
 * bundled libraries are embedded as a comment.
 */
function injectThirdPartyNotices(): Plugin {
  return {
    name: "project-tracking:third-party-notices",
    apply: "build",
    transformIndexHtml(html) {
      if (html.includes("THIRD-PARTY SOFTWARE NOTICES")) return html;
      const notice = readFileSync(
        fileURLToPath(new URL("./NOTICE", import.meta.url)),
        "utf8",
      ).trim();
      return html.replace("<head>", `<head>\n    <!--\n${notice}\n    -->`);
    },
  };
}

export default defineConfig({
  plugins: [
    svelte(),
    tailwindcss(),
    viteSingleFile(),
    injectContentSecurityPolicy(),
    injectArtifactMetadata(),
    injectThirdPartyNotices(),
  ],
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
