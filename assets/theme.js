// Light / dark mode for every page on this site (meeting pages, admin, root).
// Until someone presses the button, the page follows the device's light/dark setting (and changes with it).
// A choice made with the button is remembered on this device for the whole site; choosing the same mode
// as the device again forgets it, so the page goes back to following the device.
// Each page's CSS defines its colours for :root[data-theme="light"]; this file sets that attribute
// and adds the round toggle button in the top-right corner.
(() => {
  const KEY = "theme";
  const root = document.documentElement;
  const stored = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const apply = t => { root.dataset.theme = t; };
  const mq = window.matchMedia ? matchMedia("(prefers-color-scheme: light)") : null;
  const device = () => (mq && mq.matches ? "light" : "dark");
  const chosen = () => { const t = stored(); return t === "light" || t === "dark" ? t : null; };
  apply(chosen() || device());
  let draw = () => {};
  if (mq) {
    const follow = () => { if (!chosen()) { apply(device()); draw(); } };
    if (mq.addEventListener) mq.addEventListener("change", follow); else if (mq.addListener) mq.addListener(follow);
  }

  const SUN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/></svg>';

  const addButton = () => {
    if (document.getElementById("themeToggle")) return;
    const style = document.createElement("style");
    style.textContent = `
.theme-toggle {
  position: absolute; z-index: 10; top: calc(12px + env(safe-area-inset-top, 0px)); right: 12px;
  width: 36px; height: 36px; display: inline-grid; place-items: center; padding: 0;
  color: var(--ink); background: var(--surface, var(--paper)); border: 1px solid var(--line); border-radius: 50%; cursor: pointer;
}
.theme-toggle:focus-visible { outline: 2px solid var(--accent, var(--ink)); outline-offset: 2px; }`;
    document.head.append(style);
    const btn = document.createElement("button");
    btn.type = "button"; btn.id = "themeToggle"; btn.className = "theme-toggle";
    draw = () => {
      const dark = root.dataset.theme !== "light";
      btn.innerHTML = dark ? SUN : MOON;   // shows the mode you switch to
      btn.title = dark ? "Light mode" : "Dark mode";
      btn.setAttribute("aria-label", btn.title);
    };
    btn.addEventListener("click", () => {
      const next = root.dataset.theme === "light" ? "dark" : "light";
      apply(next);
      try {
        if (next === device()) localStorage.removeItem(KEY); else localStorage.setItem(KEY, next);
      } catch (e) { /* private mode: works until the page closes */ }
      draw();
    });
    draw();
    document.body.append(btn);
  };
  if (document.body) addButton(); else document.addEventListener("DOMContentLoaded", addButton);
})();
