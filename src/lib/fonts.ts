/**
 * Web fonts. Each file is fetched with its SRI hash before being registered, so
 * a tampered or unreachable asset simply leaves the system font stack in place.
 */
interface FontAsset {
  url: string;
  integrity: string;
  weight: "400" | "600";
}

const FONTS: readonly FontAsset[] = [
  {
    url: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.3.0/files/inter-latin-400-normal.woff2",
    integrity: "sha384-tqh0FAOjwwo8QcrfmptsbU/OH9394dupGj2d2zJQ7lFJdE5ouzRr13+2JlwV7vrE",
    weight: "400",
  },
  {
    url: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.3.0/files/inter-latin-600-normal.woff2",
    integrity: "sha384-PgPe7nbXjfWJ+EXT7W6+yMgP76I2DtUpq/Nz+F/CJWQulrcJf6dhnYpmHoPgh0CQ",
    weight: "600",
  },
];

const FAMILY = "Inter";

export async function loadFonts(): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return;

  await Promise.all(
    FONTS.map(async ({ url, integrity, weight }) => {
      try {
        const response = await fetch(url, {
          integrity,
          mode: "cors",
          credentials: "omit",
        });
        if (!response.ok) return;
        const buffer = await response.arrayBuffer();
        const face = new FontFace(FAMILY, buffer, { weight, display: "swap" });
        await face.load();
        document.fonts.add(face);
      } catch {
        // The system stack stays in use; the interface does not depend on the font.
      }
    }),
  );
}
