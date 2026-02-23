<script lang="ts">
    import appContext from "virtual:docsome";

    const { config } = appContext;

    const footer = config?.footer;
    const text = footer?.text?.replace("%YEAR%", new Date().getFullYear());
</script>

<footer class="container max-w-240 mx-auto px-4 pb-4">{@html text}</footer>
