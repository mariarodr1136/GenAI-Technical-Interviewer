import { useEffect, useRef, useState } from "react";
import type { CodeEditorHandle } from "../lib/editor.ts";
import type { CodeLanguage } from "../types.ts";

interface CodeEditorProps {
  value: string;
  language: CodeLanguage;
  disabled: boolean;
  placeholder: string;
  ariaLabel: string;
  onChange: (value: string) => void;
}

/**
 * CodeMirror editor, lazy-loaded so its bundle is only fetched when the code
 * panel opens. Until the module arrives (or if it fails to load — e.g. older
 * browsers or jsdom in tests), a plain textarea keeps the panel fully usable.
 */
export function CodeEditor(props: CodeEditorProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const hostRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<CodeEditorHandle | null>(null);
  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  useEffect(() => {
    let cancelled = false;
    import("../lib/editor.ts")
      .then((mod) => {
        if (cancelled || !hostRef.current) return;
        const { value, language, disabled, placeholder, ariaLabel } = propsRef.current;
        editorRef.current = mod.createCodeEditor({
          parent: hostRef.current,
          doc: value,
          language,
          editable: !disabled,
          placeholderText: placeholder,
          ariaLabel,
          onDocChange: (doc) => propsRef.current.onChange(doc)
        });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("failed");
      });
    return () => {
      cancelled = true;
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, []);

  // Reflect external prop changes (clear-after-send, language picker, busy state).
  useEffect(() => {
    editorRef.current?.setDoc(props.value);
  }, [status, props.value]);
  useEffect(() => {
    editorRef.current?.setLanguage(props.language);
  }, [status, props.language]);
  useEffect(() => {
    editorRef.current?.setEditable(!props.disabled);
  }, [status, props.disabled]);

  function handleFallbackKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const target = e.currentTarget;
    const { selectionStart, selectionEnd, value } = target;
    props.onChange(`${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`);
    requestAnimationFrame(() => {
      target.selectionStart = target.selectionEnd = selectionStart + 2;
    });
  }

  return (
    <>
      <div
        ref={hostRef}
        className="code-editor-host"
        hidden={status !== "ready"}
        data-testid="code-editor"
      />
      {status !== "ready" && (
        <textarea
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          onKeyDown={handleFallbackKeyDown}
          placeholder={props.placeholder}
          aria-label={props.ariaLabel}
          rows={8}
          spellCheck={false}
          disabled={props.disabled}
        />
      )}
    </>
  );
}
