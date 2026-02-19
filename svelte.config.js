import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { svelteMarkdown } from "@sveltek/markdown";

/** @type {import("@sveltejs/vite-plugin-svelte").SvelteConfig} */
export default {
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  preprocess: [vitePreprocess(), svelteMarkdown()],
  extensions: [".svelte", ".md"],
  compilerOptions: {
    experimental: {
      async: true,
    },
  },
};
