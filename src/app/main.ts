import { mount } from "svelte";
import App from "./App.svelte";
import { loadFonts } from "../lib/fonts";
import "../styles/theme.css";

const target = document.getElementById("app");
if (!target) throw new Error("Missing #app mount point");

void loadFonts();
mount(App, { target });
