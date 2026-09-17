import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";

export interface SceneDoc {
  elements: readonly OrderedExcalidrawElement[];
  appState: Partial<AppState>;
  files: BinaryFiles;
}

export const EMPTY_DOC: SceneDoc = { elements: [], appState: {}, files: {} };

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

/**
 * `collaborators` is a `Map` at runtime, which `JSON.stringify` silently
 * turns into `{}`. Feeding that back into Excalidraw breaks rendering, so it
 * must never be persisted or restored.
 */
function sanitizeAppState(appState: Partial<AppState>): Partial<AppState> {
  const clean = { ...appState };
  delete clean.collaborators;
  return clean;
}

function sanitizeElements(elements: unknown): OrderedExcalidrawElement[] {
  if (!Array.isArray(elements)) {
    return [];
  }
  return elements.filter(
    (el): el is OrderedExcalidrawElement =>
      !!el &&
      typeof el === "object" &&
      typeof (el as { id?: unknown }).id === "string" &&
      typeof (el as { type?: unknown }).type === "string",
  );
}

function parseDoc(json: string): SceneDoc {
  const raw = JSON.parse(json) as {
    elements?: unknown;
    appState?: Partial<AppState>;
    files?: BinaryFiles;
  };
  return {
    elements: sanitizeElements(raw.elements),
    appState:
      raw.appState && typeof raw.appState === "object"
        ? sanitizeAppState(raw.appState)
        : {},
    files: raw.files && typeof raw.files === "object" ? raw.files : {},
  };
}

export function serializeDoc(doc: SceneDoc): string {
  return JSON.stringify(
    {
      type: "excalidraw",
      version: 2,
      source: "excalidraw-desktop",
      ...doc,
      elements: sanitizeElements(doc.elements),
      appState: sanitizeAppState(doc.appState),
    },
    null,
    2,
  );
}

/** Open a `.excalidraw` / `.json` file. Returns null when cancelled. */
export async function openSceneFile(): Promise<{
  path: string;
  doc: SceneDoc;
} | null> {
  if (isTauri()) {
    const [{ open }, { readTextFile }] = await Promise.all([
      import("@tauri-apps/plugin-dialog"),
      import("@tauri-apps/plugin-fs"),
    ]);
    const selected = await open({
      multiple: false,
      filters: [{ name: "Excalidraw", extensions: ["excalidraw", "json"] }],
    });
    if (typeof selected !== "string") {
      return null;
    }
    return { path: selected, doc: parseDoc(await readTextFile(selected)) };
  }

  // Browser fallback: <input type="file"> picker.
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".excalidraw,.json,application/json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      void file.text().then((text) => {
        try {
          resolve({ path: file.name, doc: parseDoc(text) });
        } catch {
          resolve(null);
        }
      });
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

/** Save to `path`, or prompt when omitted. Returns the saved path or null. */
export async function saveSceneFile(
  doc: SceneDoc,
  path: string | null,
): Promise<string | null> {
  if (isTauri()) {
    const [{ save }, { writeTextFile }] = await Promise.all([
      import("@tauri-apps/plugin-dialog"),
      import("@tauri-apps/plugin-fs"),
    ]);
    let target = path;
    if (!target) {
      const selected = await save({
        defaultPath: "untitled.excalidraw",
        filters: [{ name: "Excalidraw", extensions: ["excalidraw"] }],
      });
      if (!selected) {
        return null;
      }
      target = selected;
    }
    await writeTextFile(target, serializeDoc(doc));
    return target;
  }

  // Browser fallback: download + keep a localStorage draft.
  const blob = new Blob([serializeDoc(doc)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = path ?? "untitled.excalidraw";
  a.click();
  URL.revokeObjectURL(url);
  try {
    localStorage.setItem("excalidraw-desktop-draft", serializeDoc(doc));
  } catch {
    // Private mode etc. — download already succeeded.
  }
  return path ?? "untitled.excalidraw (downloaded)";
}

const DRAFT_KEY = "excalidraw-desktop-draft";

export function loadDraft(): SceneDoc | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? parseDoc(raw) : null;
  } catch {
    return null;
  }
}

export function storeDraft(doc: SceneDoc): void {
  try {
    localStorage.setItem(DRAFT_KEY, serializeDoc(doc));
  } catch {
    // Ignore quota / private-mode errors; explicit Save is authoritative.
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing to clear.
  }
}
