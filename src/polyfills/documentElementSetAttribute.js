// Small safety shim to avoid crashes in non‑browser or mocked DOM
// environments (like Next.js prerendering) where `document` may exist but
// `document.documentElement.setAttribute` is missing or not a function.
//
// This file is intentionally *not* a React component and has no `"use client"`
// directive so it can safely run in both server and client bundles.
if (typeof document !== 'undefined') {
  try {
    const docEl = document.documentElement || (document.documentElement = {});

    if (typeof docEl.setAttribute !== 'function') {
      // Make it a harmless no-op function so any callers don't crash.
      docEl.setAttribute = () => {};
    }
  } catch {
    // Ignore any failures – this is purely defensive.
  }
}


