<script lang="ts">
  import { onMount } from "svelte";
  import { install } from "@github/hotkey";
  import Sidebar from "$lib/components/sidebar.svelte";
  import TopBar from "$lib/components/top-bar.svelte";
  import CommandMenu from "$lib/components/command-menu.svelte";
  import Announcement from "$lib/components/announcement.svelte";
  import Footer from "$lib/components/footer.svelte";
  import { store } from "$lib/store.svelte";
  import { initTheme } from "$lib/theme";
  import { createScrollObserver } from "$lib/scroll-observer";
  import appContext from "virtual:docsome";

  const { html, config } = appContext;

  const siteTitle = config?.title ?? "Docsome"

  onMount(() => {
    store.init();
    initTheme();
    for (const el of document.querySelectorAll("[data-hotkey]")) {
      install(el as HTMLElement);
    }

    const observer = createScrollObserver({
      container: "main",
      headingSelector: "h1, h2, h3, h4, h5, h6",
    });

    observer.init();

    return () => observer.destroy();
  });
</script>

<svelte:head>
  <title>{siteTitle}</title>
  <meta property="og:site_name" content={siteTitle} />
  <meta property="og:title" content={siteTitle} />
  <meta name="twitter:title" content={siteTitle} />
  {#if config?.description}
    <meta name="description" content={config.description} />
    <meta property="og:description" content={config.description} />
    <meta name="twitter:description" content={config.description} />
  {/if}
  <link
    rel="icon"
    type="image/svg+xml"
    href={`data:image/svg+xml;base64,${config.logo.src?.light ?? config.logo.src}`}
  />
  {#if config?.head}
    {#each config.head as headItem}
      <svelte:element this={headItem.tag} {...headItem.attrs}>
        {headItem?.content}
      </svelte:element>
    {/each}
  {/if}
</svelte:head>

<div id="toaster" class="toaster"></div>

<CommandMenu />

<div class="min-h-screen flex">
  <Sidebar />
  <div class="flex flex-col flex-1">
    {#if config?.announcement}
      <Announcement />
    {/if}
    <TopBar />
    <main
      class="prose lg:prose-lg dark:prose-invert prose-neutral container max-w-full md:max-w-240 mx-auto py-12 px-4 min-w-0"
    >
      {@html html}
    </main>
    {#if config?.footer}
      <Footer />
    {/if}
  </div>
</div>
