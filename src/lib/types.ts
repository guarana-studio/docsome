export type OutlineNode = {
  depth: number;
  title: string;
  slug: string;
  children: OutlineNode[];
};
