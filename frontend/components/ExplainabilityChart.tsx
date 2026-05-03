'use client'

import { ShapContribution } from '@/types'

interface ExplainabilityChartProps {
  contributions: ShapContribution[]
  visionFeatures: {
    total_products_detected: number
    overall_shelf_density_index: number
    avg_detections_per_image: number
    image_count: number
  }
}

function ContributionBar({
  feature,
  value,
  maxAbsValue,
}: {
  feature: string
  value: number
  maxAbsValue: number
}) {
  const isPositive = value >= 0
  const barWidth = Math.abs(value) / maxAbsValue
  const pctDisplay = `${value >= 0 ? '+' : ''}${(value * 100).toFixed(1)}%`

  const barColor = value > 0.2
    ? 'bg-primary-600'
    : value > 0
    ? 'bg-primary-400'
    : 'bg-red-400'

  const labelColor = value > 0 ? 'text-primary-700' : 'text-red-600'

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-700 leading-tight truncate pr-2" title={feature}>
          {feature}
        </span>
        <span className={`text-xs font-bold flex-shrink-0 ${labelColor}`}>{pctDisplay}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${barWidth * 100}%` }}
          />
        </div>
        <div className="w-10 flex-shrink-0">
          <div
            className="text-[10px] font-medium text-slate-400 text-right"
            title="Contribution weight"
          >
            {(value * 100).toFixed(0)}pt
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ExplainabilityChart({ contributions, visionFeatures }: ExplainabilityChartProps) {
  const maxAbsValue = Math.max(...contributions.map((c) => Math.abs(c.value)))

  const totalPositive = contributions
    .filter((c) => c.value > 0)
    .reduce((sum, c) => sum + c.value, 0)

  const totalNegative = contributions
    .filter((c) => c.value < 0)
    .reduce((sum, c) => sum + Math.abs(c.value), 0)

  return (
    <div className="premium-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h4 className="panel-title">Revenue Explainability</h4>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Feature Contributions</span>
      </div>
      <p className="text-xs text-slate-500 mb-4 ml-6">Impact of each signal on the revenue estimate</p>

      {/* Contribution bars */}
      <div className="space-y-3 mb-5">
        {contributions
          .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
          .map((c, i) => (
            <ContributionBar key={i} feature={c.feature} value={c.value} maxAbsValue={maxAbsValue} />
          ))}
      </div>

      {/* Summary row */}
      <div className="flex gap-3 pt-3 border-t border-slate-100 mb-5">
        <div className="flex-1 bg-primary-50 border border-primary-200 rounded-lg p-2.5 text-center">
          <p className="text-xs text-primary-700 font-semibold mb-0.5">Positive Lift</p>
          <p className="text-base font-bold text-primary-900">+{(totalPositive * 100).toFixed(1)}%</p>
        </div>
        <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-2.5 text-center">
          <p className="text-xs text-red-700 font-semibold mb-0.5">Penalties</p>
          <p className="text-base font-bold text-red-900">-{(totalNegative * 100).toFixed(1)}%</p>
        </div>
        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
          <p className="text-xs text-slate-600 font-semibold mb-0.5">Net Score</p>
          <p className="text-base font-bold text-slate-900">
            {((totalPositive - totalNegative) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Vision breakdown */}
      <div className="pt-3 border-t border-slate-100">
        <p className="section-label mb-3">Vision Analysis Metrics</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: 'Products Detected', value: visionFeatures.total_products_detected, unit: '' },
            { label: 'Shelf Density', value: (visionFeatures.overall_shelf_density_index * 100).toFixed(1), unit: '%' },
            { label: 'Avg / Image', value: visionFeatures.avg_detections_per_image.toFixed(1), unit: '' },
            { label: 'Images', value: visionFeatures.image_count, unit: '' },
          ].map((item) => (
            <div key={item.label} className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-center">
              <p className="text-lg font-bold text-slate-900">
                {item.value}{item.unit}
              </p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
