/// <reference types="vite/client" />

declare module "virtual:docsome" {
  import type { z } from "zod";

  import type { ConfigSchema } from "./lib/schema";
  import type { OutlineNode, Paragraph } from "./lib/types";
  export const config: z.infer<ConfigSchema>;
  export const html: string;
  export const outline: OutlineNode[];
  export const paragraphs: Paragraph[];
}
