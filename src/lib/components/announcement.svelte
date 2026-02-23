<script lang="ts">
    import crc from "js-crc";
    import { PersistedState } from "runed";
    import { InfoIcon, XIcon } from "@lucide/svelte";
    import appContext from "virtual:docsome";

    const { config } = appContext;
    const announcement = config?.announcement;
    const textCrc = announcement ? crc.crc32(announcement.text).toString() : "";
    const announcementHidden = new PersistedState(
        `announcement-hidden-${textCrc}`,
        false,
    );

    function hideAnnouncement() {
        announcementHidden.current = true;
    }
</script>

{#snippet content(innerText: string)}
    <InfoIcon />
    <h2>
        {@html innerText}
    </h2>
{/snippet}

{#snippet hideButton()}
    <button onclick={hideAnnouncement} class="btn-sm-icon-outline">
        <XIcon />
    </button>
{/snippet}

{#if !announcementHidden.current}
    <div class="alert rounded-none border-x-0 border-t-0 flex items-center">
        {#if announcement?.href}
            <a
                href={announcement.href}
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 flex gap-2 items-center"
            >
                {@render content(announcement.text)}
            </a>
            {@render hideButton()}
        {:else}
            <div class="flex-1 flex gap-2 items-center">
                {@render content(announcement!.text)}
            </div>
            {@render hideButton()}
        {/if}
    </div>
{/if}
