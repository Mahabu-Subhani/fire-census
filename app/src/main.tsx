// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { SelectionProvider } from "./selection";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SelectionProvider>
      <App />
    </SelectionProvider>
  </StrictMode>,
);
