import type {
  VaultInfo,
  VaultConfig,
  ApprovalRecord,
  ApprovalHistoryEntry,
  VaultWorkflows,
  ApprovalStatus,
  DocumentType,
} from '@chuckle/vault-core'

export type {
  VaultInfo,
  VaultConfig,
  ApprovalRecord,
  ApprovalHistoryEntry,
  VaultWorkflows,
  ApprovalStatus,
  DocumentType,
}

export interface FeatureEntry {
  name: string
  spec: ApprovalStatus | 'not_found'
  plan: ApprovalStatus | 'not_found'
}

export type IpcChannels =
  | 'vault:list' | 'vault:create' | 'vault:open-existing' | 'vault:select-directory' | 'vault:sync'
  | 'features:list'
  | 'document:read' | 'document:get-approval' | 'document:approve' | 'document:reject'
  | 'workflows:read'

export interface ChuckleAPI {
  vault: {
    list(): Promise<VaultInfo[]>
    create(path: string, name: string, org: string): Promise<VaultConfig>
    openExisting(path: string): Promise<VaultConfig>
    selectDirectory(): Promise<string | null>
    sync(vaultPath: string): Promise<void>
  }
  features: {
    list(vaultPath: string): Promise<FeatureEntry[]>
  }
  document: {
    read(vaultPath: string, feature: string, type: DocumentType): Promise<string>
    getApproval(vaultPath: string, feature: string, type: DocumentType): Promise<ApprovalRecord | null>
    approve(vaultPath: string, feature: string, type: DocumentType, message: string | null): Promise<void>
    reject(vaultPath: string, feature: string, type: DocumentType, message: string): Promise<void>
  }
  workflows: {
    read(vaultPath: string): Promise<VaultWorkflows>
  }
}

// Augment Window so renderer TypeScript knows about window.chuckle
declare global {
  interface Window {
    chuckle: ChuckleAPI
  }
}
