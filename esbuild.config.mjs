import esbuild from "esbuild";

const isWatch = process.argv.includes("--watch");

const context = await esbuild.context({
  entryPoints: ["main.ts"],
  bundle: true,
  outfile: "main.js",
  format: "cjs",
  platform: "browser",
  target: "es2018",
  sourcemap: isWatch ? "inline" : false,
  external: [
    "obsidian",
    "electron",
    "child_process",
    "node:child_process",
    "fs",
    "os",
    "path",
    "@codemirror/state",
    "@codemirror/view",
    "@codemirror/language"
  ],
  logLevel: "info"
});

if (isWatch) {
  await context.watch();
  console.log("[Codexian] watching...");
} else {
  await context.rebuild();
  await context.dispose();
  console.log("[Codexian] build done");
}
