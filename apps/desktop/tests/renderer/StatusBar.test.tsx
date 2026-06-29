import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { StatusBar } from '@renderer/components/StatusBar'

function renderBar() {
  return render(
    <StatusBar
      vaultPath="/v"
      vaultName="My Vault"
      syncKey={0}
      lastSyncedAt={null}
      syncing={false}
      autoSyncMs={0}
      onSetAutoSync={() => {}}
      onSyncNow={() => {}}
      onOpenSourceControl={() => {}}
      onSwitchVault={() => {}}
      theme="light"
      onSetTheme={() => {}}
    />
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('StatusBar initial data fetch', () => {
  it('renders when all fetches resolve', async () => {
    vi.mocked(window.signoff.vault.getRemote).mockResolvedValue('git@github.com:org/proj.git')
    vi.mocked(window.signoff.vault.status).mockResolvedValue({ tracking: 'origin/main' } as never)
    vi.mocked(window.signoff.vault.author).mockResolvedValue({ name: 'Me', email: 'me@o.c' })
    vi.mocked(window.signoff.vault.syncState).mockResolvedValue({ branch: 'main', hasRemote: true, hasUpstream: true, ahead: 0, behind: 0 })
    renderBar()
    await waitFor(() => expect(screen.getByText('Me')).toBeInTheDocument())
    expect(screen.getByText('My Vault')).toBeInTheDocument()
  })

  it('still renders (does not crash or hang) when the Promise.all fetch rejects', async () => {
    vi.mocked(window.signoff.vault.getRemote).mockRejectedValue(new Error('boom'))
    vi.mocked(window.signoff.vault.status).mockRejectedValue(new Error('boom'))
    vi.mocked(window.signoff.vault.author).mockRejectedValue(new Error('boom'))
    vi.mocked(window.signoff.vault.syncState).mockRejectedValue(new Error('boom'))
    renderBar()
    // Vault name (a prop, not fetched) always renders; the bar does not throw.
    expect(screen.getByText('My Vault')).toBeInTheDocument()
    // Indicators fall back to their empty placeholder rather than crashing.
    await waitFor(() => expect(screen.getAllByText('…').length).toBeGreaterThan(0))
  })
})
