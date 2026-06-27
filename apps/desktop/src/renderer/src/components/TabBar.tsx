import React from 'react'
import type { DocumentType } from '@shared/ipc-types'
import type { Selection } from '../hooks/useVault'

interface Props {
  tabs: Selection[]
  active: Selection | null
  onSelect: (feature: string, type: DocumentType) => void
  onClose: (feature: string, type: DocumentType) => void
}

export function TabBar({ tabs, active, onSelect, onClose }: Props): React.ReactElement | null {
  if (tabs.length === 0) return null
  return (
    <div className="flex items-stretch h-9 bg-mist border-b border-line overflow-x-auto shrink-0">
      {tabs.map((t) => {
        const isActive = !!active && active.feature === t.feature && active.type === t.type
        return (
          <div
            key={`${t.feature}/${t.type}`}
            onClick={() => onSelect(t.feature, t.type)}
            className={`group flex items-center gap-2 pl-3 pr-1.5 border-r border-line text-[12.5px] cursor-pointer whitespace-nowrap transition-colors ${
              isActive ? 'bg-white text-ink' : 'text-ink/55 hover:bg-white/60'
            }`}
          >
            <span className="font-mono">
              {t.feature}
              <span className="text-ink/30">/</span>
              {t.type}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClose(t.feature, t.type)
              }}
              aria-label={`Close ${t.feature} ${t.type}`}
              className="w-4 h-4 grid place-items-center rounded text-ink/35 hover:text-ink hover:bg-line opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
            >
              <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}
