import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/cli.ts",
  platform: "node",
  noExternal: ["clerc", "consola"],
  inlineOnly: false,
});
