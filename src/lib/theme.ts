export function initTheme() {
  try {
    const stored = localStorage.getItem("themeMode");
    if (stored ? stored === "dark" : matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark");
    }
  } catch {}

  const apply = (dark: boolean) => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("themeMode", dark ? "dark" : "light");
    } catch {}
  };

  document.addEventListener("basecoat:theme", (event: Event) => {
    const mode = (event as Event & { detail: { mode: string } }).detail?.mode;
    apply(
      mode === "dark"
        ? true
        : mode === "light"
          ? false
          : !document.documentElement.classList.contains("dark"),
    );
  });
}
