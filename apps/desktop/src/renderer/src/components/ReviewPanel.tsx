import React, { useEffect, useState } from 'react'
import type { ApprovalRecord, DocumentType, ReviewResult, WorkflowConfig } from '@shared/ipc-types'
import { ReviewHistory } from './ReviewHistory'
import { ApproveBar } from './ApproveBar'
import { ReviewerSettings } from './ReviewerSettings'

type Status = string

function statusLabel(status: Status): string {
  if (status === 'pending') return 'Awaiting Approval'
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Changes Requested'
  return 'Not Submitted'
}

function statusPill(status: Status): string {
  if (status === 'pending') return 'bg-wait-soft text-wait'
  if (status === 'approved') return 'bg-ok-soft text-ok'
  if (status === 'rejected') return 'bg-stop-soft text-stop'
  return 'bg-app text-fg/45'
}

function statusDot(status: Status): string {
  if (status === 'pending') return 'bg-wait'
  if (status === 'approved') return 'bg-ok'
  if (status === 'rejected') return 'bg-stop'
  return 'bg-ink/30'
}

interface Props {
  vaultPath: string
  feature: string
  type: DocumentType
  /** undefined = still loading, null = no record yet */
  record: ApprovalRecord | null | undefined
  workflow: WorkflowConfig | undefined
  onActionComplete: (result?: ReviewResult) => void
}

export function ReviewPanel({
  vaultPath,
  feature,
  type,
  record,
  workflow,
  onActionComplete,
}: Props): React.ReactElement {
  const status = record?.status ?? 'not_found'
  const submittedBy = record?.history.find((e) => e.action === 'submitted')?.by

  const [authorEmail, setAuthorEmail] = useState<string>('')
  const [isStale, setIsStale] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    let alive = true
    window.chuckle.vault.author(vaultPath).then((a) => {
      if (alive) setAuthorEmail(a.email)
    })
    return () => { alive = false }
  }, [vaultPath])

  useEffect(() => {
    if (!record) { setIsStale(false); return }
    let alive = true
    window.chuckle.document.isStale(vaultPath, feature, type).then((s) => {
      if (alive) setIsStale(s)
    })
    return () => { alive = false }
  }, [vaultPath, feature, type, record])

  const canApprove =
    !workflow?.required_approvers?.length ||
    workflow.required_approvers.includes(authorEmail)

  if (showSettings) {
    return (
      <aside className="w-80 min-w-80 border-l border-border bg-surface flex flex-col h-full overflow-y-auto">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-[11px] font-semibold text-fg/45">Reviewer settings</h2>
          <button
            onClick={() => setShowSettings(false)}
            className="text-[12px] text-fg/50 hover:text-fg transition"
          >
            Back
          </button>
        </div>
        <div className="p-5">
          <ReviewerSettings vaultPath={vaultPath} onClose={() => setShowSettings(false)} />
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-80 min-w-80 border-l border-border bg-surface flex flex-col h-full overflow-y-auto">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-semibold text-fg/45">Review</h2>
          <button
            onClick={() => setShowSettings(true)}
            className="text-[11px] text-fg/40 hover:text-iris transition px-1.5 py-0.5 rounded hover:bg-iris/10"
          >
            Reviewers
          </button>
        </div>
        {record === undefined ? (
          <p className="text-[12px] text-fg/40">Loading…</p>
        ) : (
          <div className="space-y-2.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium ${statusPill(status)}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusDot(status)}`} />
              {statusLabel(status)}
            </span>
            {isStale && record?.status === 'approved' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium bg-wait-soft text-wait">
                Approved — changed since approval
              </span>
            )}
            {submittedBy && (
              <p className="text-[12px] text-fg/50">
                Submitted by <span className="text-fg/75">{submittedBy}</span>
              </p>
            )}
            {workflow && status !== 'approved' && (
              <p className="text-[11.5px] leading-relaxed text-fg/45">
                Needs {workflow.min_approvals} approval
                {workflow.min_approvals === 1 ? '' : 's'}
                {workflow.required_approvers.length > 0 && (
                  <>
                    {' '}from{' '}
                    <span className="text-fg/65">{workflow.required_approvers.join(', ')}</span>
                  </>
                )}
              </p>
            )}
          </div>
        )}
      </div>

      {record !== undefined && (
        <ApproveBar
          vaultPath={vaultPath}
          feature={feature}
          type={type}
          status={record?.status ?? 'not_found'}
          canApprove={canApprove}
          approvers={workflow?.required_approvers ?? []}
          onActionComplete={onActionComplete}
        />
      )}

      {record && record.history.length > 0 && <ReviewHistory history={record.history} />}
    </aside>
  )
}
