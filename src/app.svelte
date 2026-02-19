<script lang="ts">
  import { onMount } from "svelte";
  import { install } from "@github/hotkey";
  import Sidebar from "$lib/components/sidebar.svelte";
  import TopBar from "$lib/components/top-bar.svelte";
  import CommandMenu from "$lib/components/command-menu.svelte";
  import { store } from "$lib/store.svelte";
  import { initTheme } from "$lib/theme";
  import { createScrollObserver } from "$lib/scroll-observer";
  import content from "./test.md?raw";

  let title = $derived(store.config?.title);

  await store.init({ content });

  onMount(() => {
    initTheme();
    for (const el of document.querySelectorAll("[data-hotkey]")) {
      install(el);
    }

    const observer = createScrollObserver({
      container: "main",
      headingSelector: "h1, h2, h3, h4, h5, h6",
      viewportOffset: 0.3,
    });

    observer.init();

    return () => observer.destroy();
  });
</script>

<svelte:head>
  <title>{title ?? "Docsome"}</title>
</svelte:head>

<div id="toaster" class="toaster"></div>

<CommandMenu />

<div class="min-h-screen flex">
  <Sidebar />
  <div class="flex flex-col flex-1">
    <TopBar />
    <main
      class="prose dark:prose-invert prose-neutral container max-w-240 mx-auto py-12 px-4"
    >
      {@html store.html}
    </main>
  </div>
</div>
