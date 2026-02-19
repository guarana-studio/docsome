<script lang="ts">
  import { SearchIcon } from "@lucide/svelte";
  import { store } from "$lib/store.svelte";
  import type { OutlineNode } from "$lib/types";

  console.log(">>>S", store.config);

  const outline = $derived(store.outline?.[0]?.children);
  const activeSlug = $derived(store.activeSlug);

  function showCommandMenu() {
    return document.getElementById("commandMenu")?.showModal();
  }

  // Check if a node or any of its descendants is active
  function isNodeOrDescendantActive(node: OutlineNode): boolean {
    if (activeSlug === node.slug) return true;
    return node.children.some((child) => isNodeOrDescendantActive(child));
  }

  function scrollToSection(slug: string) {
    const element = document.getElementById(slug);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      // Update URL hash without triggering scroll
      history.pushState(null, "", `#${slug}`);
    }
  }

  function handleSummaryClick(
    event: MouseEvent & { currentTarget: HTMLElement },
    slug: string,
  ) {
    // If clicking the summary itself (not the expand arrow), scroll to section
    const target = event.target as HTMLElement;
    // Only scroll if clicking directly on summary or its text content
    if (target === event.currentTarget || target.tagName === "SPAN") {
      scrollToSection(slug);
    }
  }
</script>

{#snippet renderNode(node: OutlineNode)}
  {@const isActive = activeSlug === node.slug}
  {@const hasActiveChild = isNodeOrDescendantActive(node)}
  {#if node.children.length > 0}
    <details open={hasActiveChild}>
      <summary
        aria-controls="submenu-{node.slug}"
        class={[
          "text-neutral-700 dark:text-neutral-400 relative truncate",
          isActive &&
            "text-neutral-900! dark:text-neutral-100! bg-sidebar-accent",
        ]}
        onclick={(e) => handleSummaryClick(e, node.slug)}
      >
        <span class="truncate">{node.title}</span>
      </summary>
      <ul id="submenu-{node.slug}">
        {#each node.children as child}
          <li>
            {@render renderNode(child)}
          </li>
        {/each}
      </ul>
    </details>
  {:else}
    <a
      href="#{node.slug}"
      class={[
        "text-neutral-700 dark:text-neutral-400 relative block truncate",
        isActive && "text-neutral-900! dark:text-neutral-100!",
      ]}
      aria-current={isActive ? "page" : "false"}
      onclick={(e) => {
        e.preventDefault();
        scrollToSection(node.slug);
      }}
    >
      <span>{node.title}</span>
    </a>
  {/if}
{/snippet}

<aside class="sidebar" data-side="left">
  <nav aria-label="Sidebar navigation">
    <header>
      <a href="/" class="btn-ghost justify-start"
        >{store.config.title ?? "Docsome"}</a
      >
      <button
        type="text"
        class="input items-center cursor-pointer gap-2"
        onclick={showCommandMenu}
        data-hotkey="/"
      >
        <SearchIcon size={16} />
        <span class="text-left flex-1">Search...</span>
        <kbd class="kbd">/</kbd>
      </button>
    </header>
    <section class="scrollbar">
      <div role="group" aria-labelledby="group-label-content-1">
        <h3 id="group-label-content-1">Documentation</h3>
        <ul>
          {#each outline as node}
            <li>
              {@render renderNode(node)}
            </li>
          {/each}
        </ul>
      </div>
    </section>
    <div class="absolute left-2 bottom-2 text-sm text-neutral-500">
      Built with Docsome
    </div>
  </nav>
</aside>
