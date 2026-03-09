import { loadKnowledgeDocs } from "@/lib/docs";
import { renderMarkdown } from "@/lib/markdown-renderer";

export default async function DocsPage() {
  const docs = await loadKnowledgeDocs();

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 16, display: "grid", gap: 14 }}>
      <header style={{ border: "1px solid var(--c2-border)", borderRadius: 8, background: "var(--c2-panel)", padding: 12 }}>
        <h1 style={{ margin: "0 0 8px" }}>User Documentation</h1>
        <p style={{ margin: 0, color: "var(--c2-muted)" }}>
          Reference material for OSINT analysts using Conflict Tracker. The setup section is optional and mostly for local operators.
        </p>
      </header>

      <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {docs.map((doc) => (
          <a
            key={doc.slug}
            href={`#${doc.slug}`}
            style={{
              border: "1px solid var(--c2-border)",
              borderRadius: 6,
              padding: "6px 10px",
              textDecoration: "none",
              color: "var(--c2-text)",
              background: "#101010"
            }}
          >
            {doc.title}
          </a>
        ))}
      </nav>

      {docs.map((doc) => {
        if (doc.slug === "getting-started") {
          return (
            <details
              key={doc.slug}
              id={doc.slug}
              style={{ border: "1px solid var(--c2-border)", borderRadius: 8, background: "var(--c2-panel)", padding: 14 }}
            >
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>{doc.title} (Local setup / admin)</summary>
              <div style={{ marginTop: 10 }}>{renderMarkdown(doc.content)}</div>
            </details>
          );
        }

        return (
          <article
            key={doc.slug}
            id={doc.slug}
            style={{ border: "1px solid var(--c2-border)", borderRadius: 8, background: "var(--c2-panel)", padding: 14 }}
          >
            <h2 style={{ marginTop: 0 }}>{doc.title}</h2>
            {renderMarkdown(doc.content)}
          </article>
        );
      })}
    </main>
  );
}
