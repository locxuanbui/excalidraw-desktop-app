# Excalidraw Desktop App

A desktop wrapper for [Excalidraw](https://excalidraw.com): **Tauri 2 + Vite + React + `@excalidraw/excalidraw`** (MIT).

## Prerequisites

- **Node.js** (LTS recommended) + **npm** — for the Vite + React frontend and the
  local Tauri CLI (`@tauri-apps/cli` is already a devDependency, so no global
  install needed). Check with `node -v` and `npm -v`.
- **Rust** stable toolchain via [rustup](https://rustup.rs) — for the native
  shell in `src-tauri/` (requires ≥ 1.77.2 per `src-tauri/Cargo.toml`
  `rust-version`). Check with `rustc -v`.
- **Tauri system dependencies** for your OS (WebView, compilers, linkers) —
  see the [Tauri prerequisites guide](https://tauri.app/start/prerequisites/).
  In short: Xcode Command Line Tools on macOS, the Microsoft C++ Build Tools +
  WebView2 on Windows, and the WebKit/distro packages on Linux.

## Run it

```sh
npm install
npm run dev            # web preview in browser (download/upload fallback)
npm run tauri dev      # native desktop window
npm run tauri build    # installer bundle (~10 MB)
```

## How it works

- `src/App.tsx` — full-window `<Excalidraw />` editor plus New / Open / Save / Save As toolbar.
- `src/scene.ts` — `.excalidraw` JSON save/open. Uses Tauri `fs` + `dialog`
  plugins in the desktop shell, file download/upload + `localStorage` draft
  autosave in the browser.
- `src-tauri/` — Rust shell (fs, dialog, log plugins), capabilities in
  `src-tauri/capabilities/default.json`.
