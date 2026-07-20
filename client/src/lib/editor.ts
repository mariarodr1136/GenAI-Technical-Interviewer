/**
 * CodeMirror wiring for the Attach Code panel.
 *
 * Kept behind a dynamic import (see CodeEditor.tsx) so the editor bundle is
 * only downloaded when the user opens the panel. Colors come from CSS classes
 * defined in styles/controls.css, so syntax highlighting follows the app's
 * light/dark theme without recreating the editor.
 */
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { basicSetup } from "codemirror";
import type { CodeLanguage } from "../types.ts";

export interface CodeEditorHandle {
  setLanguage(language: CodeLanguage): void;
  setEditable(editable: boolean): void;
  /** Replace the document (used when the app clears the editor after a turn). */
  setDoc(value: string): void;
  getDoc(): string;
  focus(): void;
  destroy(): void;
}

export interface CreateCodeEditorOptions {
  parent: HTMLElement;
  doc: string;
  language: CodeLanguage;
  editable: boolean;
  placeholderText: string;
  ariaLabel: string;
  onDocChange: (doc: string) => void;
}

const themeSpec = {
  "&": {
    border: "1px solid var(--line-2)",
    borderRadius: "var(--radius-sm)",
    background: "var(--field)",
    color: "var(--ink)",
    fontSize: "0.8rem",
    minHeight: "150px",
    maxHeight: "420px"
  },
  "&.cm-focused": {
    outline: "none",
    borderColor: "var(--violet)",
    boxShadow: "0 0 0 3px rgba(124, 58, 237, 0.18)"
  },
  ".cm-scroller": {
    fontFamily: "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace",
    lineHeight: "1.6",
    minHeight: "150px",
    borderRadius: "var(--radius-sm)"
  },
  ".cm-content": { padding: "10px 4px", caretColor: "var(--ink)" },
  ".cm-gutters": {
    background: "transparent",
    color: "var(--muted)",
    border: "none",
    paddingLeft: "6px"
  },
  ".cm-activeLine": { background: "transparent" },
  ".cm-activeLineGutter": { background: "transparent", color: "var(--ink-2)" },
  ".cm-cursor": { borderLeftColor: "var(--ink)" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    background: "var(--teal-glow)"
  },
  ".cm-placeholder": { color: "var(--muted)" }
};

// Tokens get CSS classes instead of fixed colors; controls.css styles them
// per theme so highlighting stays readable in dark mode.
const highlightStyle = HighlightStyle.define([
  { tag: [tags.keyword, tags.moduleKeyword, tags.controlKeyword], class: "tok-keyword" },
  { tag: [tags.string, tags.special(tags.string), tags.regexp], class: "tok-string" },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], class: "tok-comment" },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], class: "tok-literal" },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], class: "tok-fn" },
  { tag: [tags.className, tags.typeName], class: "tok-type" },
  { tag: [tags.propertyName, tags.attributeName], class: "tok-prop" },
  { tag: [tags.operator, tags.punctuation, tags.bracket], class: "tok-punct" },
  { tag: [tags.variableName, tags.definition(tags.variableName)], class: "tok-var" }
]);

function languageExtension(language: CodeLanguage) {
  return language === "python" ? python() : javascript();
}

export function createCodeEditor(options: CreateCodeEditorOptions): CodeEditorHandle {
  const languageCompartment = new Compartment();
  const editableCompartment = new Compartment();

  const view = new EditorView({
    parent: options.parent,
    state: EditorState.create({
      doc: options.doc,
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        languageCompartment.of(languageExtension(options.language)),
        editableCompartment.of([
          EditorView.editable.of(options.editable),
          EditorState.readOnly.of(!options.editable)
        ]),
        placeholder(options.placeholderText),
        EditorView.theme(themeSpec),
        syntaxHighlighting(highlightStyle),
        EditorView.contentAttributes.of({ "aria-label": options.ariaLabel }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) options.onDocChange(update.state.doc.toString());
        })
      ]
    })
  });

  return {
    setLanguage(language) {
      view.dispatch({ effects: languageCompartment.reconfigure(languageExtension(language)) });
    },
    setEditable(editable) {
      view.dispatch({
        effects: editableCompartment.reconfigure([
          EditorView.editable.of(editable),
          EditorState.readOnly.of(!editable)
        ])
      });
    },
    setDoc(value) {
      if (value === view.state.doc.toString()) return;
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    },
    getDoc() {
      return view.state.doc.toString();
    },
    focus() {
      view.focus();
    },
    destroy() {
      view.destroy();
    }
  };
}
