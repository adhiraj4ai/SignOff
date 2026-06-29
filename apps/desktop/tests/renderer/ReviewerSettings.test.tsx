import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReviewerSettings } from '@renderer/components/ReviewerSettings'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(window.signoff.workflows.read).mockResolvedValue({
    spec: { required_approvers: ['lead@org.com'], min_approvals: 1 },
    plan: { required_approvers: [], min_approvals: 1 },
  })
  vi.mocked(window.signoff.workflows.write).mockResolvedValue(undefined)
})

describe('ReviewerSettings', () => {
  it('loads current approvers and saves edits', async () => {
    const onClose = vi.fn()
    render(<ReviewerSettings vaultPath="/v" onClose={onClose} />)
    await waitFor(() => screen.getByDisplayValue('lead@org.com'))
    fireEvent.change(screen.getByLabelText(/spec approvers/i), { target: { value: 'lead@org.com, arch@org.com' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(window.signoff.workflows.write).toHaveBeenCalledWith('/v', expect.objectContaining({
      spec: expect.objectContaining({ required_approvers: ['lead@org.com', 'arch@org.com'] }),
    })))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('escapes the loading state and shows an error when workflows.read fails', async () => {
    vi.mocked(window.signoff.workflows.read).mockRejectedValue(new Error('unreadable'))
    render(<ReviewerSettings vaultPath="/v" onClose={() => {}} />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText(/couldn't load reviewer settings/i)).toBeInTheDocument())
  })

  it('clamps min_approvals to at least 1 when saving', async () => {
    const onClose = vi.fn()
    render(<ReviewerSettings vaultPath="/v" onClose={onClose} />)
    await waitFor(() => screen.getByDisplayValue('lead@org.com'))
    const minInputs = screen.getAllByRole('spinbutton')
    // set spec min to 0 (invalid) — should clamp to 1
    fireEvent.change(minInputs[0], { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(window.signoff.workflows.write).toHaveBeenCalledWith('/v', expect.objectContaining({
      spec: expect.objectContaining({ min_approvals: 1 }),
    })))
  })
})
