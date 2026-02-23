import type { z } from "zod";

import type { ConfigSchema } from "./schema";

export type OutlineNode = {
  depth: number;
  title: string;
  slug: string;
  children: OutlineNode[];
};

export type Paragraph = { id: string; title: string; text: string };

export type AppContext = {
  config: z.infer<typeof ConfigSchema>;
  html: string;
  outline: OutlineNode[];
  paragraphs: Paragraph[];
};
