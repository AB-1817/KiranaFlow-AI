'use client'

interface ContributionBarProps {
  feature: string
  value: number
  maxValue?: number
}

export default function ContributionBar({ feature, value, maxValue = 0.4 }: ContributionBarProps) {
  const percentage = Math.abs(value) / maxValue * 100
  const isPositive = value >= 0
  
  const getColor = () => {
    if (value > 0.2) return 'bg-primary-600'
    if (value > 0) return 'bg-primary-500'
    return 'bg-red-500'
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-slate-700">{feature}</span>
        <span className={`text-sm font-bold ${isPositive ? 'text-primary-700' : 'text-red-700'}`}>
          {isPositive ? '+' : ''}{(value * 100).toFixed(1)}%
        </span>
      </div>
      <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full ${getColor()} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}
