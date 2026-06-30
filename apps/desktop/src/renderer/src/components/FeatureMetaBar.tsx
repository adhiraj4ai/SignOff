import React, { useEffect, useState } from 'react'
import type { Category, FeatureEntry } from '@shared/ipc-types'
import { normalizeTags } from '@shared/ipc-types'
import { CategorySwatch } from './CategorySwatch'

interface Props {
  vaultPath: string
  feature: FeatureEntry
  onChanged: () => void
}

export function FeatureMetaBar({ vaultPath, feature, onChanged }: Props): React.ReactElement {
  const [categories, setCategories] = useState<Category[]>([])
  const [draft, setDraft] = useState('')

  useEffect(() => {
    void window.signoff.categories.list(vaultPath).then(setCategories)
  }, [vaultPath])

  async function pickCategory(id: string): Promise<void> {
    await window.signoff.features.setCategory(vaultPath, feature.name, id || null)
    onChanged()
  }

  async function commitTags(next: string[]): Promise<void> {
    await window.signoff.features.setTags(vaultPath, feature.name, normalizeTags(next))
    onChanged()
  }

  return (
    <div className="flex items-center gap-2 flex-wrap px-4 py-2 border-b border-border text-[12.5px]">
      {feature.category && <CategorySwatch color={feature.category.color} />}
      <select
        value={feature.category?.id ?? ''}
        onChange={(e) => void pickCategory(e.target.value)}
        className="rounded-md bg-fg/[0.05] text-fg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-iris/40"
      >
        <option value="">Uncategorized</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1 flex-wrap">
        {feature.tags.map((t) => (
          <span key={t} className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-fg/[0.06] text-fg/70">
            {t}
            <button
              aria-label={`Remove ${t}`}
              onClick={() => void commitTags(feature.tags.filter((x) => x !== t))}
              className="text-fg/40 hover:text-stop"
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add tag…"
          className="w-24 rounded-md bg-fg/[0.05] text-fg px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-iris/40"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && draft.trim()) {
              void commitTags([...feature.tags, draft.trim()])
              setDraft('')
            }
          }}
        />
      </div>
    </div>
  )
}
