<script lang="ts">
    import { tick } from "svelte";
    import { SearchIcon, XIcon } from "@lucide/svelte";
    import { onClickOutside, PressedKeys } from "runed";
    import { store } from "$lib/store.svelte";
    import { mark, truncate } from "$lib/attachments";

    let dialogContainer = $state<HTMLDialogElement>();
    const dialogOpened = $derived(dialogContainer?.open ?? false);
    let commandContainer = $state<HTMLDivElement>();
    let inputValue = $state("");
    const keywords = $derived(inputValue.split(" "));
    const miniSearch = $derived(store.miniSearch);
    const searchResults = $derived(miniSearch?.search(inputValue) ?? []);

    function closeCommandMenu() {
        return dialogContainer.close();
    }

    const clickOutsideHandler = onClickOutside(
        () => commandContainer,
        () => closeCommandMenu(),
    );
</script>

<dialog id="commandMenu" class="dialog p-0" bind:this={dialogContainer}>
    <div bind:this={commandContainer} class="p-0 gap-0">
        <header>
            <div class="relative">
                <SearchIcon
                    size={20}
                    class="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
                />
                <input
                    type="text"
                    placeholder="Type a command or search..."
                    autocomplete="off"
                    autocorrect="off"
                    spellcheck="false"
                    class="input pl-8 py-6"
                    bind:value={inputValue}
                />
            </div>
        </header>
        <section class="flex flex-col">
            {#each searchResults as result}
                <a
                    href={`/#${result.id}`}
                    class="flex flex-col p-2 flex flex-col gap-1 rounded hover:bg-accent"
                    onclick={closeCommandMenu}
                >
                    <h2
                        class="text-sm font-semibold truncate"
                        {@attach mark(keywords)}
                    >
                        {result.title}
                    </h2>
                    <div
                        class="truncate"
                        {@attach mark(keywords)}
                        {@attach truncate(keywords)}
                    >
                        {result.text}
                    </div>
                </a>
            {/each}
        </section>
        <button
            type="button"
            aria-label="Close dialog"
            onclick={closeCommandMenu}
        >
            <XIcon />
        </button>
    </div>
</dialog>
