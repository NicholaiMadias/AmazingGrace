import { describe, expect, it } from "vitest";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const EXT_ROOT = path.resolve(__dirname, "..", "extensions", "nexus-match-maker");

async function exists(relPath: string) {
  await stat(path.join(EXT_ROOT, relPath));
}

function assertPngSignature(buf: Buffer) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(buf.subarray(0, 8)).toEqual(sig);
}

describe("Nexus Match-Maker extension scaffold", () => {
  it("has a valid MV3 manifest referencing existing files", async () => {
    const manifestRaw = await readFile(path.join(EXT_ROOT, "manifest.json"), "utf8");
    const manifest = JSON.parse(manifestRaw) as Record<string, unknown>;

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBeTruthy();
    expect(manifest.version).toBeTruthy();

    const action = manifest.action as { default_popup?: string; default_icon?: Record<string, string> };
    expect(action?.default_popup).toBe("popup/popup.html");
    await exists("popup/popup.html");
    await exists("popup/popup.js");
    await exists("popup/popup.css");

    const bg = manifest.background as { service_worker?: string; type?: string };
    expect(bg?.service_worker).toBe("background/service-worker.js");
    expect(bg?.type).toBe("module");
    await exists("background/service-worker.js");
    await exists("engine/index.js");

    const icons = manifest.icons as Record<string, string>;
    expect(icons["16"]).toBe("icons/icon-16.png");
    expect(icons["32"]).toBe("icons/icon-32.png");
    expect(icons["48"]).toBe("icons/icon-48.png");
    expect(icons["128"]).toBe("icons/icon-128.png");
    await Promise.all(Object.values(icons).map((p) => exists(p)));
  });

  it("ships placeholder PNG icons with valid headers", async () => {
    for (const size of [16, 32, 48, 128]) {
      const p = path.join(EXT_ROOT, "icons", `icon-${size}.png`);
      const buf = await readFile(p);
      assertPngSignature(buf);
    }
  });

  it("includes an atlas SVG with expected gem symbols", async () => {
    const svg = await readFile(path.join(EXT_ROOT, "assets/svg/gem-atlas.svg"), "utf8");
    expect(svg).toContain('id="mm-gem-star"');
    expect(svg).toContain('id="mm-gem-heart"');
    expect(svg).toContain('id="mm-gem-cross"');
    expect(svg).toContain('id="mm-gem-flame"');
    expect(svg).toContain('id="mm-gem-drop"');
  });
});

