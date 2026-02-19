import slugify from "@sindresorhus/slugify";
import type { Token } from "marked";

import type { OutlineNode } from "./types";

export function buildOutline(tokens: Token[]) {
  const root: OutlineNode = { depth: 0, children: [], title: "", slug: "" };
  const stack: OutlineNode[] = [root];

  for (const t of tokens) {
    if (t.type !== "heading") continue;

    const node: OutlineNode = {
      depth: t.depth,
      title: t.text,
      slug: slugify(t.text),
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
