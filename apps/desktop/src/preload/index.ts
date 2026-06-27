import { contextBridge, ipcRenderer } from 'electron'
import type { ChuckleAPI } from '../shared/ipc-types.js'

const api: ChuckleAPI = {
  vault: {
    list: () => ipcRenderer.invoke('vault:list'),
    create: (path, name, org) => ipcRenderer.invoke('vault:create', { path, name, org }),
    openExisting: (path) => ipcRenderer.invoke('vault:open-existing', { path }),
    selectDirectory: () => ipcRenderer.invoke('vault:select-directory'),
    sync: (vaultPath) => ipcRenderer.invoke('vault:sync', { vaultPath }),
  },
  features: {
    list: (vaultPath) => ipcRenderer.invoke('features:list', { vaultPath }),
  },
  document: {
    read: (vaultPath, feature, type) =>
      ipcRenderer.invoke('document:read', { vaultPath, feature, type }),
    getApproval: (vaultPath, feature, type) =>
      ipcRenderer.invoke('document:get-approval', { vaultPath, feature, type }),
    approve: (vaultPath, feature, type, message) =>
      ipcRenderer.invoke('document:approve', { vaultPath, feature, type, message }),
    reject: (vaultPath, feature, type, message) =>
      ipcRenderer.invoke('document:reject', { vaultPath, feature, type, message }),
  },
  workflows: {
    read: (vaultPath) => ipcRenderer.invoke('workflows:read', { vaultPath }),
  },
}

contextBridge.exposeInMainWorld('chuckle', api)
