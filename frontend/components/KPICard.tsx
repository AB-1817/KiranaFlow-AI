'use client'

interface KPICardProps {
  label: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  status?: 'positive' | 'warning' | 'negative' | 'neutral'
  icon?: React.ReactNode
}

export default function KPICard({ label, value, subtitle, trend, status = 'neutral', icon }: KPICardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'positive':
        return 'border-forest-200 bg-gradient-to-br from-forest-50 to-white'
      case 'warning':
        return 'border-amber-200 bg-gradient-to-br from-amber-50 to-white'
      case 'negative':
        return 'border-red-200 bg-gradient-to-br from-red-50 to-white'
      default:
        return 'border-slate-200 bg-white'
    }
  }

  const getTrendColor = () => {
    if (!trend) return ''
    switch (trend.direction) {
      case 'up':
        return 'text-forest-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-slate-600'
    }
  }

  return (
    <div className={`premium-card p-5 border-2 ${getStatusColor()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            {label}
          </p>
          <p className="text-3xl font-bold text-slate-900 leading-none">{value}</p>
        </div>
        {icon && <div className="text-slate-400 ml-3">{icon}</div>}
      </div>
      
      <div className="flex items-center justify-between">
        {subtitle && (
          <p className="text-xs text-slate-600 font-medium">{subtitle}</p>
        )}
        {trend && (
          <div className={`flex items-center text-xs font-semibold ${getTrendColor()}`}>
            {trend.direction === 'up' && (
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
            {trend.direction === 'down' && (
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </div>
  )
}
