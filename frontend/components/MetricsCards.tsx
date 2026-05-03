'use client'

import { formatCurrency, formatPercentage } from '@/lib/utils'

interface MetricsCardsProps {
  monthlyRevenue: number
  netCashFlow: number
  safeLoanBand: string
  confidenceScore: number
}

export default function MetricsCards({
  monthlyRevenue,
  netCashFlow,
  safeLoanBand,
  confidenceScore,
}: MetricsCardsProps) {
  const metrics = [
    {
      label: 'Monthly Revenue',
      value: formatCurrency(monthlyRevenue),
      subtext: 'Estimated turnover',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'bg-gradient-to-br from-primary-50 to-primary-100 text-primary-700 border-primary-200',
    },
    {
      label: 'Net Cash Flow',
      value: formatCurrency(netCashFlow),
      subtext: 'Monthly surplus',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
      color: 'bg-gradient-to-br from-forest-50 to-forest-100 text-forest-700 border-forest-200',
    },
    {
      label: 'Safe Loan Band',
      value: safeLoanBand,
      subtext: 'Recommended limit',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      color: 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 border-amber-200',
    },
    {
      label: 'Confidence Score',
      value: formatPercentage(confidenceScore),
      subtext: 'Model certainty',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      color:
        confidenceScore >= 0.8
          ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200'
          : confidenceScore >= 0.6
          ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-200'
          : 'bg-gradient-to-br from-red-50 to-red-100 text-red-700 border-red-200',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className={`${metric.color} rounded-xl border-2 p-5 shadow-sm hover:shadow-md transition-all`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-75 mb-1">
                {metric.label}
              </p>
              <p className="text-2xl font-bold leading-tight">{metric.value}</p>
            </div>
            <div className="opacity-60 ml-2">{metric.icon}</div>
          </div>
          <p className="text-xs opacity-70 font-medium">{metric.subtext}</p>
        </div>
      ))}
    </div>
  )
}
