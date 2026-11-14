// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Fonts: Arial everywhere (decision 39), so no web fonts are loaded.
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
