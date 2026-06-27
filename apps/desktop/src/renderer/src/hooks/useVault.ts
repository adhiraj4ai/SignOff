import { useState, useCallback, useRef } from 'react'
import type { FeatureEntry, DocumentType } from '@shared/ipc-types'

interface Selection {
  feature: string
  type: DocumentType
}

interface VaultState {
  vaultPath: string
  vaultName: string
  features: FeatureEntry[]
  selected: Selection | null
}

export interface UseVaultReturn {
  state: VaultState | null
  openVault: (path: string, name: string) => Promise<void>
  closeVault: () => void
  selectDocument: (feature: string, type: DocumentType) => void
  refresh: () => Promise<void>
  sync: () => Promise<void>
}

export function useVault(): UseVaultReturn {
  const [state, setState] = useState<VaultState | null>(null)
  const vaultPathRef = useRef<string | null>(null)

  const openVault = useCallback(async (path: string, name: string) => {
    const features = await window.chuckle.features.list(path)
    vaultPathRef.current = path
    setState({ vaultPath: path, vaultName: name, features, selected: null })
  }, [])

  const closeVault = useCallback(() => {
    vaultPathRef.current = null
    setState(null)
  }, [])

  const selectDocument = useCallback((feature: string, type: DocumentType) => {
    setState(prev => prev ? { ...prev, selected: { feature, type } } : prev)
  }, [])

  const refresh = useCallback(async () => {
    if (!vaultPathRef.current) return
    const features = await window.chuckle.features.list(vaultPathRef.current)
    setState(prev => prev ? { ...prev, features } : prev)
  }, [])

  const sync = useCallback(async () => {
    if (!vaultPathRef.current) return
    await window.chuckle.vault.sync(vaultPathRef.current)
    const features = await window.chuckle.features.list(vaultPathRef.current)
    setState(prev => prev ? { ...prev, features } : prev)
  }, [])

  return { state, openVault, closeVault, selectDocument, refresh, sync }
}
