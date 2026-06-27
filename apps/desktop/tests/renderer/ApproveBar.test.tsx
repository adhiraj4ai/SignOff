import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApproveBar } from '@renderer/components/ApproveBar'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(window.chuckle.document.approve).mockResolvedValue(undefined)
  vi.mocked(window.chuckle.document.reject).mockResolvedValue(undefined)
})

describe('ApproveBar', () => {
  it('shows Approve and Request Changes buttons when status is pending', () => {
    render(<ApproveBar vaultPath="/v" feature="f" type="spec" status="pending" onActionComplete={() => {}} />)
    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /request changes/i })).toBeInTheDocument()
  })

  it('hides action buttons when status is approved', () => {
    render(<ApproveBar vaultPath="/v" feature="f" type="spec" status="approved" onActionComplete={() => {}} />)
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
  })

  it('hides action buttons when status is not_found', () => {
    render(<ApproveBar vaultPath="/v" feature="f" type="spec" status="not_found" onActionComplete={() => {}} />)
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
  })

  it('calls approve with null message when Approve clicked', async () => {
    const onDone = vi.fn()
    render(<ApproveBar vaultPath="/v" feature="f" type="spec" status="pending" onActionComplete={onDone} />)
    fireEvent.click(screen.getByRole('button', { name: /approve/i }))
    await waitFor(() => expect(window.chuckle.document.approve).toHaveBeenCalledWith('/v', 'f', 'spec', null))
    expect(onDone).toHaveBeenCalled()
  })

  it('shows message input when Request Changes clicked', async () => {
    render(<ApproveBar vaultPath="/v" feature="f" type="spec" status="pending" onActionComplete={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /request changes/i }))
    expect(screen.getByPlaceholderText(/reason/i)).toBeInTheDocument()
  })

  it('calls reject with message when message submitted', async () => {
    const onDone = vi.fn()
    render(<ApproveBar vaultPath="/v" feature="f" type="spec" status="pending" onActionComplete={onDone} />)
    fireEvent.click(screen.getByRole('button', { name: /request changes/i }))
    await userEvent.type(screen.getByPlaceholderText(/reason/i), 'Missing tests')
    fireEvent.click(screen.getByRole('button', { name: /^submit$/i }))
    await waitFor(() =>
      expect(window.chuckle.document.reject).toHaveBeenCalledWith('/v', 'f', 'spec', 'Missing tests')
    )
    expect(onDone).toHaveBeenCalled()
  })

  it('disables Submit when reject message is empty', async () => {
    render(<ApproveBar vaultPath="/v" feature="f" type="spec" status="pending" onActionComplete={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /request changes/i }))
    expect(screen.getByRole('button', { name: /^submit$/i })).toBeDisabled()
  })

  it('disables approve when the user is not an allowed approver', () => {
    render(<ApproveBar vaultPath="/v" feature="f" type="spec" status="pending"
      canApprove={false} approvers={['lead@org.com']} onActionComplete={() => {}} />)
    expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled()
  })
})
