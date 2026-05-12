import { describe, it, expect } from "vitest";
import { STAR_TYPES } from "../src/stars/starMap.js";

const EXPECTED_SISTERS = [
  "electra",
  "taygete",
  "alcyone",
  "maia",
  "celaeno",
  "sterope",
  "merope",
] as const;

const EXPECTED_VIRTUES: Record<string, string> = {
  electra: "Vision",
  taygete: "Courage",
  alcyone: "Serenity",
  maia: "Autonomy",
  celaeno: "Sustenance",
  sterope: "Patience",
  merope: "Humility",
};

const EXPECTED_SPECTRAL: Record<string, string> = {
  electra: "A",
  taygete: "B",
  alcyone: "F",
  maia: "O",
  celaeno: "Neutral",
  sterope: "G",
  merope: "M",
};

describe("STAR_TYPES", () => {
  it("exports exactly 7 stars", () => {
    expect(Object.keys(STAR_TYPES)).toHaveLength(7);
  });

  it("contains all seven Pleiades sisters", () => {
    EXPECTED_SISTERS.forEach((id) => {
      expect(STAR_TYPES).toHaveProperty(id);
    });
  });

  it("has no extra unexpected keys", () => {
    const keys = Object.keys(STAR_TYPES);
    keys.forEach((k) =>
      expect(EXPECTED_SISTERS as readonly string[]).toContain(k),
    );
  });

  EXPECTED_SISTERS.forEach((id) => {
    describe(`star: ${id}`, () => {
      it("has a matching id field", () => {
        expect(STAR_TYPES[id].id).toBe(id);
      });

      it("has a capitalized name", () => {
        const name = STAR_TYPES[id].name;
        expect(name[0]).toBe(name[0].toUpperCase());
        expect(name.length).toBeGreaterThan(0);
      });

      it("has the correct virtue", () => {
        expect(STAR_TYPES[id].virtue).toBe(EXPECTED_VIRTUES[id]);
      });

      it("has the correct spectral type", () => {
        expect(STAR_TYPES[id].spectralType).toBe(EXPECTED_SPECTRAL[id]);
      });

      it("has a non-empty SVG path string", () => {
        const svg = STAR_TYPES[id].svg;
        expect(typeof svg).toBe("string");
        expect(svg.length).toBeGreaterThan(0);
      });

      it("SVG path starts with /assets/svg/stars/ and ends with .svg", () => {
        const svg = STAR_TYPES[id].svg;
        expect(svg.startsWith("/assets/svg/stars/")).toBe(true);
        expect(svg.endsWith(".svg")).toBe(true);
      });

      it("SVG filename matches the star id", () => {
        const svg = STAR_TYPES[id].svg;
        expect(svg).toContain(`star-${id}.svg`);
      });
    });
  });

  it("all virtues are unique", () => {
    const virtues = Object.values(STAR_TYPES).map((s) => s.virtue);
    expect(new Set(virtues).size).toBe(virtues.length);
  });

  it("all spectral types are unique", () => {
    const spectral = Object.values(STAR_TYPES).map((s) => s.spectralType);
    expect(new Set(spectral).size).toBe(spectral.length);
  });

  it("all SVG paths are unique", () => {
    const paths = Object.values(STAR_TYPES).map((s) => s.svg);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
