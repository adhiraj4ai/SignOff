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
})
