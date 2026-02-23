import type { ConfigSchema } from "./schema";
import type { OutlineNode, Paragraph } from "./types";

declare global {
  namespace App {
    declare module "*.md" {
      import type { Component } from "svelte";

      declare const MarkdownComponent: Component;

      export default MarkdownComponent;
    }
  }
}

declare module "virtual:docsome" {
  export const config: z.infer<typeof ConfigSchema>;
  export const html: string;
  export const outline: OutlineNode[];
  export const paragraphs: Paragraph[];
}

export {};
