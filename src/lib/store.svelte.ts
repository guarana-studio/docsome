import slugify from "@sindresorhus/slugify";
import dedent from "dedent";
import { Marked } from "marked";
import markedShiki from "marked-shiki";
import { codeToHtml } from "shiki";
import YAML from "yaml";
import { z } from "zod";

import { buildOutline } from "./markdown";
import type { OutlineNode } from "./types";

const LinkSchema = z.object({
  href: z.string(),
  label: z.string(),
});

const IconLinkSchema = z.object({
  icon: z.enum(["github", "twitter", "linkedin"]),
  href: z.string(),
});

const LinkGroupSchema = z.object({
  label: z.string(),
  links: z.array(LinkSchema),
});

const HeadItemSchema = z.object({
  tag: z.string(),
  attrs: z.record(z.string(), z.string().optional()),
});

const ConfigSchema = z.object({
  lang: z.string().optional(),
  title: z.string().default("Docsome"),
  description: z.string().optional(),
  base: z.string().optional(),
  head: z.array(HeadItemSchema).default([]),
  topBar: z
    .object({
      links: z.array(z.union([LinkSchema, IconLinkSchema])).optional(),
    })
    .optional(),
  sideBar: z
    .object({
      links: z.array(LinkGroupSchema).optional(),
    })
    .optional(),
});

const marked = new Marked();

const renderer = new marked.Renderer();
renderer.heading = ({ text, depth }) => {
  const id = slugify(text);
  return `<h${depth} id="${id}" class="scroll-mt-20"><a href="#${id}" class="no-underline font-semibold">${text}</a></h${depth}>`;
};
renderer.link = ({ href, text }) => {
  return `<a href="${href}" class="link" target="_blank" rel="noopener noreferrer">${text}</a>`;
};

marked
  .use({
    async: true,
    gfm: true,
    renderer,
  })
  .use(
    markedShiki({
      async highlight(code, lang) {
        return codeToHtml(code, {
          lang,
          themes: { light: "min-light", dark: "min-dark" },
        });
      },
      container: dedent`
        <figure class="highlighted-code relative shadow-sm rounded overflow-hidden">
          <textarea class="sr-only js-raw" aria-hidden="true" tabindex="-1">%t</textarea>
          <button
            class="absolute btn-sm-icon-outline top-2 right-2"
            type="button"
            onclick="
              const raw = this.closest('figure')?.querySelector('.js-raw')?.value ?? '';
              navigator.clipboard.writeText(raw);
              document.dispatchEvent(new CustomEvent('basecoat:toast', {
                detail: {
                  config: {
                    category: 'success',
                    title: 'Code copied to clipboard',
                  }
                }
              }))
            "
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy-icon lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
          %s
        </figure>
      `,
    }),
  );

function splitFrontmatter(doc: string) {
  const re = /^\s*---\s*$\r?\n([\s\S]*?)\r?\n^\s*---\s*$\r?\n?([\s\S]*)/m;
  const m = doc.match(re);

  return m
    ? { config: ConfigSchema.parse(YAML.parse(m[1])), markdown: m[2] }
    : { config: ConfigSchema.parse({}), markdown: doc };
}

class Store {
  html = $state("");
  outline = $state<OutlineNode[]>([]);
  config = $state<z.infer<typeof ConfigSchema>>();
  activeSlug = $state<string>("");

  async init({ content }: { content: string }) {
    const { config, markdown } = splitFrontmatter(content);
    this.config = config;
    this.html = await marked.parse(markdown);
    const tokens = marked.lexer(markdown);
    this.outline = buildOutline(tokens);
  }

  setActiveSlug(slug: string) {
    this.activeSlug = slug;
  }
}

export const store = new Store();
