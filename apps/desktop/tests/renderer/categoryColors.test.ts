import { describe, it, expect } from 'vitest'
import { CATEGORY_HEX } from '../../src/renderer/src/lib/categoryColors'

describe('CATEGORY_HEX', () => {
  it('maps all 7 keys to hex strings', () => {
    for (const key of ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'gray'] as const) {
      expect(CATEGORY_HEX[key]).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})
