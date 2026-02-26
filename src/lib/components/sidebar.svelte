<script lang="ts">
  import { onMount } from "svelte";
  import { PersistedState } from "runed";
  import { SearchIcon, ChevronsUpDownIcon, ChevronsDownUpIcon, SunIcon, MoonIcon } from "@lucide/svelte";
  import { store } from "$lib/store.svelte";
  import appContext from "virtual:docsome";

  import type { OutlineNode } from "$lib/types";

  const { outline, config } = appContext;

  let outlineExpanded = $state(false)
  const docOutline = outline?.[0]?.children;
  const title = config?.title;
  const logo = config?.logo;
  const sideBar = config?.sideBar;
  const activeSlug = $derived(store.activeSlug);

  const sidebarHidden = new PersistedState("sidebar-hidden", false);

  function showCommandMenu() {
    const commandMenu = document.getElementById("commandMenu") as HTMLDialogElement
    return commandMenu?.showModal();
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

  function toggleOutlineExpanded() {
    outlineExpanded = !outlineExpanded;
    // HACK: Keep sidebar opened on mobile
    document.dispatchEvent(new CustomEvent("basecoat:sidebar", { detail: { action: 'open' } }));
  }

  function toggleTheme() {
    return document.dispatchEvent(new CustomEvent("basecoat:theme"));
  }

  onMount(() => {
    document.addEventListener("basecoat:sidebar", () => {
      sidebarHidden.current = !sidebarHidden.current;
    });
  })
</script>

{#snippet renderNode(node: OutlineNode)}
  {@const isActive = activeSlug === node.slug}
  {@const hasActiveChild = isNodeOrDescendantActive(node)}
  {#if node.children.length > 0}
    <details open={outlineExpanded || hasActiveChild}>
      <summary
        aria-controls="submenu-{node.slug}"
        class={[
          "text-neutral-700 dark:text-neutral-300 relative truncate",
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
        "text-neutral-700 dark:text-neutral-300 relative block truncate",
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

<aside class="sidebar" data-side="left" data-initial-open={sidebarHidden.current}>
  <nav aria-label="Sidebar navigation">
    <header>
      <div class="flex justify-between items-center">
        <a href="/" class="btn-ghost px-1 justify-start items-center">
          {#if typeof config.logo.src === "string"}
            <img
              src={`data:image/svg+xml;base64,${logo.src}`}
              class={["size-6", logo?.invertible && "dark:invert"]}
              alt={config.logo?.alt}
            />
          {:else}
            <img
              src={`data:image/svg+xml;base64,${logo.src?.light}`}
              class="size-6 flex dark:hidden"
              alt={config.logo?.alt}
            />
            <img
              src={`data:image/svg+xml;base64,${logo.src?.dark}`}
              class="size-6 hidden dark:flex"
              alt={config.logo?.alt}
            />
          {/if}
          <span>{title ?? "Docsome"}</span>
        </a>
        <button
            aria-label="Toggle dark mode"
            data-tooltip="Toggle dark mode [m]"
            data-side="bottom"
            data-align="end"
            onclick={toggleTheme}
            class="btn-icon-outline"
            data-hotkey="m"
        >
            <span class="hidden dark:block"><SunIcon /></span>
            <span class="block dark:hidden"><MoonIcon /></span>
        </button>
      </div>
      <button
        class="btn-outline items-center cursor-pointer gap-2"
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
        <div class="flex justify-between items-center">
          <h3 id="group-label-content-1">Documentation</h3>
          <button id="toggleOutlineExpanded" class="btn-icon-ghost" onclick={toggleOutlineExpanded}>
            {#if outlineExpanded}
              <ChevronsDownUpIcon />
            {:else}
              <ChevronsUpDownIcon />
            {/if}
          </button>
        </div>
        <ul>
          {#each docOutline as node}
            <li>
              {@render renderNode(node)}
            </li>
          {/each}
        </ul>
      </div>
      {#each sideBar?.linkGroups as linkGroup, index}
        <div role="group" aria-labelledby="group-label-content-{index + 2}">
          <h3 id="group-label-content-{index + 2}">{linkGroup.label}</h3>
          <ul>
            {#each linkGroup.links as link}
              <li>
                <a
                  href={link.href}
                  class="text-neutral-700 dark:text-neutral-300 relative block truncate"
                  aria-current="false"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{link.label}</span>
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </section>
  </nav>
</aside>
