# Excalidraw Desktop App

A desktop wrapper for [Excalidraw](excalidraw.com): **Tauri 2 + Vite + React + `@excalidraw/excalidraw`** (MIT).

## Run it

```sh
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
