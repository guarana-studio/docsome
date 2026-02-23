import { slugifyWithCounter } from "@sindresorhus/slugify";
import dedent from "dedent";
import katex from "katex";
import { Marked, type Token } from "marked";
import markedShiki from "marked-shiki";
import removeMarkdown from "remove-markdown";
import { bundledLanguages, createHighlighter } from "shiki";
import YAML from "yaml";

import { ConfigSchema } from "./schema";
import type { OutlineNode, Paragraph } from "./types";

const highlighter = await createHighlighter({
  themes: ["min-dark", "min-light"],
  langs: Object.keys(bundledLanguages),
});

const marked = new Marked();

const renderer = new marked.Renderer();
const headingSlugify = slugifyWithCounter();
renderer.heading = ({ text, depth }) => {
  const id = headingSlugify(text);
  return `<h${depth} id="${id}" class="scroll-mt-20"><a href="#${id}" class="no-underline font-semibold">${text}</a></h${depth}>`;
};
renderer.link = ({ href, text }) => {
  return `<a href="${href}" class="link" target="_blank" rel="noopener noreferrer">${text}</a>`;
};
renderer.html = ({ text }) => {
  return `<div class="not-prose">${text}</div>`;
};
renderer.table = (token) => {
  const renderCell = (cell: { text: string; header?: boolean; align?: string | null }) => {
    const tag = cell.header ? "th" : "td";
    const align = cell.align ? ` align="${cell.align}"` : "";
    return `<${tag}${align}>${cell.text}</${tag}>`;
  };
  let headerCells = "";
  for (let j = 0; j < token.header.length; j++) {
    headerCells += renderCell({ ...token.header[j], header: true });
  }
  const header = `<tr>\n${headerCells}</tr>\n`;
  let body = "";
  for (let j = 0; j < token.rows.length; j++) {
    const row = token.rows[j];
    let rowCells = "";
    for (let k = 0; k < row.length; k++) {
      rowCells += renderCell(row[k]);
    }
    body += `<tr>\n${rowCells}</tr>\n`;
  }
  if (body) body = `<tbody>${body}</tbody>`;
  return '<table class="table">\n' + "<thead>\n" + header + "</thead>\n" + body + "</table>\n";
};
renderer.checkbox = ({ checked }) => {
  return "<input " + (checked ? 'checked="" ' : "") + 'disabled="" type="checkbox" class="input"> ';
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
        if (lang === "mermaid") return `<pre class="mermaid">${code}</pre>`;
        if (lang === "math") {
          return katex.renderToString(code, {
            throwOnError: false,
            displayMode: true,
            output: "html",
          });
        }
        return highlighter.codeToHtml(code, {
          lang,
          themes: { light: "min-light", dark: "min-dark" },
        });
      },
      container: dedent`
        <figure class="highlighted-code relative shadow-sm rounded overflow-hidden group my-4">
          <textarea class="sr-only js-raw" aria-hidden="true" tabindex="-1">%t</textarea>
          <button
            class="absolute btn-icon-outline top-2 right-2 opacity-0 group-hover:opacity-100"
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

export function buildOutline(tokens: Token[]) {
  const slugify = slugifyWithCounter();
  const root: OutlineNode = { depth: 0, children: [], title: "", slug: "" };
  const stack: OutlineNode[] = [root];

  for (const t of tokens) {
    if (t.type !== "heading") continue;

    // Only include headers up to depth 3 (###)
    if (t.depth > 3) continue;

    const node: OutlineNode = {
      depth: t.depth,
      title: t.text,
      slug: slugify(t.text, { preserveTrailingDash: true }),
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

function extractTextFromToken(token: Token): string {
  if (token.type === "paragraph" && "text" in token) {
    return token.text;
  }
  if (token.type === "list" && "items" in token) {
    return (token.items as Array<{ tokens: Token[] }>)
      .map((item) =>
        item.tokens
          .filter((t: Token) => "text" in t)
          .map((t: Token) => (t as { text: string }).text)
          .join(" "),
      )
      .join("\n");
  }
  if (token.type === "code" && "text" in token) {
    return token.text;
  }
  if (token.type === "blockquote" && "text" in token) {
    return token.text;
  }
  if (token.type === "html" && "text" in token) {
    return token.text;
  }
  return "";
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

  for (const token of tokens) {
    if (token.type === "heading") {
      flushSection();
      currentHeading = "text" in token ? token.text : "";
      currentSlug = slugify(currentHeading);
    } else {
      const text = extractTextFromToken(token);
      if (text) {
        sectionTexts.push(text);
      }
    }
  }

  // Flush the last section
  flushSection();

  return sections;
}

export async function parseContent(content: string) {
  const { config, markdown } = splitFrontmatter(content);
  const html = await marked.parse(markdown);
  const tokens = marked.lexer(markdown);
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
