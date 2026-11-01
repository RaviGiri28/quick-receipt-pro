import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyPrintAlign } from "./lib/storage";

applyPrintAlign();

createRoot(document.getElementById("root")!).render(<App />);
