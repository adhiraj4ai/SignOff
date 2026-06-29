import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { DocumentPane } from '@renderer/components/DocumentPane'
import type { ApprovalRecord } from '@shared/ipc-types'

const mockRecord: ApprovalRecord = {
  document: 'spec.md',
  feature: 'user-auth',
  type: 'spec',
  workflow: 'spec',
  status: 'pending',
  history: [
    { action: 'submitted', by: 'dev@org.com', at: '2026-06-27T10:00:00Z', message: null },
  ],
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(window.signoff.document.read).mockResolvedValue('# User Auth Spec\n\nThis is the spec.')
  vi.mocked(window.signoff.document.getApproval).mockResolvedValue(mockRecord)
  vi.mocked(window.signoff.workflows.read).mockResolvedValue({
    spec: { required_approvers: ['arch@org.com'], min_approvals: 1 },
    plan: { required_approvers: ['lead@org.com'], min_approvals: 1 },
  })
})

describe('DocumentPane', () => {
  it('shows loading state initially', () => {
    render(<DocumentPane vaultPath="/vault" feature="user-auth" type="spec" />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders document heading from markdown', async () => {
    render(<DocumentPane vaultPath="/vault" feature="user-auth" type="spec" />)
    await waitFor(() => screen.getByRole('heading', { name: /user auth spec/i }))
  })

  it('shows the human-readable feature name and a document-type tab in the header', async () => {
    render(<DocumentPane vaultPath="/vault" feature="user-auth" type="spec" />)
    await waitFor(() => screen.getByText('User Auth'))
    // the type tab "spec" (lowercase text, capitalized via CSS) sits beside the name
    expect(screen.getAllByText('spec').length).toBeGreaterThan(0)
  })

  it('ignores a stale document.read response that resolves after switching feature (#14)', async () => {
    // Defer each read so we control resolution order: the OLD feature's read
    // resolves AFTER the NEW one — the alive guard must drop the stale result.
    const deferreds: Record<string, (v: string) => void> = {}
    vi.mocked(window.signoff.document.read).mockImplementation(
      (_v: string, feature: string) =>
        new Promise<string>((resolve) => {
          deferreds[feature] = resolve
        }),
    )

    const { rerender } = render(<DocumentPane vaultPath="/vault" feature="old-feature" type="spec" />)
    // switch to a new feature before the old read resolves
    rerender(<DocumentPane vaultPath="/vault" feature="new-feature" type="spec" />)

    // newer selection resolves first, then the stale older one resolves late
    deferreds['new-feature']('# New Feature Spec')
    await waitFor(() => screen.getByRole('heading', { name: /new feature spec/i }))
    deferreds['old-feature']('# Old Feature Spec')

    // the stale response must never replace the current content
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: /old feature spec/i })).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('heading', { name: /new feature spec/i })).toBeInTheDocument()
  })

  it('surfaces a save error and keeps the editor open when write fails', async () => {
    vi.mocked(window.signoff.document.write).mockRejectedValue(new Error('disk full'))
    render(<DocumentPane vaultPath="/vault" feature="user-auth" type="spec" />)
    await waitFor(() => screen.getByRole('heading', { name: /user auth spec/i }))
    // enter edit mode
    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }))
    const textarea = await screen.findByRole('textbox')
    fireEvent.change(textarea, { target: { value: '# changed content' } })
    // Save appears once dirty
    fireEvent.click(await screen.findByRole('button', { name: /^save$/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/disk full/i))
    // editor still open (textarea still present, content not committed to read view)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})
