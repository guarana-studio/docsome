<script lang="ts">
    import { GithubIcon } from "@lucide/svelte";

    type Props = {
        name: "github";
    };

    let { name }: Props = $props();

    const icons = {
        github: GithubIcon,
    } as const;

    let Icon = $derived(icons[name]);
</script>

<Icon />
