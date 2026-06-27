import React, { useEffect, useState } from 'react'
import { VaultSwitcher } from './components/VaultSwitcher'
import { Sidebar } from './components/Sidebar'
import { DocumentPane } from './components/DocumentPane'
import { ReviewHistory } from './components/ReviewHistory'
import { ApproveBar } from './components/ApproveBar'
import { useVault } from './hooks/useVault'
import type { ApprovalRecord, DocumentType } from '@shared/ipc-types'

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

  useEffect(() => {
    setRecord(undefined)
    window.chuckle.document.getApproval(vaultPath, feature, type).then(setRecord)
  }, [vaultPath, feature, type])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <DocumentPane
        vaultPath={vaultPath}
        feature={feature}
        type={type}
        onApprove={onActionComplete}
        onReject={onActionComplete}
      />
      {record !== undefined && record !== null && (
        <ReviewHistory history={record.history} />
      )}
      {record !== undefined && (
        <ApproveBar
          vaultPath={vaultPath}
          feature={feature}
          type={type}
          status={record?.status ?? 'not_found'}
          onActionComplete={onActionComplete}
        />
      )}
    </div>
  )
}

export function App(): React.ReactElement {
  const { state, openVault, selectDocument, refresh, sync } = useVault()

  if (!state) {
    return <VaultSwitcher onVaultSelected={openVault} />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar
        vaultName={state.vaultName}
        features={state.features}
        selected={state.selected}
        onSelect={selectDocument}
        onSync={sync}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {!state.selected ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a document to review
          </div>
        ) : (
          <SelectedDocument
            vaultPath={state.vaultPath}
            feature={state.selected.feature}
            type={state.selected.type}
            onActionComplete={refresh}
          />
        )}
      </div>
    </div>
  )
}
