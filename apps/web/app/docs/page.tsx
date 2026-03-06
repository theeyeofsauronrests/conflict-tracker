import { promises as fs } from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";

type DocFile = {
  slug: string;
  title: string;
  fileName: string;
};

const DOC_FILES: DocFile[] = [
  { slug: "getting-started", title: "Getting Started", fileName: "getting-started.md" },
  { slug: "use-cases", title: "Use Cases", fileName: "use-cases.md" },
  { slug: "ui-walkthrough", title: "UI Walkthrough", fileName: "ui-walkthrough.md" }
];

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match = regex.exec(text);

  while (match) {
    const fullMatch = match[0];
    const label = match[1];
    const href = match[2];
    const start = match.index;

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    nodes.push(
      <a key={`${href}-${start}`} href={href} target="_blank" rel="noreferrer" style={{ color: "#8cc9ff" }}>
        {label}
      </a>
    );

    lastIndex = start + fullMatch.length;
    match = regex.exec(text);
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function renderMarkdown(content: string): ReactNode[] {
  const lines = content.split(/\r?\n/);
  const output: ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let paragraphLines: string[] = [];
  let bulletItems: string[] = [];
  let orderedItems: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    const text = paragraphLines.join(" ").trim();
    if (!text) return;
    output.push(
      <p key={`p-${output.length}`} style={{ margin: "8px 0", lineHeight: 1.5 }}>
        {renderInline(text)}
      </p>
    );
    paragraphLines = [];
  };

  const flushBullet = () => {
    if (bulletItems.length === 0) return;
    output.push(
      <ul key={`ul-${output.length}`} style={{ margin: "8px 0 8px 20px" }}>
        {bulletItems.map((item, index) => (
          <li key={`li-${index}`} style={{ marginBottom: 4 }}>
            {renderInline(item)}
          </li>
        ))}
      </ul>
    );
    bulletItems = [];
  };

  const flushOrdered = () => {
    if (orderedItems.length === 0) return;
    output.push(
      <ol key={`ol-${output.length}`} style={{ margin: "8px 0 8px 20px" }}>
        {orderedItems.map((item, index) => (
          <li key={`oli-${index}`} style={{ marginBottom: 4 }}>
            {renderInline(item)}
          </li>
        ))}
      </ol>
    );
    orderedItems = [];
  };

  const flushCode = () => {
    if (codeLines.length === 0) return;
    output.push(
      <pre
        key={`code-${output.length}`}
        style={{
          margin: "10px 0",
          padding: 10,
          background: "#0a0f16",
          border: "1px solid #243245",
          borderRadius: 8,
          overflowX: "auto"
        }}
      >
        <code>{codeLines.join("\n")}</code>
      </pre>
    );
    codeLines = [];
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      flushParagraph();
      flushBullet();
      flushOrdered();
      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      flushBullet();
      flushOrdered();
      output.push(
        <h1 key={`h1-${output.length}`} style={{ margin: "14px 0 8px", fontSize: 28 }}>
          {renderInline(line.replace(/^#\s+/, ""))}
        </h1>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushBullet();
      flushOrdered();
      output.push(
        <h2 key={`h2-${output.length}`} style={{ margin: "14px 0 8px", fontSize: 22 }}>
          {renderInline(line.replace(/^##\s+/, ""))}
        </h2>
      );
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushBullet();
      flushOrdered();
      output.push(
        <h3 key={`h3-${output.length}`} style={{ margin: "12px 0 6px", fontSize: 18 }}>
          {renderInline(line.replace(/^###\s+/, ""))}
        </h3>
      );
      continue;
    }

    if (/^- /.test(line)) {
      flushParagraph();
      flushOrdered();
      bulletItems.push(line.replace(/^- /, ""));
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      flushParagraph();
      flushBullet();
      orderedItems.push(line.replace(/^\d+\.\s+/, ""));
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      flushBullet();
      flushOrdered();
      continue;
    }

    flushBullet();
    flushOrdered();
    paragraphLines.push(line.trim());
  }

  flushParagraph();
  flushBullet();
  flushOrdered();
  flushCode();

  return output;
}

async function resolveKnowledgeBaseDir(): Promise<string> {
  const candidates = [path.join(process.cwd(), "knowledge-base"), path.join(process.cwd(), "..", "..", "knowledge-base")];
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Keep searching candidate paths.
    }
  }
  throw new Error("knowledge-base directory not found");
}

export default async function DocsPage() {
  const kbDir = await resolveKnowledgeBaseDir();
  const docs = await Promise.all(
    DOC_FILES.map(async (doc) => {
      const content = await fs.readFile(path.join(kbDir, doc.fileName), "utf8");
      return { ...doc, content };
    })
  );

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 16, display: "grid", gap: 14 }}>
      <header style={{ border: "1px solid var(--c2-border)", borderRadius: 8, background: "var(--c2-panel)", padding: 12 }}>
        <h1 style={{ margin: "0 0 8px" }}>User Documentation</h1>
        <p style={{ margin: 0, color: "var(--c2-muted)" }}>Reference material for OSINT analysts using Conflict Tracker.</p>
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

      {docs.map((doc) => (
        <article
          key={doc.slug}
          id={doc.slug}
          style={{ border: "1px solid var(--c2-border)", borderRadius: 8, background: "var(--c2-panel)", padding: 14 }}
        >
          <h2 style={{ marginTop: 0 }}>{doc.title}</h2>
          {renderMarkdown(doc.content)}
        </article>
      ))}
    </main>
  );
}
