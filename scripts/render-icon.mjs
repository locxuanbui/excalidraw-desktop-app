import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

// Regenerate the raster source for `tauri icon`:
//   node scripts/render-icon.mjs && npx tauri icon /tmp/icon-1024.png
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "assets", "icon.svg"));
const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: 1024 },
  background: "rgba(0,0,0,0)",
});
writeFileSync("/tmp/icon-1024.png", resvg.render().asPng());
console.log("wrote /tmp/icon-1024.png");
