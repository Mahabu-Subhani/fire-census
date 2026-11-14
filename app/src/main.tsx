// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
import "@fontsource-variable/figtree";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource/instrument-serif/400-italic.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { SelectionProvider } from "./selection";
import "./styles.css";
import { ThemeProvider } from "./theme";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <SelectionProvider>
        <App />
      </SelectionProvider>
    </ThemeProvider>
  </StrictMode>,
);
