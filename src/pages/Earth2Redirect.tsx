import { useEffect, useState } from "react";

// The Earth2 graph is a standalone static page (public/future/earth2/index.html),
// not part of this app. The service worker's navigation fallback skips /future/,
// but a visitor whose installed worker predates that rule gets this app shell
// instead of the page. Unregister the worker so the next navigation goes to the
// network, then load the static page. The sw=0 flag allows one attempt only, so a
// worker that still intercepts shows a plain link instead of a reload loop.
const TARGET = "/future/earth2/index.html";

const Earth2Redirect = () => {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sw") === "0") {
      setStuck(true);
      return;
    }
    params.set("sw", "0");
    const go = () => window.location.replace(`${TARGET}?${params.toString()}`);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((r) => r.unregister())))
        .catch(() => {})
        .finally(go);
    } else {
      go();
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        {stuck ? (
          <a href={TARGET} className="text-primary underline hover:text-primary/90">
            Open the Earth2 graph
          </a>
        ) : (
          <p className="text-muted-foreground">Opening the Earth2 graph...</p>
        )}
      </div>
    </div>
  );
};

export default Earth2Redirect;
