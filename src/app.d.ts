declare global {
  namespace App {
    declare module "*.md" {
      import type { Component } from "svelte";

      declare const MarkdownComponent: Component;

      export default MarkdownComponent;
    }
  }
}

export {};
