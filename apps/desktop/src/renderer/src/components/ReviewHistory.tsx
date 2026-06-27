import React from 'react'
import type { ApprovalHistoryEntry } from '@shared/ipc-types'

interface Props {
  history: ApprovalHistoryEntry[]
}

const actionLabel: Record<ApprovalHistoryEntry['action'], string> = {
  submitted: 'Submitted',
  resubmitted: 'Resubmitted',
  approved: '✅ Approved',
  rejected: '❌ Changes requested',
}

export function ReviewHistory({ history }: Props): React.ReactElement {
  if (history.length === 0) return <></>
  return (
    <div className="border-t border-gray-200 px-6 py-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Review History</h3>
      <ul className="space-y-2">
        {history.map((entry, i) => (
          <li key={i} className="text-sm">
            <span className="font-medium">{actionLabel[entry.action]}</span>
            <span className="text-gray-400"> by {entry.by}</span>
            <span className="text-gray-400"> — {new Date(entry.at).toLocaleDateString()}</span>
            {entry.message && (
              <p className="text-gray-500 text-xs mt-0.5 pl-2 border-l-2 border-gray-200">
                {entry.message}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
