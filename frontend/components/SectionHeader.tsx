'use client'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}

export default function SectionHeader({ title, subtitle, action, icon }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center">
        {icon && <div className="text-slate-700 mr-2.5">{icon}</div>}
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
