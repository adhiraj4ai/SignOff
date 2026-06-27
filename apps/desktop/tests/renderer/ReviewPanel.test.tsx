import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReviewPanel } from '@renderer/components/ReviewPanel'
import type { ApprovalRecord, WorkflowConfig } from '@shared/ipc-types'

const workflow: WorkflowConfig = { required_approvers: ['arch@org.com'], min_approvals: 1 }

function record(status: ApprovalRecord['status']): ApprovalRecord {
  return {
    document: 'spec.md',
    feature: 'user-auth',
    type: 'spec',
    workflow: 'spec',
    status,
    history: [{ action: 'submitted', by: 'dev@org.com', at: '2026-06-27T10:00:00Z', message: null }],
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(window.chuckle.document.approve).mockResolvedValue(undefined)
  vi.mocked(window.chuckle.document.reject).mockResolvedValue(undefined)
})

describe('ReviewPanel', () => {
  it('shows a loading state while the record is undefined', () => {
    render(
      <ReviewPanel vaultPath="/v" feature="user-auth" type="spec" record={undefined} workflow={workflow} onActionComplete={() => {}} />
    )
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows the pending status and required approvers', () => {
    render(
      <ReviewPanel vaultPath="/v" feature="user-auth" type="spec" record={record('pending')} workflow={workflow} onActionComplete={() => {}} />
    )
    expect(screen.getByText(/awaiting approval/i)).toBeInTheDocument()
    expect(screen.getByText(/arch@org.com/)).toBeInTheDocument()
  })

  it('shows the approved status', () => {
    render(
      <ReviewPanel vaultPath="/v" feature="user-auth" type="spec" record={record('approved')} workflow={workflow} onActionComplete={() => {}} />
    )
    expect(screen.getByText(/approved/i)).toBeInTheDocument()
  })

  it('shows Not Submitted when there is no record', () => {
    render(
      <ReviewPanel vaultPath="/v" feature="user-auth" type="spec" record={null} workflow={workflow} onActionComplete={() => {}} />
    )
    expect(screen.getByText(/not submitted/i)).toBeInTheDocument()
  })

  it('renders the review history from the record', () => {
    render(
      <ReviewPanel vaultPath="/v" feature="user-auth" type="spec" record={record('pending')} workflow={workflow} onActionComplete={() => {}} />
    )
    expect(screen.getByText(/review history/i)).toBeInTheDocument()
    expect(screen.getAllByText(/submitted/i).length).toBeGreaterThan(0)
  })

  it('shows approve action only when pending', () => {
    const { rerender } = render(
      <ReviewPanel vaultPath="/v" feature="user-auth" type="spec" record={record('pending')} workflow={workflow} onActionComplete={() => {}} />
    )
    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument()
    rerender(
      <ReviewPanel vaultPath="/v" feature="user-auth" type="spec" record={record('approved')} workflow={workflow} onActionComplete={() => {}} />
    )
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
  })
})
