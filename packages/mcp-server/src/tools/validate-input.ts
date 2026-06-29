import path from "node:path";

/**
 * Validates a project-relative document path. Rejects absolute paths and any
 * path that normalizes to a location outside the project root (path traversal).
 * Returns the validated (unchanged) path on success; throws otherwise.
 */
export function validateDocumentPath(documentPath: string, projectRoot: string): string {
  if (path.isAbsolute(documentPath)) {
    throw new Error(
      `document_path must be a project-relative path, got absolute path: ${documentPath}`
    );
  }
  const rel = path.relative(projectRoot, path.resolve(projectRoot, documentPath));
  if (rel === ".." || rel.startsWith(".." + path.sep) || rel.startsWith("../")) {
    throw new Error(
      `document_path escapes the project root: ${documentPath}`
    );
  }
  return documentPath;
}
