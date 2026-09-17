import { useCallback, useEffect, useRef, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";
import { CanvasErrorBoundary } from "./ErrorBoundary";
import {
  EMPTY_DOC,
  clearDraft,
  isTauri,
  loadDraft,
  openSceneFile,
  saveSceneFile,
  storeDraft,
  type SceneDoc,
} from "./scene";

export default function App() {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [docKey, setDocKey] = useState(0);
  const [initialDoc, setInitialDoc] = useState<SceneDoc>(() => loadDraft() ?? EMPTY_DOC);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const latest = useRef<SceneDoc>(initialDoc);
  const draftTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!api) {
      return;
    }
    // Remount (via key) already applies elements + appState from
    // initialData; here we just restore binary files and elements.
    api.updateScene({ elements: initialDoc.elements });
    api.addFiles(Object.values(initialDoc.files));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, docKey]);

  useEffect(
    () => () => {
      if (draftTimer.current !== null) {
        window.clearTimeout(draftTimer.current);
      }
    },
    [],
  );

  const handleChange = useCallback(
    (
      elements: readonly OrderedExcalidrawElement[],
      appState: AppState,
      files: BinaryFiles,
    ) => {
      latest.current = { elements, appState, files };
      setDirty(true);
      if (draftTimer.current !== null) {
        window.clearTimeout(draftTimer.current);
      }
      draftTimer.current = window.setTimeout(() => {
        storeDraft(latest.current);
      }, 1000);
    },
    [],
  );

  const handleOpen = useCallback(async () => {
    setStatus(null);
    try {
      const result = await openSceneFile();
      if (!result) {
        return;
      }
      latest.current = result.doc;
      setInitialDoc(result.doc);
      setFilePath(result.path);
      setDirty(false);
      setDocKey((k) => k + 1);
    } catch (err) {
      setStatus(`Open failed: ${err instanceof Error ? err.message : err}`);
    }
  }, []);

  const handleSave = useCallback(async () => {
    setStatus(null);
    try {
      const saved = await saveSceneFile(latest.current, filePath);
      if (saved) {
        setFilePath(saved);
        setDirty(false);
        setStatus(`Saved to ${saved}`);
      }
    } catch (err) {
      setStatus(`Save failed: ${err instanceof Error ? err.message : err}`);
    }
  }, [filePath]);

  const handleSaveAs = useCallback(async () => {
    setStatus(null);
    try {
      const saved = await saveSceneFile(latest.current, null);
      if (saved) {
        setFilePath(saved);
        setDirty(false);
        setStatus(`Saved to ${saved}`);
      }
    } catch (err) {
      setStatus(`Save failed: ${err instanceof Error ? err.message : err}`);
    }
  }, []);

  const handleNew = useCallback(() => {
    latest.current = EMPTY_DOC;
    setInitialDoc(EMPTY_DOC);
    setFilePath(null);
    setDirty(false);
    setStatus(null);
    setDocKey((k) => k + 1);
  }, []);

  // Recovery path for the error boundary: drop the poisoned draft first,
  // otherwise we would just reload the same broken scene.
  const handleFreshStart = useCallback(() => {
    clearDraft();
    handleNew();
  }, [handleNew]);

  return (
    <div className="app">
      <header className="toolbar">
        <span className="title">Excalidraw Desktop</span>
        <span className="file-label" title={filePath ?? undefined}>
          {dirty ? "● " : ""}
          {filePath ?? "Unsaved"}
          {isTauri() ? "" : " (web preview)"}
        </span>
        <div className="actions">
          <button type="button" onClick={handleNew}>
            New
          </button>
          <button type="button" onClick={handleOpen}>
            Open
          </button>
          <button type="button" onClick={handleSave}>
            Save
          </button>
          <button type="button" onClick={handleSaveAs}>
            Save As
          </button>
        </div>
      </header>
      {status && <div className="status">{status}</div>}
      <div className="canvas-wrap">
        <CanvasErrorBoundary resetKey={docKey} onReset={handleFreshStart}>
          <Excalidraw
            key={docKey}
            excalidrawAPI={setApi}
            initialData={{
              elements: initialDoc.elements,
              appState: initialDoc.appState,
            }}
            onChange={handleChange}
          />
        </CanvasErrorBoundary>
      </div>
    </div>
  );
}
