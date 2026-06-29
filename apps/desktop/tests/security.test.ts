import { describe, it, expect } from 'vitest'
import {
  isAllowedExternalUrl,
  isAllowedNavigation,
  contentSecurityPolicy,
  rendererWebPreferences,
} from '../src/main/security.js'

describe('isAllowedExternalUrl', () => {
  it('allows https URLs', () => {
    expect(isAllowedExternalUrl('https://github.com/adhiraj4ai/signoff')).toBe(true)
  })
  it('allows http URLs', () => {
    expect(isAllowedExternalUrl('http://example.com')).toBe(true)
  })
  it('denies file: URLs', () => {
    expect(isAllowedExternalUrl('file:///etc/passwd')).toBe(false)
  })
  it('denies javascript: URLs', () => {
    expect(isAllowedExternalUrl('javascript:alert(1)')).toBe(false)
  })
  it('denies smb: URLs', () => {
    expect(isAllowedExternalUrl('smb://attacker/share')).toBe(false)
  })
  it('denies a non-URL string', () => {
    expect(isAllowedExternalUrl('not a url')).toBe(false)
  })
})

describe('isAllowedNavigation', () => {
  const appOrigin = 'http://localhost:5173/index.html'
  it('allows same-origin navigation', () => {
    expect(isAllowedNavigation('http://localhost:5173/other', appOrigin)).toBe(true)
  })
  it('allows in-page navigation to the same file URL origin', () => {
    expect(isAllowedNavigation('file:///app/renderer/index.html#x', 'file:///app/renderer/index.html')).toBe(true)
  })
  it('denies cross-origin navigation', () => {
    expect(isAllowedNavigation('https://evil.example.com', appOrigin)).toBe(false)
  })
  it('denies when there is no current URL yet', () => {
    expect(isAllowedNavigation('https://github.com', '')).toBe(false)
  })
  it('denies when the target is not a valid URL', () => {
    expect(isAllowedNavigation('::::', appOrigin)).toBe(false)
  })
})

describe('contentSecurityPolicy', () => {
  it('contains the core hardening directives in prod', () => {
    const csp = contentSecurityPolicy(false)
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("frame-src 'none'")
    expect(csp).toContain("base-uri 'self'")
    expect(csp).toContain("form-action 'none'")
  })
  it('does not allow unsafe-eval in prod', () => {
    expect(contentSecurityPolicy(false)).not.toContain("'unsafe-eval'")
  })
  it('uses script-src self only in prod', () => {
    expect(contentSecurityPolicy(false)).toContain("script-src 'self'")
  })
  it('allows unsafe-eval and ws: in dev (HMR runtime)', () => {
    const csp = contentSecurityPolicy(true)
    expect(csp).toContain("'unsafe-eval'")
    expect(csp).toContain('ws:')
  })
})

describe('rendererWebPreferences', () => {
  it('hardens the renderer: sandbox, contextIsolation, no nodeIntegration', () => {
    const wp = rendererWebPreferences('/path/to/preload.cjs')
    expect(wp.sandbox).toBe(true)
    expect(wp.contextIsolation).toBe(true)
    expect(wp.nodeIntegration).toBe(false)
    expect(wp.preload).toBe('/path/to/preload.cjs')
  })
})
