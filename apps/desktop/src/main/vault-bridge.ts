import fs from 'node:fs/promises'
import path from 'node:path'
import { simpleGit } from 'simple-git'
import {
  VaultManager,
  readApproval,
  writeApproval,
  appendHistory,
  stageAndCommit,
  pushToRemote,
  pullLatest,
  readWorkflows,
  getApprovalStatus,
  type VaultInfo,
  type VaultConfig,
  type VaultWorkflows,
  type ApprovalRecord,
  type DocumentType,
} from '@chuckle/vault-core'
import type { FeatureEntry } from '../shared/ipc-types.js'

async function resolveVaultAuthor(vaultPath: string): Promise<{ name: string; email: string }> {
  const git = simpleGit(vaultPath)
  const [nameRes, emailRes] = await Promise.all([
    git.getConfig('user.name'),
    git.getConfig('user.email'),
  ])
  return { name: nameRes.value ?? 'Unknown', email: emailRes.value ?? 'unknown@local' }
}

export async function listVaults(): Promise<VaultInfo[]> {
  return VaultManager.listVaults()
}

export async function createVault(vaultPath: string, name: string, org: string): Promise<VaultConfig> {
  const manager = await VaultManager.create(vaultPath, name, org)
  await VaultManager.registerVault({
    name: manager.config.name,
    path: vaultPath,
    last_opened: new Date().toISOString(),
  })
  return manager.config
}

export async function openExistingVault(vaultPath: string): Promise<VaultConfig> {
  const manager = await VaultManager.open(vaultPath)
  await VaultManager.registerVault({
    name: manager.config.name,
    path: vaultPath,
    last_opened: new Date().toISOString(),
  })
  return manager.config
}

export async function syncVault(vaultPath: string): Promise<void> {
  await pullLatest(vaultPath)
}

export async function listFeatures(vaultPath: string): Promise<FeatureEntry[]> {
  const featuresDir = path.join(vaultPath, 'features')
  let entries: string[]
  try {
    entries = await fs.readdir(featuresDir)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw err
  }
  const results: FeatureEntry[] = []
  for (const name of entries) {
    const [specStatus, planStatus] = await Promise.all([
      getApprovalStatus(vaultPath, name, 'spec'),
      getApprovalStatus(vaultPath, name, 'plan'),
    ])
    results.push({
      name,
      spec: specStatus.status,
      plan: planStatus.status,
    })
  }
  return results
}

export async function readDocument(vaultPath: string, feature: string, type: DocumentType): Promise<string> {
  const docPath = path.join(vaultPath, 'features', feature, `${type}.md`)
  return fs.readFile(docPath, 'utf-8')
}

export async function getDocumentApproval(
  vaultPath: string,
  feature: string,
  type: DocumentType
): Promise<ApprovalRecord | null> {
  return readApproval(vaultPath, feature, type)
}

/** Overwrite a document in the vault working tree and commit the edit. */
export async function writeDocument(
  vaultPath: string,
  feature: string,
  type: DocumentType,
  content: string
): Promise<void> {
  const rel = path.join('features', feature, `${type}.md`)
  await fs.writeFile(path.join(vaultPath, rel), content)
  const { name, email } = await resolveVaultAuthor(vaultPath)
  await stageAndCommit(vaultPath, [rel], `docs(${feature}): edit ${type}`, email, name)
}

export async function approveDocument(
  vaultPath: string,
  feature: string,
  type: DocumentType,
  message: string | null
): Promise<void> {
  const record = await readApproval(vaultPath, feature, type)
  if (!record) throw new Error(`no approval record for ${feature}/${type}`)
  const { name, email } = await resolveVaultAuthor(vaultPath)
  const updated = appendHistory(record, {
    action: 'approved',
    by: email,
    at: new Date().toISOString(),
    message,
  })
  await writeApproval(vaultPath, updated)
  const approvalFile = path.join('features', feature, `${type}.approval.json`)
  await stageAndCommit(vaultPath, [approvalFile], `review: approve ${feature}/${type}`, email, name)
  try { await pushToRemote(vaultPath) } catch { /* no remote configured — ignore */ }
}

export async function rejectDocument(
  vaultPath: string,
  feature: string,
  type: DocumentType,
  message: string
): Promise<void> {
  const record = await readApproval(vaultPath, feature, type)
  if (!record) throw new Error(`no approval record for ${feature}/${type}`)
  const { name, email } = await resolveVaultAuthor(vaultPath)
  const updated = appendHistory(record, {
    action: 'rejected',
    by: email,
    at: new Date().toISOString(),
    message,
  })
  await writeApproval(vaultPath, updated)
  const approvalFile = path.join('features', feature, `${type}.approval.json`)
  await stageAndCommit(vaultPath, [approvalFile], `review: reject ${feature}/${type}`, email, name)
  try { await pushToRemote(vaultPath) } catch { /* no remote configured — ignore */ }
}

export async function readVaultWorkflows(vaultPath: string): Promise<VaultWorkflows> {
  return readWorkflows(vaultPath)
}

/** The vault's `origin` remote URL, or null if none is configured. */
export async function getVaultRemote(vaultPath: string): Promise<string | null> {
  try {
    const remotes = await simpleGit(vaultPath).getRemotes(true)
    const origin = remotes.find((r) => r.name === 'origin') ?? remotes[0]
    return origin?.refs.fetch || origin?.refs.push || null
  } catch {
    return null
  }
}
