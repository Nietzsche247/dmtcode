import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Auto-update the service worker so returning visitors never keep a stale build.
// registerType is autoUpdate, so the page reloads once when a new service worker
// takes control. The checks below make a long-lived SPA tab notice new deploys.
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;
    const check = () => {
      registration.update().catch(() => {});
    };
    setInterval(check, 60 * 60 * 1000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") check();
    });
  },
});

createRoot(document.getElementById("root")!).render(<App />);
