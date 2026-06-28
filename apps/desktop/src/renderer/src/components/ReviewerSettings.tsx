import React, { useEffect, useState } from 'react'
import type { VaultWorkflows } from '@shared/ipc-types'

interface Props {
  vaultPath: string
  onClose: () => void
}

export function ReviewerSettings({ vaultPath, onClose }: Props): React.ReactElement {
  const [workflows, setWorkflows] = useState<VaultWorkflows | null>(null)
  const [specApprovers, setSpecApprovers] = useState('')
  const [specMin, setSpecMin] = useState(1)
  const [planApprovers, setPlanApprovers] = useState('')
  const [planMin, setPlanMin] = useState(1)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    window.signoff.workflows.read(vaultPath).then((w) => {
      setWorkflows(w)
      setSpecApprovers(w.spec.required_approvers.join(', '))
      setSpecMin(w.spec.min_approvals)
      setPlanApprovers(w.plan.required_approvers.join(', '))
      setPlanMin(w.plan.min_approvals)
    })
  }, [vaultPath])

  async function handleSave(): Promise<void> {
    if (!workflows) return
    setSaving(true)
    const parseEmails = (csv: string): string[] =>
      csv.split(',').map((s) => s.trim()).filter(Boolean)
    const next: VaultWorkflows = {
      spec: { ...workflows.spec, required_approvers: parseEmails(specApprovers), min_approvals: specMin },
      plan: { ...workflows.plan, required_approvers: parseEmails(planApprovers), min_approvals: planMin },
    }
    await window.signoff.workflows.write(vaultPath, next)
    setSaving(false)
    onClose()
  }

  if (!workflows) {
    return (
      <div className="p-5 text-[13px] text-fg/40">Loading…</div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-5 bg-surface border border-border rounded-xl">
      <section className="flex flex-col gap-2">
        <h3 className="text-[11px] font-semibold text-fg/45 tracking-wider">Spec</h3>
        <label className="flex flex-col gap-1">
          <span className="text-[12px] text-fg/60">Spec approvers</span>
          <input
            type="text"
            aria-label="Spec approvers"
            value={specApprovers}
            onChange={(e) => setSpecApprovers(e.target.value)}
            placeholder="email1@org.com, email2@org.com"
            className="rounded-lg border border-border bg-app px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-iris/30 focus:border-iris/50 placeholder:text-fg/30"
          />
          <span className="text-[11px] text-fg/40">Comma-separated emails. Empty = anyone can approve.</span>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[12px] text-fg/60">Min approvals</span>
          <input
            type="number"
            min={1}
            value={specMin}
            onChange={(e) => setSpecMin(Number(e.target.value))}
            className="w-20 rounded-lg border border-border bg-app px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-iris/30"
          />
        </label>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-[11px] font-semibold text-fg/45 tracking-wider">Plan</h3>
        <label className="flex flex-col gap-1">
          <span className="text-[12px] text-fg/60">Plan approvers</span>
          <input
            type="text"
            aria-label="Plan approvers"
            value={planApprovers}
            onChange={(e) => setPlanApprovers(e.target.value)}
            placeholder="email1@org.com, email2@org.com"
            className="rounded-lg border border-border bg-app px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-iris/30 focus:border-iris/50 placeholder:text-fg/30"
          />
          <span className="text-[11px] text-fg/40">Comma-separated emails. Empty = anyone can approve.</span>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[12px] text-fg/60">Min approvals</span>
          <input
            type="number"
            min={1}
            value={planMin}
            onChange={(e) => setPlanMin(Number(e.target.value))}
            className="w-20 rounded-lg border border-border bg-app px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-iris/30"
          />
        </label>
      </section>

      <div className="flex gap-2 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-border text-fg/70 text-[13px] font-medium hover:bg-app transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-iris text-white text-[13px] font-semibold hover:brightness-95 disabled:opacity-50 transition"
        >
          Save
        </button>
      </div>
    </div>
  )
}
