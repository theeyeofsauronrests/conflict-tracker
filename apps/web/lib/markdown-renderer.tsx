import React from "react";
import type { ReactNode } from "react";

const headingStyles = {
  h1: { margin: "14px 0 8px", fontSize: 28 },
  h2: { margin: "14px 0 8px", fontSize: 22 },
  h3: { margin: "12px 0 6px", fontSize: 18 }
} as const;

const blockStyles = {
  paragraph: { margin: "8px 0", lineHeight: 1.5 },
  list: { margin: "8px 0 8px 20px" },
  listItem: { marginBottom: 4 },
  code: {
    margin: "10px 0",
    padding: 10,
    background: "#0a0f16",
    border: "1px solid #243245",
    borderRadius: 8,
    overflowX: "auto"
  }
} as const;

function sanitizeExternalUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = regex.exec(text);

  while (match) {
    const fullMatch = match[0];
    const label = match[1];
    const href = sanitizeExternalUrl(match[2] ?? "");
    const start = match.index;

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    if (href) {
      nodes.push(
        <a key={`${href}-${start}`} href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#8cc9ff" }}>
          {label}
        </a>
      );
    } else {
      // Keep rendering readable text when URL is not safe to link.
      nodes.push(label);
    }

    lastIndex = start + fullMatch.length;
    match = regex.exec(text);
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export function renderMarkdown(content: string): ReactNode[] {
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
    paragraphLines = [];
    if (!text) return;
    output.push(
      <p key={`p-${output.length}`} style={blockStyles.paragraph}>
        {renderInline(text)}
      </p>
    );
  };

  const flushBullet = () => {
    if (bulletItems.length === 0) return;
    output.push(
      <ul key={`ul-${output.length}`} style={blockStyles.list}>
        {bulletItems.map((item, index) => (
          <li key={`li-${index}`} style={blockStyles.listItem}>
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
      <ol key={`ol-${output.length}`} style={blockStyles.list}>
        {orderedItems.map((item, index) => (
          <li key={`oli-${index}`} style={blockStyles.listItem}>
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
      <pre key={`code-${output.length}`} style={blockStyles.code}>
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
        <h1 key={`h1-${output.length}`} style={headingStyles.h1}>
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
        <h2 key={`h2-${output.length}`} style={headingStyles.h2}>
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
        <h3 key={`h3-${output.length}`} style={headingStyles.h3}>
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
