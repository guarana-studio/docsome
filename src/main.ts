import "./app.css";
import "basecoat-css/all";
import "@fontsource-variable/geist-mono";
import "@fontsource-variable/geist";
import { hydrate, mount } from "svelte";

import App from "./app.svelte";

const fn = import.meta.env.PROD ? hydrate : mount;

fn(App, {
  target: document.getElementById("app")!,
});
