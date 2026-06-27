import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReviewerSettings } from '@renderer/components/ReviewerSettings'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(window.chuckle.workflows.read).mockResolvedValue({
    spec: { required_approvers: ['lead@org.com'], min_approvals: 1 },
    plan: { required_approvers: [], min_approvals: 1 },
  })
  vi.mocked(window.chuckle.workflows.write).mockResolvedValue(undefined)
})

describe('ReviewerSettings', () => {
  it('loads current approvers and saves edits', async () => {
    render(<ReviewerSettings vaultPath="/v" onClose={() => {}} />)
    await waitFor(() => screen.getByDisplayValue('lead@org.com'))
    fireEvent.change(screen.getByLabelText(/spec approvers/i), { target: { value: 'lead@org.com, arch@org.com' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(window.chuckle.workflows.write).toHaveBeenCalledWith('/v', expect.objectContaining({
      spec: expect.objectContaining({ required_approvers: ['lead@org.com', 'arch@org.com'] }),
    })))
  })
})
