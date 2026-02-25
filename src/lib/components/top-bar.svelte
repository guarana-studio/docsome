<script lang="ts">
    import { PersistedState } from "runed";
    import { MoonIcon, SunIcon, PanelLeftIcon, LinkIcon } from "@lucide/svelte";
    import Icon from "./icon.svelte";
    import { store } from "$lib/store.svelte";
    import appContext from "virtual:docsome";
    import type { OutlineNode } from "$lib/types";

    const { config, outline } = appContext;

    const topBar = config?.topBar;
    const activeSlug = $derived(store.activeSlug);

    function findHeadingTitle(nodes: OutlineNode[], slug: string): string | null {
        for (const node of nodes) {
            if (node.slug === slug) return node.title;
            const found = findHeadingTitle(node.children, slug);
            if (found) return found;
        }
        return null;
    }

    const currentHeading = $derived(activeSlug
        ? findHeadingTitle(outline ?? [], activeSlug)
        : null
    );

    const sidebarHidden = new PersistedState("sidebar-hidden", false);

    function toggleSidebar() {
        document.dispatchEvent(new CustomEvent("basecoat:sidebar"));
    }

    function toggleTheme() {
        return document.dispatchEvent(new CustomEvent("basecoat:theme"));
    }

    async function copyLlmsTxtUrl() {
        await navigator.clipboard.writeText(`${window.location.origin}/llms.txt`);
        return document.dispatchEvent(new CustomEvent('basecoat:toast', {
            detail: {
                config: {
                category: 'success',
                title: 'Address copied to clipboard',
                }
            }
        }))
    }
</script>

<header
    class="sticky inset-x-0 top-0 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 p-2 bg-background/80 dark:bg-background/40 backdrop-blur-lg z-10"
>
    <div class="flex items-center gap-2">
        <button
            type="button"
            class="btn-icon-outline"
            onclick={toggleSidebar}
            aria-label="Toggle sidebar"
            data-tooltip="Toggle sidebar [s]"
            data-side="bottom"
            data-align="start"
            data-hotkey="s"
        >
            <PanelLeftIcon /></button
        >
        <div class="font-semibold flex md:hidden">{currentHeading}</div>
    </div>
    <div class="flex items-center gap-2">
        {#each topBar?.links as link}
            <a
                class={link.label ? "btn-outline" : "btn-icon-outline"}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
            >
                <Icon name={link.icon ?? "globe"} />
                {#if link.label}
                    <span>{link.label}</span>
                {/if}
            </a>
        {/each}
        {#if topBar?.llms}
            <button
                class="btn-outline hidden md:flex"
                data-tooltip="Documentation for AI agents"
                data-side="bottom"
                data-align="end"
                onclick={copyLlmsTxtUrl}
            >
                <LinkIcon size={16} />
                <span>llms.txt</span>
            </button>
        {/if}
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
</header>
