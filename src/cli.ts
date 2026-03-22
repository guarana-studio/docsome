#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import chokidar from "chokidar";
import { Cli } from "clerc";
import { consola } from "consola";
import { build, createServer, type UserConfig, type Plugin } from "vite";
import { z } from "zod";

import packageJson from "../package.json";
import { parseContent } from "./lib/content";

const UrlSchema = z.url();

function isUrl(str: string): boolean {
  return UrlSchema.safeParse(str).success;
}

async function fetchContent(filePath: string): Promise<string> {
  if (isUrl(filePath)) {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filePath}: ${response.status} ${response.statusText}`);
    }
    return response.text();
  }
  return readFile(filePath, "utf-8");
}

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
  server: {
    host: true,
  },
} satisfies UserConfig;

function createDocsomePlugin(filePath: string): Plugin {
  let appContext = parseContent({ content: "", sourcePath: filePath });

  return {
    name: "docsome-virtual",
    async buildStart() {
      const content = await fetchContent(filePath);
      appContext = parseContent({ content, sourcePath: filePath });
    },
    configureServer(server) {
      const watcher = chokidar.watch(filePath, {
        persistent: true,
        ignoreInitial: true,
        usePolling: true,
        interval: 100,
      });

      watcher.on("change", async () => {
        const content = await fetchContent(filePath);
        appContext = parseContent({ content, sourcePath: filePath });
        const moduleNode = server.moduleGraph.getModuleById("virtual:docsome");
        if (moduleNode) {
          server.moduleGraph.invalidateModule(moduleNode);
        }
        server.ws.send({ type: "full-reload" });
      });

      // Clean up watcher when server closes
      server.httpServer?.on("close", () => {
        watcher.close();
      });
    },
    resolveId(id) {
      if (id === "virtual:docsome") {
        return id;
      }
    },
    load(id) {
      if (id === "virtual:docsome") {
        return `export default ${JSON.stringify(appContext)};`;
      }
    },
  };
}

async function startServer({ filePath, publicDir }: { filePath: string; publicDir?: string }) {
  const docsomePlugin = createDocsomePlugin(filePath);
  const fileDir = path.dirname(filePath);
  const server = await createServer({
    ...baseViteConfig,
    publicDir,
    server: {
      ...baseViteConfig.server,
      fs: {
        allow: [fileDir],
      },
    },
    plugins: [...baseViteConfig.plugins, docsomePlugin],
  });
  return server;
}

async function prerender({
  filePath,
  cwd,
  outDir,
  publicDir,
}: {
  filePath: string;
  cwd: string;
  outDir: string;
  publicDir?: string;
}) {
  const server = await startServer({ filePath, publicDir });
  const { render } = await server.ssrLoadModule("svelte/server");
  const { default: App } = await server.ssrLoadModule("/src/app.svelte");
  const { head, body } = await render(App);

  const indexPath = path.resolve(cwd, outDir, "index.html");
  const distHtml = await readFile(indexPath, "utf-8");
  const html = distHtml.replace("<!--ssg-head-->", head).replace("<!--ssg-body-->", body);
  await writeFile(indexPath, html);

  await server.close();
}

async function runDevServer({ filePath, publicDir }: { filePath: string; publicDir?: string }) {
  const server = await startServer({ filePath, publicDir });
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
      publicDir: {
        type: String,
        short: "p",
        description: "Public directory to serve static assets from",
      },
    },
  })
  .command("dev", "Start development server", {
    parameters: ["<file>"],
    flags: {
      publicDir: {
        type: String,
        short: "p",
        description: "Public directory to serve static assets from",
      },
    },
  })
  .on("build", async (ctx) => {
    const cwd = process.cwd();
    const outDir = path.resolve(cwd, ctx.flags.outDir ?? "dist");
    const publicDir = ctx.flags.publicDir ? path.resolve(cwd, ctx.flags.publicDir) : undefined;
    const filePath = isUrl(ctx.parameters.file)
      ? ctx.parameters.file
      : path.resolve(cwd, ctx.parameters.file);
    const content = await fetchContent(filePath);
    const appContext = parseContent({ content, sourcePath: filePath });
    const docsomePlugin = createDocsomePlugin(filePath);
    await build({
      ...baseViteConfig,
      base: appContext.config.base,
      publicDir,
      plugins: [...baseViteConfig.plugins, docsomePlugin],
      build: {
        ...baseViteConfig.build,
        outDir,
      },
    });

    consola.start("Prerendering started");
    await prerender({ filePath, cwd, outDir, publicDir });
    consola.info("Writing llms.txt");
    await writeFile(path.resolve(cwd, outDir, "llms.txt"), appContext.markdown);
    consola.success("Prerendering completed");
  })
  .on("dev", async (ctx) => {
    const cwd = process.cwd();
    const publicDir = ctx.flags.publicDir ? path.resolve(cwd, ctx.flags.publicDir) : undefined;
    const filePath = path.resolve(cwd, ctx.parameters.file);
    return runDevServer({ filePath, publicDir });
  })
  .parse();
