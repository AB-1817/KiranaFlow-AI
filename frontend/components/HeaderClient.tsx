'use client'

import SystemHealthPanel from '@/components/SystemHealthPanel'
import ThemeToggle from '@/components/ThemeToggle'

export default function HeaderClient() {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden md:block">
        <SystemHealthPanel />
      </div>
      <div className="text-xs font-mono hidden lg:block" style={{ color: 'var(--muted-soft)' }}>v2.0</div>
      <ThemeToggle />
    </div>
  )
}
