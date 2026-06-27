import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Sidebar } from '@renderer/components/Sidebar'
import type { FeatureEntry } from '@shared/ipc-types'

const features: FeatureEntry[] = [
  { name: 'user-auth', spec: 'pending', plan: 'approved' },
  { name: 'payment-gw', spec: 'rejected', plan: 'not_found' },
]

describe('Sidebar', () => {
  it('renders vault name', () => {
    render(<Sidebar vaultName="project-alpha" features={[]} selected={null} onSelect={() => {}} onSync={() => {}} />)
    expect(screen.getByText('project-alpha')).toBeInTheDocument()
  })

  it('renders feature names and document entries', () => {
    render(<Sidebar vaultName="vault" features={features} selected={null} onSelect={() => {}} onSync={() => {}} />)
    expect(screen.getByText('user-auth')).toBeInTheDocument()
    expect(screen.getByText('payment-gw')).toBeInTheDocument()
  })

  it('shows pending icon ⏳ for pending status', () => {
    render(<Sidebar vaultName="vault" features={[{ name: 'f', spec: 'pending', plan: 'not_found' }]} selected={null} onSelect={() => {}} onSync={() => {}} />)
    expect(screen.getByText('⏳')).toBeInTheDocument()
  })

  it('shows approved icon ✅ for approved status', () => {
    render(<Sidebar vaultName="vault" features={[{ name: 'f', spec: 'approved', plan: 'not_found' }]} selected={null} onSelect={() => {}} onSync={() => {}} />)
    expect(screen.getByText('✅')).toBeInTheDocument()
  })

  it('shows rejected icon ❌ for rejected status', () => {
    render(<Sidebar vaultName="vault" features={[{ name: 'f', spec: 'rejected', plan: 'not_found' }]} selected={null} onSelect={() => {}} onSync={() => {}} />)
    expect(screen.getByText('❌')).toBeInTheDocument()
  })

  it('does not render plan entry when plan is not_found', () => {
    render(<Sidebar vaultName="vault" features={[{ name: 'f', spec: 'pending', plan: 'not_found' }]} selected={null} onSelect={() => {}} onSync={() => {}} />)
    // only one doc button — the spec
    const buttons = screen.getAllByRole('button', { name: /spec|plan/ })
    expect(buttons).toHaveLength(1)
  })

  it('calls onSelect with feature and type when doc clicked', () => {
    const onSelect = vi.fn()
    render(<Sidebar vaultName="vault" features={features} selected={null} onSelect={onSelect} onSync={() => {}} />)
    fireEvent.click(screen.getAllByText(/spec/i)[0])
    expect(onSelect).toHaveBeenCalledWith('user-auth', 'spec')
  })

  it('calls onSync when Sync clicked', () => {
    const onSync = vi.fn()
    render(<Sidebar vaultName="vault" features={[]} selected={null} onSelect={() => {}} onSync={onSync} />)
    fireEvent.click(screen.getByText('Sync'))
    expect(onSync).toHaveBeenCalled()
  })
})
