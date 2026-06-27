import React from 'react'
import type { FeatureEntry, ApprovalStatus } from '@shared/ipc-types'

type DocType = 'spec' | 'plan'

interface Props {
  vaultName: string
  features: FeatureEntry[]
  selected: { feature: string; type: DocType } | null
  onSelect: (feature: string, type: DocType) => void
  onSync: () => void
  onSwitchVault?: () => void
}

function statusIcon(status: ApprovalStatus | 'not_found'): string {
  if (status === 'pending') return '⏳'
  if (status === 'approved') return '✅'
  if (status === 'rejected') return '❌'
  return ''
}

export function Sidebar({
  vaultName,
  features,
  selected,
  onSelect,
  onSync,
  onSwitchVault,
}: Props): React.ReactElement {
  return (
    <aside className="w-60 min-w-60 bg-ink text-white flex flex-col h-full select-none">
      <header className="h-14 px-2.5 flex items-center justify-between gap-1 border-b border-white/[0.08]">
        <button
          onClick={onSwitchVault}
          title="Switch project"
          className="group flex items-center gap-2.5 min-w-0 px-1 py-1 rounded-md hover:bg-white/[0.08] transition-colors"
        >
          <span className="grid place-items-center w-6 h-6 rounded-md bg-iris text-white text-[13px] font-bold shrink-0">
            C
          </span>
          <span className="font-semibold text-[13px] text-white/95 truncate" title={vaultName}>
            {vaultName}
          </span>
          <svg
            viewBox="0 0 12 12"
            className="w-3 h-3 text-white/30 group-hover:text-white/60 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={onSync}
          title="Pull the latest documents from the vault"
          className="text-[11px] font-medium text-white/45 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/[0.08] shrink-0"
        >
          Sync
        </button>
      </header>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {features.length === 0 && (
          <p className="text-[12px] leading-relaxed text-white/35 px-3 py-2">
            No documents published yet. They appear here once Claude publishes a spec or plan.
          </p>
        )}
        {features.map((f) => (
          <div key={f.name} className="mb-4">
            <p className="text-[10.5px] font-semibold tracking-[0.09em] uppercase text-white/35 px-3 mb-1">
              {f.name}
            </p>
            {(['spec', 'plan'] as DocType[]).map((type) => {
              const status = f[type]
              if (status === 'not_found') return null
              const isSelected = selected?.feature === f.name && selected?.type === type
              return (
                <button
                  key={type}
                  onClick={() => onSelect(f.name, type)}
                  aria-label={type}
                  className={`group relative w-full flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-md text-[13px] transition-colors ${
                    isSelected
                      ? 'bg-white/[0.12] text-white'
                      : 'text-white/60 hover:bg-white/[0.06] hover:text-white/90'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-iris" />
                  )}
                  <span className="text-[12px] leading-none w-4 text-center">{statusIcon(status)}</span>
                  <span className="capitalize">{type}</span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <footer className="px-4 py-2.5 border-t border-white/[0.08] text-[10.5px] tracking-wide text-white/30">
        Chuckle · review &amp; approve
      </footer>
    </aside>
  )
}
