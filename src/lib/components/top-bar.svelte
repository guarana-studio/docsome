<script lang="ts">
    import { MoonIcon, SunIcon, PanelLeftIcon } from "@lucide/svelte";

    function toggleSidebar() {
        return document.dispatchEvent(new CustomEvent("basecoat:sidebar"));
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
            data-tooltip="Toggle sidebar"
            data-side="bottom"
            data-align="start"
        >
            <PanelLeftIcon /></button
        >
        <div>test</div>
    </div>
    <button
        type="button"
        aria-label="Toggle dark mode"
        data-tooltip="Toggle dark mode"
        data-side="bottom"
        data-align="end"
        onclick={() =>
            document.dispatchEvent(new CustomEvent("basecoat:theme"))}
        class="btn-icon-outline size-8"
    >
        <span class="hidden dark:block"><SunIcon /></span>
        <span class="block dark:hidden"><MoonIcon /></span>
    </button>
</header>
