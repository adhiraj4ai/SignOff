import React, { useEffect, useState } from 'react'
import type { VaultInfo } from '@shared/ipc-types'
import { Logo } from './Logo'

interface Props {
  onVaultSelected: (vaultPath: string, vaultName: string) => void
}

type Modal = 'none' | 'new-vault'

export function VaultSwitcher({ onVaultSelected }: Props): React.ReactElement {
  const [vaults, setVaults] = useState<VaultInfo[] | null>(null)
  const [modal, setModal] = useState<Modal>('none')
  const [newName, setNewName] = useState('')
  const [newOrg, setNewOrg] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    window.chuckle.vault.list().then(setVaults)
  }, [])

  async function handleOpenVault(): Promise<void> {
    setError(null)
    try {
      const dir = await window.chuckle.vault.selectDirectory()
      if (!dir) return
      const vault = await window.chuckle.vault.openExisting(dir)
      onVaultSelected(vault.path, vault.name)
    } catch (e) {
      setError(`Couldn't open that folder: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  async function handleRemove(vaultPath: string): Promise<void> {
    await window.chuckle.vault.remove(vaultPath)
    setVaults((prev) => (prev ? prev.filter((v) => v.path !== vaultPath) : prev))
  }

  async function handleCreateVault(): Promise<void> {
    setError(null)
    const dir = await window.chuckle.vault.selectDirectory()
    if (!dir) return
    setCreating(true)
    try {
      const vault = await window.chuckle.vault.create(dir, newName, newOrg)
      setModal('none')
      onVaultSelected(vault.path, vault.name)
    } catch (e) {
      setError(`Setup failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setCreating(false)
    }
  }

  if (vaults === null) {
    return <div className="min-h-screen grid place-items-center text-sm text-fg/40">Loading…</div>
  }

  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-1">
          <Logo size={38} />
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-fg">Signoff</h1>
        </div>
        <p className="text-fg/50 text-[14px] mb-8 pl-0.5">
          Review and approve specs &amp; plans before the code gets written.
        </p>

        {vaults.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/60 px-5 py-8 text-center mb-5">
            <p className="text-[13.5px] text-fg/55">
              No projects yet. Set Signoff up in a project, or open an existing vault.
            </p>
          </div>
        ) : (
          <div className="mb-5">
            <h2 className="text-[11px] font-semibold text-fg/45 mb-2">Recent projects</h2>
            <ul className="bg-surface border border-border rounded-xl shadow-panel overflow-hidden">
              {vaults.map((v) => (
                <li key={v.path} className="group/row relative border-b border-border last:border-b-0">
                  <button
                    onClick={() => onVaultSelected(v.path, v.name)}
                    className="w-full text-left pl-4 pr-10 py-3 hover:bg-app transition-colors flex items-center gap-3"
                  >
                    <span className="grid place-items-center w-8 h-8 rounded-lg bg-iris-soft text-iris text-[13px] font-semibold shrink-0">
                      {v.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium text-[14px] text-fg truncate">{v.name}</span>
                      <span className="block text-[11.5px] text-fg/40 font-mono truncate">{v.path}</span>
                    </span>
                  </button>
                  <button
                    onClick={() => handleRemove(v.path)}
                    aria-label={`Remove ${v.name} from recent projects`}
                    title="Remove from recent projects"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center rounded-md text-fg/30 hover:text-fg hover:bg-border opacity-0 group-hover/row:opacity-100 focus:opacity-100 transition"
                  >
                    <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2.5">
          <button
            onClick={() => setModal('new-vault')}
            className="flex-1 px-4 py-2.5 rounded-lg bg-iris text-white text-[13px] font-semibold hover:bg-iris-ink active:brightness-95 transition"
          >
            Set up in a project
          </button>
          <button
            onClick={handleOpenVault}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-surface text-fg/80 text-[13px] font-medium hover:bg-app transition"
          >
            Open
          </button>
        </div>
        {error && (
          <p className="mt-3 text-[12.5px] text-stop bg-stop-soft border border-stop/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>

      {modal === 'new-vault' && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-8"
          onClick={() => setModal('none')}
        >
          <div
            className="bg-surface rounded-2xl p-6 w-[22rem] shadow-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold text-[17px] text-fg mb-1">Set up Signoff in a project</h2>
            <p className="text-[12.5px] text-fg/50 mb-5">
              You&apos;ll pick your project folder next. Signoff creates a{' '}
              <span className="font-mono text-fg/70">.signoff/</span> vault inside it (its own git
              repo) and keeps it out of the project&apos;s own git.
            </p>
            <label className="block text-[12px] font-medium text-fg/60 mb-1">Project name</label>
            <input
              className="w-full rounded-lg border border-border px-3 py-2 mb-3.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-iris/30 focus:border-iris/50"
              placeholder="Project name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <label className="block text-[12px] font-medium text-fg/60 mb-1">Organization</label>
            <input
              className="w-full rounded-lg border border-border px-3 py-2 mb-5 text-[13px] focus:outline-none focus:ring-2 focus:ring-iris/30 focus:border-iris/50"
              placeholder="Org"
              value={newOrg}
              onChange={(e) => setNewOrg(e.target.value)}
            />
            {error && (
              <p className="mb-3 text-[12.5px] text-stop bg-stop-soft border border-stop/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setModal('none')}
                disabled={creating}
                className="px-4 py-2 text-[13px] font-medium rounded-lg border border-border text-fg/70 hover:bg-app disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateVault}
                disabled={!newName.trim() || !newOrg.trim() || creating}
                className="px-4 py-2 text-[13px] font-semibold rounded-lg bg-iris text-white hover:bg-iris-ink disabled:opacity-50 transition"
              >
                {creating ? 'Setting up…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
