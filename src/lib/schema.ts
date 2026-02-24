import { z } from "zod";

const DEFAULT_LOGO =
  "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSJub25lIj48ZGVmcz48Y2xpcFBhdGggaWQ9ImEiIGNsYXNzPSJmcmFtZS1jbGlwIGZyYW1lLWNsaXAtZGVmIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgcng9IjAiIHJ5PSIwIi8+PC9jbGlwUGF0aD48L2RlZnM+PGcgY2xhc3M9ImZyYW1lLWNvbnRhaW5lci13cmFwcGVyIj48ZyBjbGFzcz0iZnJhbWUtY29udGFpbmVyLWJsdXIiPjxnIGNsYXNzPSJmcmFtZS1jb250YWluZXItc2hhZG93cyIgY2xpcC1wYXRoPSJ1cmwoI2EpIj48ZyBjbGFzcz0iZmlsbHMiPjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBjbGFzcz0iZnJhbWUtYmFja2dyb3VuZCIgcng9IjAiIHJ5PSIwIi8+PC9nPjxnIGNsYXNzPSJmcmFtZS1jaGlsZHJlbiI+PHBhdGggZD0ibTE2OCA0OCA0MC00MHYxMTkuOGgtNDBaTTE2OCAxMjcuOWwyMCAyMCAyMCAyMHY3OS44aC0uMnYuM0gxMjhsLTIwLTIwLTIwLTIwaDgwWiIgY2xhc3M9ImZpbGxzIiBzdHlsZT0iZmlsbDojMzhhOTg0O2ZpbGwtb3BhY2l0eToxIi8+PHBhdGggZD0iTTQ4IDg4aDgwbDQwIDQwSDg4djgwbC0yMC0yMC0yMC0yMHYtNDBaIiBjbGFzcz0iZmlsbHMiIHN0eWxlPSJmaWxsOiMzOGE5ODQ7ZmlsbC1vcGFjaXR5OjEiLz48L2c+PC9nPjwvZz48L2c+PC9zdmc+";

export const BaseLinkSchema = z.object({
  href: z.string(),
});

export const LinkSchema = BaseLinkSchema.extend({
  label: z.string(),
});

export const IconLinkSchema = BaseLinkSchema.extend({
  icon: z.enum(["github", "twitter", "linkedin", "facebook", "twitch", "globe"]).optional(),
  label: z.string().optional(),
});

export const LinkGroupSchema = z.object({
  label: z.string(),
  links: z.array(LinkSchema).default([]),
});

export const HeadAttributes = z.record(z.string(), z.union([z.string(), z.boolean()]).optional());

export const HeadItemSchema = z.object({
  tag: z.string(),
  attrs: HeadAttributes.optional(),
  content: z.string().optional(),
});

export const ModeAwareLogoSrc = z.object({
  light: z.string(),
  dark: z.string(),
});

export const LogoSchema = z.object({
  src: z.union([z.string(), ModeAwareLogoSrc]).default(DEFAULT_LOGO),
  alt: z.string().optional(),
  invertible: z.boolean().default(false),
});

const TopBarSchema = z.object({
  llms: z.boolean().default(true),
  links: z.array(z.union([IconLinkSchema])).optional(),
});

export const ConfigSchema = z.object({
  lang: z.string().default("en"),
  title: z.string().default("Docsome"),
  description: z.string().optional(),
  base: z.string().optional(),
  logo: LogoSchema.default(LogoSchema.parse({})),
  head: z.array(HeadItemSchema).default([]),
  topBar: TopBarSchema.default(TopBarSchema.parse({})),
  sideBar: z
    .object({
      linkGroups: z.array(LinkGroupSchema).default([]),
    })
    .optional(),
  announcement: z
    .object({
      text: z.string(),
      href: z.string().optional(),
    })
    .optional(),
  footer: z
    .object({
      text: z.string(),
    })
    .optional(),
});
