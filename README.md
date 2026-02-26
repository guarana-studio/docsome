# Docsome

[![pkg.pr.new](https://pkg.pr.new/badge/guarana-studio/docsome)](https://pkg.pr.new/~/guarana-studio/docsome)

> Zero to docs under 15 seconds.

Docsome is a CLI that transforms any Markdown file into an elegant, static documentation with search and `llms.txt`. Built on top of [Vite](https://vite.dev/) and [Svelte](https://svelte.dev/).

[Read documentation](http://docsome.guarana.studio/)

## Features

- **Development abstracted:** You only have to care about the source markdown file.
- **Minimal and elegant UI:** UI tailored to accomodate any branding.
- **Easy to maintain:** No separate docs app to care about.
- **Fully static:** The build is fully static, you won't need any backend to serve requests.
- **AI agent friendly:** `llms.txt` are generated automatically for your site.

## Usage

### Prerequisite

- Node.js
- Terminal

### Building docs

```sh
npx docsome build DOCS.md
# or Bun
bunx docsome build DOCS.md
```

### Development server

```sh
npx docsome dev DOCS.md
# or Bun
bunx docsome dev DOCS.md
```

### Adding to existing JS app

```json
"scripts": {
  "docs:build": "npx docsome build DOCS.md --outDir docs_dist",
  "docs:dev": "npx docsome dev DOCS.md",
}
```

## Roadmap

### To do

- [ ] AI content search
- [ ] Code highlighting theme settings
- [ ] Toggle for serif font
- [ ] Twoslash integration
- [ ] OG Image generation
- [ ] Define variables in the front matter

### Done

- [x] Code highlighting
- [x] Mermaid integration
- [x] KaTeX integration
- [x] Top bar, side bar, footer, and announcement customization
- [x] Custom scripts and styles in `<head>`
