import { writeFile, readFile } from "node:fs/promises";
import path from "node:path";

import { createServer } from "vite";

const vite = await createServer();
const { render } = await vite.ssrLoadModule("svelte/server");
const { default: App } = await vite.ssrLoadModule("/src/app.svelte");
const { head, body } = await render(App);

const distHtml = await readFile(path.join("dist", "index.html"), "utf-8");
const html = distHtml.replace("<!--ssg-head-->", head).replace("<!--ssg-body-->", body);
await writeFile(path.join("dist", "index.html"), html);

await vite.close();
