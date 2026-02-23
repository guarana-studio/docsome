<script lang="ts">
    import { GithubIcon } from "@lucide/svelte";

    type Props = {
        name: "github";
    };

    let { name } = $props();

    const icons = {
        github: GithubIcon,
    };

    let Icon = $derived(icons[name]);
</script>

<Icon />
