<script lang="ts">
    import appContext from "virtual:docsome";

    const { config } = appContext;

    const footer = config?.footer;
    const text = footer?.text?.replace("%YEAR%", new Date().getFullYear());
</script>

<footer class="container max-w-240 mx-auto px-4 pb-4 flex flex-col gap-2">
    <div>{@html text}</div>
    <a href="https://docsome.guarana.studio/" target="_blank" rel="noopener noreferrer" class="text-sm text-neutral-500">
      Built with Docsome
    </a>
</footer>
