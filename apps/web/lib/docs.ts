import { promises as fs } from "node:fs";
import path from "node:path";

export type DocFile = {
  slug: string;
  title: string;
  fileName: string;
};

export const DOC_FILES: DocFile[] = [
  { slug: "use-cases", title: "Use Cases", fileName: "use-cases.md" },
  { slug: "ui-walkthrough", title: "UI Walkthrough", fileName: "ui-walkthrough.md" },
  { slug: "getting-started", title: "Getting Started", fileName: "getting-started.md" }
];

export async function resolveKnowledgeBaseDir(): Promise<string> {
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

export async function loadKnowledgeDocs() {
  const kbDir = await resolveKnowledgeBaseDir();
  return Promise.all(
    DOC_FILES.map(async (doc) => {
      const content = await fs.readFile(path.join(kbDir, doc.fileName), "utf8");
      return { ...doc, content };
    })
  );
}
