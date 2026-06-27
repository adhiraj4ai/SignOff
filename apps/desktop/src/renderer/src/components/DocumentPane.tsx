import React, { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import type { ApprovalRecord, VaultWorkflows, DocumentType } from '@shared/ipc-types'

interface Props {
  vaultPath: string
  feature: string
  type: DocumentType
  onApprove: () => void
  onReject: () => void
}

function statusLabel(status: string): string {
  if (status === 'pending') return 'Awaiting Approval'
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Changes Requested'
  return 'Not Submitted'
}

function statusColor(status: string): string {
  if (status === 'pending') return 'text-amber-600'
  if (status === 'approved') return 'text-green-600'
  if (status === 'rejected') return 'text-red-600'
  return 'text-gray-400'
}

interface DocState {
  content: string
  record: ApprovalRecord | null
  workflows: VaultWorkflows | null
}

export function DocumentPane({ vaultPath, feature, type, onApprove: _onApprove, onReject: _onReject }: Props): React.ReactElement {
  const [state, setState] = useState<DocState | null>(null)

  useEffect(() => {
    setState(null)
    Promise.all([
      window.chuckle.document.read(vaultPath, feature, type),
      window.chuckle.document.getApproval(vaultPath, feature, type),
      window.chuckle.workflows.read(vaultPath),
    ]).then(([content, record, workflows]) => {
      setState({ content, record, workflows })
    }).catch((err) => {
      setState({ content: `Error loading document: ${err instanceof Error ? err.message : String(err)}`, record: null, workflows: null })
    })
  }, [vaultPath, feature, type])

  if (!state) return <div className="flex-1 flex items-center justify-center text-gray-400">Loading…</div>

  const { content, record, workflows } = state
  const status = record?.status ?? 'not_found'
  const submittedBy = record?.history.find(e => e.action === 'submitted')?.by
  const workflow = workflows?.[type]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 bg-white">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <span className="font-medium text-gray-800">{feature}</span>
          <span>/</span>
          <span>{type}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${statusColor(status)}`}>
            {record ? statusLabel(status) : 'Not Submitted'}
          </span>
          {submittedBy && <span className="text-xs text-gray-400">by {submittedBy}</span>}
        </div>
        {workflow && (
          <p className="text-xs text-gray-400 mt-1">
            Requires {workflow.min_approvals} approval(s) from: {workflow.required_approvers.join(', ')}
          </p>
        )}
      </div>

      {/* Markdown content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 prose prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {content}
        </ReactMarkdown>
      </div>

      {/* Actions — rendered in ApproveBar (Task 7) */}
      <div id="approve-bar-slot" />
    </div>
  )
}
