'use client'

interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'small'
}

export default function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  const getStatusConfig = () => {
    const normalized = status.toLowerCase()
    
    if (normalized.includes('approved') || normalized.includes('cleared') || normalized.includes('completed')) {
      return {
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dot: 'bg-emerald-500',
      }
    }
    if (normalized.includes('review') || normalized.includes('pending')) {
      return {
        color: 'bg-amber-100 text-amber-800 border-amber-300',
        dot: 'bg-amber-500',
      }
    }
    if (normalized.includes('flagged') || normalized.includes('rejected') || normalized.includes('high risk')) {
      return {
        color: 'bg-red-100 text-red-800 border-red-300',
        dot: 'bg-red-500',
      }
    }
    if (normalized.includes('processing') || normalized.includes('analyzing')) {
      return {
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        dot: 'bg-blue-500',
      }
    }
    return {
      color: 'bg-slate-100 text-slate-800 border-slate-300',
      dot: 'bg-slate-500',
    }
  }

  const config = getStatusConfig()
  const sizeClasses = variant === 'small' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'

  return (
    <span className={`${config.color} ${sizeClasses} font-bold rounded-full border inline-flex items-center`}>
      <span className={`${config.dot} w-1.5 h-1.5 rounded-full mr-1.5`} />
      {status}
    </span>
  )
}
