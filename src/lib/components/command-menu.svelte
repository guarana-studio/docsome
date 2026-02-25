<script lang="ts">
    import { SearchIcon, XIcon } from "@lucide/svelte";
    import { store } from "$lib/store.svelte";
    import { mark, truncate } from "$lib/attachments";

    let dialogContainer = $state<HTMLDialogElement>();
    let commandContainer = $state<HTMLDivElement>();
    let inputValue = $state("");
    const keywords = $derived(inputValue.split(" "));
    const miniSearch = $derived(store.miniSearch);
    const searchResults = $derived(miniSearch?.search(inputValue) ?? []);

    function closeCommandMenu() {
        return dialogContainer?.close();
    }

    function overlayClose(event: Event) {
        // @ts-expect-error the id is there
        if (event.target?.id !== "commandMenu") return
        return closeCommandMenu()
    }
</script>

<dialog id="commandMenu" class="dialog p-0" bind:this={dialogContainer} onclick={overlayClose}>
    <div bind:this={commandContainer} class="p-0 gap-0 overflow-y-scroll flex flex-col">
        <header class="sticky inset-x-0 top-0 z-10 bg-background">
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
                <button
                    type="button"
                    aria-label="Close dialog"
                    onclick={closeCommandMenu}
                    class="absolute right-4 top-1/2 -translate-y-1/2"
                >
                    <XIcon size={20} />
                </button>
            </div>
        </header>
        <section class="flex flex-col max-w-full flex-1 m-0 p-0">
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
    </div>
</dialog>
