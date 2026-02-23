<script lang="ts">
    import { MoonIcon, SunIcon, PanelLeftIcon } from "@lucide/svelte";
    import Icon from "./icon.svelte";
    import appContext from "virtual:docsome";

    const { config } = appContext;

    const topBar = config?.topBar;

    function toggleSidebar() {
        return document.dispatchEvent(new CustomEvent("basecoat:sidebar"));
    }

    function toggleTheme() {
        return document.dispatchEvent(new CustomEvent("basecoat:theme"));
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
            <a
                href="/llms.txt"
                target="_blank"
                class="btn-outline"
                data-tooltip="Documentation for AI agents"
                data-side="bottom"
                data-align="end"
            >
                llms.txt
            </a>
        {/if}
        <button
            aria-label="Toggle dark mode"
            data-tooltip="Toggle dark mode [m]"
            data-side="bottom"
            data-align="end"
            onclick={toggleTheme}
            class="btn-icon-outline size-8"
            data-hotkey="m"
        >
            <span class="hidden dark:block"><SunIcon /></span>
            <span class="block dark:hidden"><MoonIcon /></span>
        </button>
    </div>
</header>
