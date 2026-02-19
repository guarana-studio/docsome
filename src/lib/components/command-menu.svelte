<script lang="ts">
    import { tick } from "svelte";
    import { XIcon } from "@lucide/svelte";
    import { onClickOutside, PressedKeys } from "runed";

    let dialogContainer = $state<HTMLDialogElement>();
    const dialogOpened = $derived(dialogContainer?.open ?? false);
    let commandContainer = $state<HTMLDivElement>();
    let inputElement = $state<HTMLInputElement>();

    function closeCommandMenu() {
        return dialogContainer.close();
    }

    const clickOutsideHandler = onClickOutside(
        () => commandContainer,
        () => closeCommandMenu(),
    );
</script>

<dialog
    id="commandMenu"
    class="command-dialog"
    aria-label="Command menu"
    bind:this={dialogContainer}
>
    <div class="command" bind:this={commandContainer}>
        <header>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-search-icon lucide-search"
            >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
            </svg>
            <input
                type="text"
                id="demo-command-dialog-input"
                placeholder="Type a command or search..."
                autocomplete="off"
                autocorrect="off"
                spellcheck="false"
                aria-autocomplete="list"
                role="combobox"
                aria-expanded="true"
                aria-controls="demo-command-dialog-menu"
                bind:this={inputElement}
            />
        </header>
        <div
            role="menu"
            id="demo-command-dialog-menu"
            aria-orientation="vertical"
            data-empty="No results found."
            class="scrollbar"
        >
            <div role="group" aria-labelledby="cmd-suggestions">
                <span role="heading" id="cmd-suggestions">Suggestions</span>
                <div role="menuitem">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path d="M8 2v4" />
                        <path d="M16 2v4" />
                        <rect width="18" height="18" x="3" y="4" rx="2" />
                        <path d="M3 10h18" />
                    </svg>
                    <span>Calendar</span>
                </div>
                <div role="menuitem">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                        <line x1="9" x2="9.01" y1="9" y2="9" />
                        <line x1="15" x2="15.01" y1="9" y2="9" />
                    </svg>
                    <span>Search Emoji</span>
                </div>
                <div role="menuitem" aria-disabled="true">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <rect width="16" height="20" x="4" y="2" rx="2" />
                        <line x1="8" x2="16" y1="6" y2="6" />
                        <line x1="16" x2="16" y1="14" y2="18" />
                        <path d="M16 10h.01" />
                        <path d="M12 10h.01" />
                        <path d="M8 10h.01" />
                        <path d="M12 14h.01" />
                        <path d="M8 14h.01" />
                        <path d="M12 18h.01" />
                        <path d="M8 18h.01" />
                    </svg>
                    <span>Calculator</span>
                </div>
            </div>
            <hr role="separator" />
        </div>
        <button
            type="button"
            aria-label="Close dialog"
            onclick={closeCommandMenu}
        >
            <XIcon />
        </button>
    </div>
</dialog>
