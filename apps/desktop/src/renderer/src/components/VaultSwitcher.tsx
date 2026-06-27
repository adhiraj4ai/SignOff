import React, { useEffect, useState } from 'react'
import type { VaultInfo } from '@shared/ipc-types'

interface Props {
  onVaultSelected: (vaultPath: string, vaultName: string) => void
}

type Modal = 'none' | 'new-vault'

export function VaultSwitcher({ onVaultSelected }: Props): React.ReactElement {
  const [vaults, setVaults] = useState<VaultInfo[] | null>(null)
  const [modal, setModal] = useState<Modal>('none')
  const [newName, setNewName] = useState('')
  const [newOrg, setNewOrg] = useState('')

  useEffect(() => {
    window.chuckle.vault.list().then(setVaults)
  }, [])

  async function handleOpenVault() {
    const dir = await window.chuckle.vault.selectDirectory()
    if (!dir) return
    const config = await window.chuckle.vault.openExisting(dir)
    onVaultSelected(dir, config.name)
  }

  async function handleCreateVault() {
    const dir = await window.chuckle.vault.selectDirectory()
    if (!dir) return
    await window.chuckle.vault.create(dir, newName, newOrg)
    onVaultSelected(dir, newName)
    setModal('none')
  }

  if (vaults === null) return <div className="p-8 text-gray-500">Loading…</div>

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-2">Chuckle</h1>
      <p className="text-gray-500 mb-8">Document review &amp; approval</p>

      {vaults.length === 0 && (
        <p className="text-gray-400 mb-6">No vaults registered yet.</p>
      )}

      {vaults.length > 0 && (
        <div className="w-full max-w-md mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase mb-2">Vaults</h2>
          <ul className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {vaults.map(v => (
              <li key={v.path}>
                <button
                  onClick={() => onVaultSelected(v.path, v.name)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium">{v.name}</span>
                  <span className="block text-xs text-gray-400">{v.path}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setModal('new-vault')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          New Vault
        </button>
        <button
          onClick={handleOpenVault}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Open Vault
        </button>
      </div>

      {modal === 'new-vault' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
            <h2 className="font-semibold text-lg mb-4">New Vault</h2>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 mb-3 text-sm"
              placeholder="Vault name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4 text-sm"
              placeholder="Org"
              value={newOrg}
              onChange={e => setNewOrg(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setModal('none')}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateVault}
                disabled={!newName.trim() || !newOrg.trim()}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
