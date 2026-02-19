import "./app.css";
import "basecoat-css/all";
import "@fontsource-variable/geist-mono";
import "@fontsource-variable/geist";
import { hydrate } from "svelte";

import App from "./app.svelte";

hydrate(App, {
  target: document.getElementById("app")!,
});
