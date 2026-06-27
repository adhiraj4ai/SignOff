import React from 'react'
import type { FeatureEntry, ApprovalStatus } from '@shared/ipc-types'

type DocType = 'spec' | 'plan'

interface Props {
  vaultName: string
  features: FeatureEntry[]
  selected: { feature: string; type: DocType } | null
  onSelect: (feature: string, type: DocType) => void
  onSync: () => void
}

function statusIcon(status: ApprovalStatus | 'not_found'): string {
  if (status === 'pending') return '⏳'
  if (status === 'approved') return '✅'
  if (status === 'rejected') return '❌'
  return ''
}

export function Sidebar({ vaultName, features, selected, onSelect, onSync }: Props): React.ReactElement {
  return (
    <div className="w-56 min-w-56 bg-gray-100 border-r border-gray-200 flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <span className="font-semibold text-sm truncate">{vaultName}</span>
        <button
          onClick={onSync}
          className="text-xs text-blue-600 hover:text-blue-800 ml-2 shrink-0"
        >
          Sync
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {features.length === 0 && (
          <p className="text-xs text-gray-400 px-4 py-2">No documents yet.</p>
        )}
        {features.map(f => (
          <div key={f.name} className="mb-1">
            <p className="text-xs font-semibold text-gray-500 uppercase px-4 py-1 tracking-wide">
              {f.name}
            </p>
            {(['spec', 'plan'] as DocType[]).map(type => {
              const status = f[type]
              if (status === 'not_found') return null
              const isSelected = selected?.feature === f.name && selected?.type === type
              return (
                <button
                  key={type}
                  onClick={() => onSelect(f.name, type)}
                  aria-label={type}
                  className={`w-full text-left flex items-center gap-2 px-4 py-1.5 text-sm transition-colors ${
                    isSelected ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <span className="text-base">{statusIcon(status)}</span>
                  <span>{type}</span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
