"use client";

import { useEffect, useRef } from "react";
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, placeholder } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching, defaultHighlightStyle, syntaxHighlighting, indentUnit } from "@codemirror/language";

// Languages load on demand so the editor bundle stays small.
const LANGUAGES: Record<string, () => Promise<Extension>> = {
  javascript: () => import("@codemirror/lang-javascript").then((m) => m.javascript()),
  jsx: () => import("@codemirror/lang-javascript").then((m) => m.javascript({ jsx: true })),
  typescript: () => import("@codemirror/lang-javascript").then((m) => m.javascript({ typescript: true })),
  tsx: () => import("@codemirror/lang-javascript").then((m) => m.javascript({ typescript: true, jsx: true })),
  python: () => import("@codemirror/lang-python").then((m) => m.python()),
  sql: () => import("@codemirror/lang-sql").then((m) => m.sql()),
  postgresql: () => import("@codemirror/lang-sql").then((m) => m.sql({ dialect: m.PostgreSQL })),
  yaml: () => import("@codemirror/lang-yaml").then((m) => m.yaml()),
  json: () => import("@codemirror/lang-json").then((m) => m.json()),
  go: () => import("@codemirror/lang-go").then((m) => m.go()),
  rust: () => import("@codemirror/lang-rust").then((m) => m.rust()),
  java: () => import("@codemirror/lang-java").then((m) => m.java()),
};
const ALIASES: Record<string, string> = { js: "javascript", ts: "typescript", py: "python", golang: "go", rs: "rust", yml: "yaml", postgres: "postgresql" };

const creamTheme = EditorView.theme({
  "&": {
    backgroundColor: "var(--color-surface)",
    color: "var(--color-ink)",
    borderRadius: "0.75rem",
    border: "1px solid transparent",
    fontSize: "13.5px",
    transition: "border-color 150ms",
  },
  "&.cm-focused": { outline: "none", borderColor: "color-mix(in srgb, var(--color-ink) 25%, transparent)" },
  ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.6", padding: "0.5rem 0" },
  ".cm-content": { padding: "0.25rem 0", caretColor: "var(--color-brand)", minHeight: "11rem" },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: "color-mix(in srgb, var(--color-ink) 35%, transparent)",
    border: "none",
    paddingLeft: "0.5rem",
  },
  ".cm-activeLine": { backgroundColor: "color-mix(in srgb, var(--color-ink) 4%, transparent)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--color-ink)" },
  ".cm-cursor": { borderLeftColor: "var(--color-brand)", borderLeftWidth: "2px" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "color-mix(in srgb, var(--color-brand) 16%, transparent) !important",
  },
  ".cm-matchingBracket": { backgroundColor: "color-mix(in srgb, var(--color-brand) 14%, transparent)", outline: "none" },
  ".cm-placeholder": { color: "color-mix(in srgb, var(--color-ink) 35%, transparent)", fontStyle: "normal" },
});

export function CodeEditor({ value, onChange, language }: { value: string; onChange: (v: string) => void; language: string | null }) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancelled = false;

    const key = language ? (ALIASES[language] ?? language) : "";
    const load = LANGUAGES[key]?.() ?? Promise.resolve<Extension>([]);

    load.catch(() => [] as Extension).then((lang) => {
      if (cancelled || !el) return;
      const state = EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          history(),
          bracketMatching(),
          highlightActiveLine(),
          indentUnit.of("  "),
          syntaxHighlighting(defaultHighlightStyle),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          placeholder("Your code"),
          creamTheme,
          EditorView.lineWrapping,
          lang,
          EditorView.updateListener.of((u) => {
            if (u.docChanged) latest.current(u.state.doc.toString());
          }),
        ],
      });
      view.current = new EditorView({ state, parent: el });
    });

    return () => {
      cancelled = true;
      view.current?.destroy();
      view.current = null;
    };
    // The editor owns its document after mount; `value` only seeds it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // External resets (e.g. switching back to a question) re-seed the document.
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
    }
  }, [value]);

  return <div ref={host} aria-label={`Code editor${language ? `, ${language}` : ""}`} />;
}
