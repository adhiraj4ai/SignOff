import React, { useState } from 'react'
import type { ApprovalStatus, DocumentType } from '@shared/ipc-types'

interface Props {
  vaultPath: string
  feature: string
  type: DocumentType
  status: ApprovalStatus | 'not_found'
  onActionComplete: () => void
}

export function ApproveBar({ vaultPath, feature, type, status, onActionComplete }: Props): React.ReactElement {
  const [rejectMode, setRejectMode] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  if (status !== 'pending') return <></>

  async function handleApprove() {
    setLoading(true)
    await window.chuckle.document.approve(vaultPath, feature, type, null)
    setLoading(false)
    onActionComplete()
  }

  async function handleReject() {
    if (!message.trim()) return
    setLoading(true)
    await window.chuckle.document.reject(vaultPath, feature, type, message)
    setLoading(false)
    setRejectMode(false)
    setMessage('')
    onActionComplete()
  }

  return (
    <div className="border-t border-gray-200 px-6 py-4 bg-white">
      {!rejectMode ? (
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
          >
            Approve
          </button>
          <button
            onClick={() => setRejectMode(true)}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
          >
            Request Changes
          </button>
        </div>
      ) : (
        <div>
          <textarea
            placeholder="Reason for requesting changes…"
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setRejectMode(false); setMessage('') }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={!message.trim() || loading}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
