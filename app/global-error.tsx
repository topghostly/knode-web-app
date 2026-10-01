"use client";

// Replaces the root layout when it fails, so it ships its own document and
// styles: no Tailwind, no fonts.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#eadfc9",
          color: "#383838",
          fontFamily: "system-ui, sans-serif",
          padding: "24px",
        }}
      >
        <main style={{ maxWidth: 420, width: "100%" }}>
          <h1 style={{ fontSize: 28, lineHeight: 1.1, margin: 0, fontWeight: 500 }}>That didn&rsquo;t load.</h1>
          <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.6, opacity: 0.75 }}>
            Usually a connection hiccup between here and the database.
          </p>
          <button
            type="button"
            onClick={retry}
            style={{
              marginTop: 28,
              height: 48,
              width: "100%",
              borderRadius: 12,
              border: 0,
              background: "#0044b1",
              color: "#eadfc9",
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && <p style={{ marginTop: 24, fontSize: 11, opacity: 0.4, fontFamily: "monospace" }}>Ref {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
