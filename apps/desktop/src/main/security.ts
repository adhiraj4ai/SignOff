/**
 * Pure security policy helpers for the Electron main process.
 *
 * These are kept free of any Electron imports so they can be unit-tested in a
 * plain Node environment. `index.ts` wires them into the BrowserWindow,
 * will-navigate, open-external, and onHeadersReceived handlers.
 */

/**
 * True only for http(s) URLs. A renderer-supplied value with any other scheme
 * (file:, javascript:, smb:, custom protocol handlers, …) could trigger
 * arbitrary local handlers when passed to shell.openExternal — refuse it.
 */
export function isAllowedExternalUrl(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(String(url))
  } catch {
    return false
  }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:'
}

/**
 * The renderer is a bundled local app and should never navigate away from its
 * own origin. Allow only same-origin navigation (the dev server, or in-page
 * file reloads); deny cross-origin. An empty `appOrigin` (no current URL yet)
 * is treated as deny.
 */
export function isAllowedNavigation(targetUrl: string, appOrigin: string): boolean {
  if (!appOrigin) return false
  let target: URL
  let current: URL
  try {
    target = new URL(targetUrl)
    current = new URL(appOrigin)
  } catch {
    return false
  }
  return target.origin === current.origin
}

/**
 * The strict Content-Security-Policy applied to every renderer response. The
 * app is fully bundled (Vite inlines mermaid/katex/highlight.js and their
 * assets), so no remote origins are needed. Inline styles/data: images are
 * allowed because the bundler emits inline <style> tags and SVG data: URIs
 * (e.g. the favicon); 'unsafe-eval' is required by the dev server's HMR runtime
 * only and is therefore never present in production.
 */
export function contentSecurityPolicy(isDev: boolean): string {
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self'"
  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'" + (isDev ? ' ws:' : ''),
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join('; ')
}

/**
 * The renderer webPreferences used for the main BrowserWindow. Exported as a
 * factory (the preload path is resolved at runtime) so tests can assert the
 * hardening flags without launching Electron. The preload uses only
 * contextBridge + ipcRenderer, both of which work under the OS sandbox.
 */
export function rendererWebPreferences(preloadPath: string): {
  preload: string
  contextIsolation: true
  nodeIntegration: false
  sandbox: true
} {
  return {
    preload: preloadPath,
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  }
}
