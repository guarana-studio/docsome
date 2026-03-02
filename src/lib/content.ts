import { container, type MarkdownItContainerOptions } from "@mdit/plugin-container";
import { footnote } from "@mdit/plugin-footnote";
import { snippet, type MarkdownItSnippetOptions } from "@mdit/plugin-snippet";
import { tasklist } from "@mdit/plugin-tasklist";
import { slugifyWithCounter, type CountableSlugify } from "@sindresorhus/slugify";
import dedent from "dedent";
import MarkdownIt from "markdown-it";
import { escapeHtml, unescapeAll } from "markdown-it/lib/common/utils.mjs";
import type { RenderRule } from "markdown-it/lib/renderer.mjs";
import Token from "markdown-it/lib/token.mjs";
import { nanoid } from "nanoid";
import removeMarkdown from "remove-markdown";
import { bundledLanguages, createHighlighter } from "shiki";
import YAML from "yaml";
import { z } from "zod";

import { ConfigSchema } from "./schema";
import type { OutlineNode, Paragraph } from "./types";

const FRAMEMAID_URL = "https://framemaid.guarana.studio";

const AlertType = z.enum(["info", "warning", "danger", "success"]);

const ALERT_ICONS = {
  info: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info-icon lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  warning:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert-icon lucide-circle-alert"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>',
  danger:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-x-icon lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
  success:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-icon lucide-circle-check"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
} as const;

const highlighter = await createHighlighter({
  themes: ["min-dark", "min-light"],
  langs: Object.keys(bundledLanguages),
});

let headingSlugify: CountableSlugify | undefined;

function wrapHighlighted({ raw, highlighted }: { raw: string; highlighted: string }) {
  return dedent`
    <figure class="highlighted-code relative shadow-sm rounded overflow-hidden group my-4 not-prose">
      <textarea class="sr-only js-raw" aria-hidden="true" tabindex="-1">${raw}</textarea>
      <button
        class="absolute btn-sm-icon-outline top-2 right-2 opacity-100 md:opacity-0 group-hover:opacity-100"
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
      ${highlighted}
    </figure>
  `;
}

const tabsRegex = /^==\s*(?<name>[^\r\n]+)\s*$\r?\n(?<content>[\s\S]*?)^\s*==\s*$/gm;

