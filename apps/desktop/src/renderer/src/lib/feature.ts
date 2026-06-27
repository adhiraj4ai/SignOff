// Acronyms we keep uppercased when humanizing a feature slug.
const ACRONYMS = new Set([
  'mcp',
  'api',
  'ui',
  'ux',
  'cli',
  'id',
  'sdk',
  'db',
  'url',
  'http',
  'io',
  'ai',
])

/** Turn a kebab/snake slug into a human-readable title: "mcp-server" → "MCP Server". */
export function humanizeFeature(name: string): string {
  return name
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => (ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}
