#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { Cli } from "clerc";
import { consola } from "consola";
import { build, createServer, type UserConfig } from "vite";
import virtual, { updateVirtualModule } from "vite-plugin-virtual";

import packageJson from "../package.json";
import { parseContent } from "./lib/content";

const baseViteConfig = {
  root: import.meta.dirname,
  plugins: [svelte({ compilerOptions: { experimental: { async: true } } }), tailwindcss()],
  resolve: {
    alias: {
      $lib: path.resolve(import.meta.dirname, "src", "lib"),
    },
  },
  build: {
    emptyOutDir: true,
  },
} satisfies UserConfig;

async function getAppContext(filePath: string) {
  const content = await readFile(filePath, "utf-8");
  return parseContent(content);
}

async function setupPluginVirtual(filePath: string) {
  const appContext = await getAppContext(filePath);
  return virtual({
    "virtual:docsome": appContext,
  });
}

async function startServer({ filePath }: { filePath: string }) {
  const pluginVirtual = await setupPluginVirtual(filePath);
  return createServer({
    ...baseViteConfig,
    plugins: [
      ...baseViteConfig.plugins,
      {
        name: "parse-content",
        async hotUpdate() {
          const appContext = await getAppContext(filePath);
          return updateVirtualModule(pluginVirtual, "virtual:docsome", appContext);
        },
      },
      pluginVirtual,
    ],
  });
}

async function prerender({
  filePath,
  cwd,
  outDir,
}: {
  filePath: string;
  cwd: string;
  outDir: string;
}) {
  const server = await startServer({ filePath });
  const { render } = await server.ssrLoadModule("svelte/server");
  const { default: App } = await server.ssrLoadModule("/src/app.svelte");
  const { head, body } = await render(App);

  const indexPath = path.resolve(cwd, outDir, "index.html");
  const distHtml = await readFile(indexPath, "utf-8");
  const html = distHtml.replace("<!--ssg-head-->", head).replace("<!--ssg-body-->", body);
  await writeFile(indexPath, html);

  await server.close();
}

async function runDevServer(filePath: string) {
  const server = await startServer({ filePath });
  await server.listen();

  server.printUrls();
  server.bindCLIShortcuts({ print: true });

  return server;
}

Cli()
  .scriptName("docsome")
  .description("Zero to docs under 10 seconds")
  .version(packageJson.version)
  .command("build", "Build production version of your docs", {
    parameters: ["<file>"],
    flags: {
      outDir: {
        type: String,
        short: "o",
        description: "Output directory",
      },
    },
  })
  .command("dev", "Start development server", {
    parameters: ["<file>"],
  })
  .on("build", async (ctx) => {
    const cwd = process.cwd();
    const outDir = path.resolve(cwd, ctx.flags.outDir ?? "dist");
    const filePath = path.resolve(cwd, ctx.parameters.file);
    const content = await readFile(filePath, "utf-8");
    const appContext = parseContent(content);
    const pluginVirtual = await setupPluginVirtual(filePath);
    await build({
      ...baseViteConfig,
      base: appContext.config.base,
      plugins: [...baseViteConfig.plugins, pluginVirtual],
      build: {
        ...baseViteConfig.build,
        outDir,
      },
    });

    consola.start("Prerendering started");
    await prerender({ filePath, cwd, outDir });
    consola.info("Writing llms.txt");
    await writeFile(path.resolve(cwd, outDir, "llms.txt"), appContext.markdown);
    consola.success("Prerendering completed");
  })
  .on("dev", async (ctx) => {
    const filePath = path.resolve(process.cwd(), ctx.parameters.file);
    return runDevServer(filePath);
  })
  .parse();
