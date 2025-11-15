"use strict";

const fs = require("fs");
const path = require("path");
const { build } = require("esbuild");

async function ensureParse5CommonJS() {
  const repoRoot = path.resolve(__dirname, "..");
  const parse5Dir = path.join(repoRoot, "node_modules", "parse5");
  const pkgPath = path.join(parse5Dir, "package.json");
  const esmEntry = path.join(parse5Dir, "dist", "index.js");
  const cjsEntry = path.join(parse5Dir, "dist", "index.cjs");

  if (!fs.existsSync(pkgPath) || !fs.existsSync(esmEntry)) {
    console.warn("[fix-parse5] parse5 package not found – skipping compatibility patch.");
    return;
  }

  if (!fs.existsSync(cjsEntry)) {
    await build({
      entryPoints: [esmEntry],
      outfile: cjsEntry,
      format: "cjs",
      platform: "node",
      bundle: true,
      target: ["node18"],
    });
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.exports = {
    require: "./dist/index.cjs",
    default: "./dist/index.js",
  };
  pkg.main = "dist/index.cjs";

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

ensureParse5CommonJS().catch((error) => {
  console.error("[fix-parse5] Failed to patch parse5:", error);
  process.exitCode = 1;
});
