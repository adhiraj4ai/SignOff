import React from 'react'
import type { CategoryColor } from '@shared/ipc-types'
import { CATEGORY_HEX } from '../lib/categoryColors'

export function CategorySwatch({
  color,
  size = 8,
}: {
  color: CategoryColor
  size?: number
}): React.ReactElement {
  return (
    <span
      className="inline-block rounded-full shrink-0"
      style={{ width: size, height: size, backgroundColor: CATEGORY_HEX[color] }}
      aria-hidden
    />
  )
}