const mdIt = MarkdownIt({
  linkify: true,
  html: true,
  highlight(code, lang) {
    if (lang === "mermaid") {
      const mermaidUrl = new URL(FRAMEMAID_URL);
      mermaidUrl.searchParams.append("method", "renderMermaid");
      mermaidUrl.searchParams.append("params[]", btoa(code));
      return wrapHighlighted({
        raw: code,
        highlighted: `<iframe src="${mermaidUrl.toString()}" class="w-full h-[32rem] overflow-hidden">${code}</iframe>`,
      });
    }
    if (lang === "math") {
      const katexUrl = new URL(FRAMEMAID_URL);
      katexUrl.searchParams.append("method", "renderKatex");
      katexUrl.searchParams.append("params[]", btoa(code));
      return wrapHighlighted({
        raw: code,
        highlighted: `<iframe src="${katexUrl.toString()}" class="w-full h-[16rem] overflow-hidden">${code}</iframe>`,
      });
    }
    if (lang === "tabs") {
      const tabGroupId = nanoid();
      const matchedTabs = code.matchAll(tabsRegex);
      const tabs = [...matchedTabs].map((matched) => ({
        name: matched.groups?.name.trim(),
        content: matched.groups?.content.replace(/\s+$/, ""),
      }));
      const tabButtons = tabs
        .map((tab, index) => {
          const tabId = `${tabGroupId}-${index + 1}`;
          return dedent`
            <button type="button" role="tab" id="tab-${tabId}" aria-controls="panel-${tabId}" aria-selected="${index === 0 ? "true" : "false"}" tabindex="0">${tab.name}</button>
          `;
        })
        ?.join("\n");
      const tabPanels: string = tabs
        .map((tab, index) => {
          const tabId = `${tabGroupId}-${index + 1}`;
          return dedent`
          <div role="tabpanel" id="panel-${tabId}" aria-labelledby="panel-${tabId}" tabindex="-1" aria-selected="${index === 0 ? "true" : "false"}"${index === 0 ? "" : " hidden"}>
            ${mdIt.render(tab.content ?? "")}
          </div>
        `;
        })
        ?.join("\n");
      return dedent`
        <div class="tabs w-full">
          <nav role="tablist" class="w-full">
            ${tabButtons}
          </nav>
          ${tabPanels}
        </div>
      `;
    }
    return wrapHighlighted({
      raw: code,
      highlighted: highlighter.codeToHtml(code, {
        lang,
        themes: { light: "min-light", dark: "min-dark" },
      }),
    });
  },
})
  .use(footnote)
  .use(tasklist, { checkboxClass: "input" })
  .use(container, {
    name: "alert",
    openRender: (tokens, index) => {
      const token = tokens[index];
      const alertType = AlertType.parse(token.info.trim().split(" ")?.[1]);
      const alertClass = alertType === "danger" ? "alert-destructive" : "alert";
      return dedent`
        <div class="${alertClass} not-prose">
          ${ALERT_ICONS[alertType]}
          <h2>
      `;
    },
    closeRender: () => {
      return dedent`
          </h2>
        </div>
      `;
    },
  } satisfies MarkdownItContainerOptions)
  .use(snippet, {
    currentPath: (env) => env.filePath,
  } satisfies MarkdownItSnippetOptions)
  .use((md: MarkdownIt) => {
    const fallbackRenderer: RenderRule = (tokens, idx, options, _env, self) => {
      return self.renderToken(tokens, idx, options);
    };
    const defaultLinkRenderer = md.renderer.rules.link_open ?? fallbackRenderer;
    md.renderer.rules.link_open = (tokens, index, options, env, self) => {
      tokens[index].attrSet("target", "_blank");
      tokens[index].attrSet("rel", "noopener noreferrer");
      return defaultLinkRenderer?.(tokens, index, options, env, self);
    };
    md.renderer.rules.fence = function (tokens, idx, options, _env, slf) {
      const token = tokens[idx];
      const info = token.info ? unescapeAll(token.info).trim() : "";
      let langName = "";
      let langAttrs = "";

      if (info) {
        const arr = info.split(/(\s+)/g);
        langName = arr[0];
        langAttrs = arr.slice(2).join("");
      }

      let highlighted;
      if (options.highlight) {
        highlighted =
          options.highlight(token.content, langName, langAttrs) || escapeHtml(token.content);
      } else {
        highlighted = escapeHtml(token.content);
      }

      if (highlighted.indexOf("<pre") === 0) {
        return highlighted + "\n";
      }

      if (info) {
        return highlighted;
      }

      return `<pre><code${slf.renderAttrs(token)}>${highlighted}</code></pre>\n`;
    };
    md.renderer.rules.heading_open = (tokens, index) => {
      const token = tokens[index];
      const nextToken = tokens[index + 1];
      const headingId = headingSlugify?.(nextToken.content);
      return `<${token.tag} id="${headingId}" class="scroll-mt-20"><a href="#${headingId}" class="no-underline font-semibold">`;
    };
    md.renderer.rules.heading_close = (tokens, index) => {
      const token = tokens[index];
      return `</a></${token.tag}>`;
    };
    md.renderer.rules.table_open = () => {
      return `<table class="table">`;
    };
  });

function splitFrontmatter(doc: string) {
  const re = /^\s*---\s*$\r?\n([\s\S]*?)\r?\n^\s*---\s*$\r?\n?([\s\S]*)/m;
  const m = doc.match(re);

  return m
    ? { config: ConfigSchema.parse(YAML.parse(m[1])), markdown: m[2] }
    : { config: ConfigSchema.parse({}), markdown: doc };
}

export function buildOutline(tokens: Token[]) {
  const slugify = slugifyWithCounter();
  const root: OutlineNode = { depth: 0, children: [], title: "", slug: "" };
  const stack: OutlineNode[] = [root];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type !== "heading_open") continue;

    // Get depth from tag (h1, h2, h3, etc.)
    const depth = parseInt(t.tag.slice(1), 10);

    // Only include headers up to depth 3 (###)
    if (depth > 3) continue;

    // Get the content from the next inline token
    const contentToken = tokens[i + 1];
    const title = contentToken?.type === "inline" ? contentToken.content : "";

    const node: OutlineNode = {
      depth,
      title,
      slug: slugify(title, { preserveTrailingDash: true }),
      children: [],
    };

    while (stack.length && stack[stack.length - 1].depth >= node.depth) {
      stack.pop();
    }

    // Parent is now the last item
    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }

  return root.children;
}

