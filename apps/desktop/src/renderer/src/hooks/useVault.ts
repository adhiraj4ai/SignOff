import { useState, useCallback, useRef } from 'react'
import type { FeatureEntry, DocumentType } from '@shared/ipc-types'

export interface Selection {
  feature: string
  type: DocumentType
}

const sameDoc = (a: Selection, b: Selection): boolean => a.feature === b.feature && a.type === b.type

interface VaultState {
  vaultPath: string
  vaultName: string
  features: FeatureEntry[]
  /** Documents the user has opened, in tab order. */
  openTabs: Selection[]
  /** The currently focused tab. */
  active: Selection | null
}

export interface UseVaultReturn {
  state: VaultState | null
  openVault: (path: string, name: string) => Promise<void>
  closeVault: () => void
  selectDocument: (feature: string, type: DocumentType) => void
  closeTab: (feature: string, type: DocumentType) => void
  refresh: () => Promise<void>
  sync: () => Promise<void>
}

export function useVault(): UseVaultReturn {
  const [state, setState] = useState<VaultState | null>(null)
  const vaultPathRef = useRef<string | null>(null)

  const openVault = useCallback(async (path: string, name: string) => {
    const features = await window.chuckle.features.list(path)
    vaultPathRef.current = path
    setState({ vaultPath: path, vaultName: name, features, openTabs: [], active: null })
  }, [])

  const closeVault = useCallback(() => {
    vaultPathRef.current = null
    setState(null)
  }, [])

  const selectDocument = useCallback((feature: string, type: DocumentType) => {
    const sel: Selection = { feature, type }
    setState((prev) => {
      if (!prev) return prev
      const openTabs = prev.openTabs.some((t) => sameDoc(t, sel))
        ? prev.openTabs
        : [...prev.openTabs, sel]
      return { ...prev, openTabs, active: sel }
    })
  }, [])

  const closeTab = useCallback((feature: string, type: DocumentType) => {
    const sel: Selection = { feature, type }
    setState((prev) => {
      if (!prev) return prev
      const idx = prev.openTabs.findIndex((t) => sameDoc(t, sel))
      if (idx === -1) return prev
      const openTabs = prev.openTabs.filter((t) => !sameDoc(t, sel))
      let active = prev.active
      if (active && sameDoc(active, sel)) {
        // focus the neighbour that takes the closed tab's place
        active = openTabs[idx] ?? openTabs[idx - 1] ?? null
      }
      return { ...prev, openTabs, active }
    })
  }, [])

  const refresh = useCallback(async () => {
    if (!vaultPathRef.current) return
    const features = await window.chuckle.features.list(vaultPathRef.current)
    setState((prev) => (prev ? { ...prev, features } : prev))
  }, [])

  const sync = useCallback(async () => {
    if (!vaultPathRef.current) return
    await window.chuckle.vault.sync(vaultPathRef.current)
    const features = await window.chuckle.features.list(vaultPathRef.current)
    setState((prev) => (prev ? { ...prev, features } : prev))
  }, [])

  return { state, openVault, closeVault, selectDocument, closeTab, refresh, sync }
}
