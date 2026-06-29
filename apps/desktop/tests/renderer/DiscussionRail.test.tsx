import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DiscussionRail } from '@renderer/components/DiscussionRail'

const docMd = '# Title\n\n## Goals\n\ntext\n'
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(window.signoff.comments.read).mockResolvedValue({ version: 1, threads: [] })
  vi.mocked(window.signoff.comments.addThread).mockResolvedValue({ version: 1, threads: [{ id: 't1', section: 'goals', line: 3, resolved: false, comments: [{ id: 'c1', by: 'me@o.c', at: 't', body: 'q' }] }] })
})
it('lists sections and adds a comment thread', async () => {
  render(<DiscussionRail vaultPath="/v" feature="f" type="spec" markdown={docMd} />)
  await waitFor(() => screen.getByText('Goals'))
  fireEvent.click(screen.getByRole('button', { name: /comment on goals/i }))
  fireEvent.change(screen.getByPlaceholderText(/comment/i), { target: { value: 'q' } })
  fireEvent.click(screen.getByRole('button', { name: /^post$/i }))
  await waitFor(() => expect(window.signoff.comments.addThread).toHaveBeenCalledWith('/v', 'f', 'spec', 'goals', 3, 'q'))
})

describe('error handling — failures surface without throwing', () => {
  it('shows an error and does not throw when addThread rejects', async () => {
    vi.mocked(window.signoff.comments.addThread).mockRejectedValueOnce(new Error('forbidden: not a member'))
    render(<DiscussionRail vaultPath="/v" feature="f" type="spec" markdown={docMd} />)
    await waitFor(() => screen.getByText('Goals'))
    fireEvent.click(screen.getByRole('button', { name: /comment on goals/i }))
    fireEvent.change(screen.getByPlaceholderText(/comment/i), { target: { value: 'q' } })
    fireEvent.click(screen.getByRole('button', { name: /^post$/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/forbidden: not a member/i))
    // Composer stays open with the text intact so the user can retry.
    expect((screen.getByPlaceholderText(/comment/i) as HTMLTextAreaElement).value).toBe('q')
  })

  it('shows an error and does not throw when addReply rejects', async () => {
    vi.mocked(window.signoff.comments.read).mockResolvedValue({
      version: 1,
      threads: [{ id: 't1', section: 'goals', line: 3, resolved: false, comments: [{ id: 'c1', by: 'me@o.c', at: '2026-06-28T00:00:00Z', body: 'q' }] }],
    })
    vi.mocked(window.signoff.comments.addReply).mockRejectedValueOnce(new Error('reply failed'))
    render(<DiscussionRail vaultPath="/v" feature="f" type="spec" markdown={docMd} />)
    await waitFor(() => screen.getByText('q'))
    fireEvent.click(screen.getByRole('button', { name: /^reply$/i }))
    fireEvent.change(screen.getByPlaceholderText(/write a reply/i), { target: { value: 'r' } })
    fireEvent.click(screen.getByRole('button', { name: /post reply/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/reply failed/i))
  })

  it('shows an error and does not throw when setResolved rejects', async () => {
    vi.mocked(window.signoff.comments.read).mockResolvedValue({
      version: 1,
      threads: [{ id: 't1', section: 'goals', line: 3, resolved: false, comments: [{ id: 'c1', by: 'me@o.c', at: '2026-06-28T00:00:00Z', body: 'q' }] }],
    })
    vi.mocked(window.signoff.comments.setResolved).mockRejectedValueOnce(new Error('resolve failed'))
    render(<DiscussionRail vaultPath="/v" feature="f" type="spec" markdown={docMd} />)
    await waitFor(() => screen.getByText('q'))
    fireEvent.click(screen.getByRole('button', { name: /^resolve$/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/resolve failed/i))
  })
})
