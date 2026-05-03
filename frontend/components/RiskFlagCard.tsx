'use client'

interface RiskFlagCardProps {
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'cleared'
  icon?: React.ReactNode
}

export default function RiskFlagCard({ title, description, severity, icon }: RiskFlagCardProps) {
  const getSeverityConfig = () => {
    switch (severity) {
      case 'high':
        return {
          badge: 'HIGH',
          badgeColor: 'bg-red-100 text-red-800 border-red-300',
          cardColor: 'bg-red-50 border-red-200',
          iconColor: 'text-red-600',
        }
      case 'medium':
        return {
          badge: 'MEDIUM',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
          cardColor: 'bg-amber-50 border-amber-200',
          iconColor: 'text-amber-600',
        }
      case 'low':
        return {
          badge: 'LOW',
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
          cardColor: 'bg-blue-50 border-blue-200',
          iconColor: 'text-blue-600',
        }
      case 'cleared':
        return {
          badge: 'CLEARED',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          cardColor: 'bg-emerald-50 border-emerald-200',
          iconColor: 'text-emerald-600',
        }
    }
  }

  const config = getSeverityConfig()

  return (
    <div className={`${config.cardColor} border-2 rounded-lg p-3.5 mb-3`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start flex-1">
          {icon && <div className={`${config.iconColor} mr-2.5 mt-0.5 flex-shrink-0`}>{icon}</div>}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 leading-tight mb-1">{title}</h4>
            <p className="text-xs text-slate-700 leading-snug">{description}</p>
          </div>
        </div>
        <span className={`${config.badgeColor} text-[10px] font-bold px-2 py-0.5 rounded border ml-2 flex-shrink-0`}>
          {config.badge}
        </span>
      </div>
    </div>
  )
}
