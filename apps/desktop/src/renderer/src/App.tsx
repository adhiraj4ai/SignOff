import React, { useEffect, useState } from 'react'
import { VaultSwitcher } from './components/VaultSwitcher'
import { Sidebar } from './components/Sidebar'
import { DocumentPane } from './components/DocumentPane'
import { ReviewPanel } from './components/ReviewPanel'
import { StatusBar } from './components/StatusBar'
import { TabBar } from './components/TabBar'
import { GitPanel } from './components/GitPanel'
import { useVault } from './hooks/useVault'
import type { ApprovalRecord, DocumentType, WorkflowConfig } from '@shared/ipc-types'

function SelectedDocument({
  vaultPath,
  feature,
  type,
  onActionComplete,
}: {
  vaultPath: string
  feature: string
  type: DocumentType
  onActionComplete: () => void
}): React.ReactElement {
  const [record, setRecord] = useState<ApprovalRecord | null | undefined>(undefined)
  const [workflow, setWorkflow] = useState<WorkflowConfig | undefined>(undefined)

  useEffect(() => {
    setRecord(undefined)
    Promise.all([
      window.chuckle.document.getApproval(vaultPath, feature, type),
      window.chuckle.workflows.read(vaultPath),
    ])
      .then(([r, w]) => {
        setRecord(r)
        setWorkflow(w?.[type])
      })
      .catch(() => {
        setRecord(null)
        setWorkflow(undefined)
      })
  }, [vaultPath, feature, type])

  return (
    <div className="flex-1 flex overflow-hidden">
      <DocumentPane
        vaultPath={vaultPath}
        feature={feature}
        type={type}
        onApprove={onActionComplete}
        onReject={onActionComplete}
      />
      <ReviewPanel
        vaultPath={vaultPath}
        feature={feature}
        type={type}
        record={record}
        workflow={workflow}
        onActionComplete={onActionComplete}
      />
    </div>
  )
}

export function App(): React.ReactElement {
  const { state, openVault, closeVault, selectDocument, closeTab, refresh, sync } = useVault()
  const [showGit, setShowGit] = useState(false)

  if (!state) {
    return <VaultSwitcher onVaultSelected={openVault} />
  }

  const active = state.active

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-mist text-ink">
      <div className="flex flex-1 min-h-0">
        <Sidebar
          vaultName={state.vaultName}
          features={state.features}
          selected={active}
          onSelect={selectDocument}
          onSync={sync}
          onSwitchVault={closeVault}
        />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <TabBar
            tabs={state.openTabs}
            active={active}
            onSelect={selectDocument}
            onClose={closeTab}
          />
          {!active ? (
            <div className="flex-1 grid place-items-center px-8">
              <div className="text-center max-w-sm">
                <div className="mx-auto w-11 h-11 grid place-items-center rounded-xl bg-white border border-line shadow-panel text-xl">
                  📄
                </div>
                <h2 className="mt-4 text-[15px] font-semibold text-ink">Pick a document to review</h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink/50">
                  Choose a spec or plan from the sidebar to read it and approve or request changes.
                </p>
              </div>
            </div>
          ) : (
            <SelectedDocument
              key={`${active.feature}/${active.type}`}
              vaultPath={state.vaultPath}
              feature={active.feature}
              type={active.type}
              onActionComplete={refresh}
            />
          )}
        </div>
      </div>
      <StatusBar
        vaultPath={state.vaultPath}
        vaultName={state.vaultName}
        onOpenSourceControl={() => setShowGit(true)}
      />
      {showGit && <GitPanel vaultPath={state.vaultPath} onClose={() => setShowGit(false)} />}
    </div>
  )
}
