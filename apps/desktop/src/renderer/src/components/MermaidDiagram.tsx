import React, { useEffect, useId, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'strict',
  fontFamily: 'inherit',
})

interface Props {
  code: string
}

export function MermaidDiagram({ code }: Props): React.ReactElement {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '')
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    mermaid
      .render(`mermaid-${rawId}`, code)
      .then(({ svg }) => {
        if (alive) {
          setSvg(svg)
          setError(null)
        }
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      alive = false
    }
  }, [code, rawId])

  if (error) {
    return (
      <div className="my-5 rounded-lg border border-stop/30 bg-stop-soft px-4 py-3 text-[13px] text-stop">
        Couldn&apos;t render diagram: {error}
      </div>
    )
  }
  if (svg === null) {
    return <div className="my-5 text-[13px] text-ink/40">Rendering diagram…</div>
  }
  return (
    <div
      className="my-6 flex justify-center rounded-xl border border-line bg-white px-4 py-5"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