function buildParagraphs(tokens: Token[]): Array<Paragraph> {
  const slugify = slugifyWithCounter();
  const sections: Array<Paragraph> = [];
  let currentHeading = "";
  let currentSlug = "";
  const sectionTexts: string[] = [];

  const flushSection = () => {
    if (currentHeading && sectionTexts.length > 0) {
      const rawText = sectionTexts.join("\n\n");
      const plainText = removeMarkdown(rawText);
      sections.push({
        id: currentSlug,
        title: currentHeading,
        text: plainText,
      });
      sectionTexts.length = 0;
    }
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Handle heading_open tokens
    if (token.type === "heading_open") {
      flushSection();
      // Get the content from the next inline token
      const contentToken = tokens[i + 1];
      currentHeading = contentToken?.type === "inline" ? contentToken.content : "";
      currentSlug = slugify(currentHeading);
      // Skip the inline and heading_close tokens
      i += 2;
      continue;
    }

    // Handle paragraph_open - get the next inline token
    if (token.type === "paragraph_open") {
      const inlineToken = tokens[i + 1];
      if (inlineToken?.type === "inline") {
        sectionTexts.push(inlineToken.content);
      }
      // Skip the inline and paragraph_close tokens
      i += 2;
      continue;
    }

    // Handle fence (code blocks)
    if (token.type === "fence") {
      sectionTexts.push(token.content);
      continue;
    }

    // Handle blockquote_open - collect all content until blockquote_close
    if (token.type === "blockquote_open") {
      const blockquoteTexts: string[] = [];
      i++;
      while (i < tokens.length && tokens[i].type !== "blockquote_close") {
        if (tokens[i].type === "inline") {
          blockquoteTexts.push(tokens[i].content);
        } else if (tokens[i].type === "fence") {
          blockquoteTexts.push(tokens[i].content);
        }
        i++;
      }
      if (blockquoteTexts.length > 0) {
        sectionTexts.push(blockquoteTexts.join("\n"));
      }
      continue;
    }

    // Handle list items - collect content from nested inline tokens
    if (token.type === "bullet_list_open" || token.type === "ordered_list_open") {
      const listTexts: string[] = [];
      i++;
      while (
        i < tokens.length &&
        tokens[i].type !== "bullet_list_close" &&
        tokens[i].type !== "ordered_list_close"
      ) {
        if (tokens[i].type === "list_item_open") {
          // Look for inline content inside the list item
          i++;
          while (i < tokens.length && tokens[i].type !== "list_item_close") {
            if (tokens[i].type === "inline") {
              listTexts.push(tokens[i].content);
            } else if (tokens[i].type === "paragraph_open") {
              // Skip paragraph_open, look for inline
              if (tokens[i + 1]?.type === "inline") {
                listTexts.push(tokens[i + 1].content);
                i += 2; // Skip inline and paragraph_close
                continue;
              }
            }
            i++;
          }
        } else {
          i++;
        }
      }
      if (listTexts.length > 0) {
        sectionTexts.push(listTexts.join("\n"));
      }
      continue;
    }

    // Handle html_block
    if (token.type === "html_block") {
      sectionTexts.push(token.content);
      continue;
    }

    // Handle inline tokens directly (in case they're not inside paragraph_open)
    if (token.type === "inline") {
      sectionTexts.push(token.content);
    }
  }

  // Flush the last section
  flushSection();

  return sections;
}

export function parseContent({ content, sourcePath }: { content: string; sourcePath: string }) {
  headingSlugify = slugifyWithCounter();
  const { config, markdown } = splitFrontmatter(content);
  const html = mdIt.render(markdown, {
    filePath: sourcePath,
  });
  const tokens = mdIt.parse(markdown, { filePath: sourcePath });
  const outline = buildOutline(tokens);
  const paragraphs = buildParagraphs(tokens);
  return {
    config,
    markdown,
    html,
    outline,
    paragraphs,
  };
}
