'use client'

import { RiskFlag, VisionFeatures } from '@/types'

interface Props {
  fraudFlags: string[]
  locationTier: string
  geoMultiplier: number
  confidenceScore: number
  visionFeatures?: VisionFeatures
  riskFlags?: RiskFlag[]
}

const severityConfig = {
  cleared: { label: 'CLEAR', color: 'text-emerald-400', bg: 'bg-emerald-500/[0.07] border-emerald-500/20', dot: 'bg-emerald-400', glow: 'shadow-emerald-500/10' },
  low:     { label: 'LOW',   color: 'text-sky-400',     bg: 'bg-sky-500/[0.07] border-sky-500/20',         dot: 'bg-sky-400',     glow: 'shadow-sky-500/10'     },
  medium:  { label: 'MED',   color: 'text-amber-400',   bg: 'bg-amber-500/[0.07] border-amber-500/20',     dot: 'bg-amber-400',   glow: 'shadow-amber-500/10'   },
  high:    { label: 'HIGH',  color: 'text-red-400',     bg: 'bg-red-500/[0.07] border-red-500/20',         dot: 'bg-red-400',     glow: 'shadow-red-500/10'     },
}

// Colorized source badges
const sourceBadge: Record<string, string> = {
  vision:   'bg-teal-500/10 border-teal-500/25 text-teal-400',
  geo:      'bg-blue-500/10 border-blue-500/25 text-blue-400',
  document: 'bg-amber-500/10 border-amber-500/25 text-amber-400',
  system:   'bg-slate-500/10 border-slate-500/25 text-slate-400',
  model:    'bg-indigo-500/10 border-indigo-500/25 text-indigo-400',
}

const flagIcons: Record<string, React.ReactNode> = {
  'Address Mismatch': (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    </svg>
  ),
  'Inventory Staging Mismatch': (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  'Vision vs Geo Mismatch': (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  'Entity Conflict': (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  'Confidence Penalty': (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
}

export default function ValidationPanel({
  fraudFlags, locationTier, geoMultiplier, confidenceScore, visionFeatures, riskFlags,
}: Props) {
  const flags = riskFlags ?? []
  const highCount   = flags.filter(f => f.severity === 'high').length
  const activeCount = flags.filter(f => f.severity !== 'cleared').length
  const riskScore   = flags.reduce((s, f) => s + ({ high: 3, medium: 2, low: 1, cleared: 0 }[f.severity] ?? 0), 0)
  const riskMax     = flags.length * 3
  const riskPct     = riskMax > 0 ? (riskScore / riskMax) * 100 : 0

  const overallSeverity = highCount > 0 ? 'high' : riskPct > 40 ? 'medium' : 'cleared'
  const cfg = severityConfig[overallSeverity]

  return (
    <div className="card p-5 sticky top-[105px] space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <h3 className="title">Validation &amp; Risk</h3>
      </div>

      {/* Overall status */}
      <div className={`rounded-xl p-3.5 border ${cfg.bg} flex items-center justify-between shadow-md ${cfg.glow}`}>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Overall Risk</p>
          <p className={`text-lg font-bold ${cfg.color}`}>{overallSeverity.toUpperCase()}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 mb-0.5">{activeCount} active flag{activeCount !== 1 ? 's' : ''}</p>
          <p className={`text-sm font-bold ${cfg.color}`}>{riskScore}/{riskMax}</p>
        </div>
      </div>

      {/* Risk gauge */}
      <div>
        <div className="risk-gauge mb-1.5">
          <div
            className={`risk-gauge-fill ${riskPct > 60 ? 'bg-gradient-to-r from-red-600 to-red-400' : riskPct > 30 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'}`}
            style={{ width: `${riskPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>Low Risk</span><span>High Risk</span>
        </div>
      </div>

      {/* Geo tiles */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06] text-center">
          <p className="label mb-1">Location Tier</p>
          <p className={`text-sm font-bold ${locationTier === 'high' ? 'text-emerald-400' : locationTier === 'medium' ? 'text-amber-400' : 'text-slate-400'}`}>
            {locationTier.toUpperCase()}
          </p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06] text-center">
          <p className="label mb-1">Geo Multiplier</p>
          <p className="text-sm font-bold text-teal-400">{geoMultiplier.toFixed(2)}×</p>
        </div>
      </div>

      {/* Risk flags with colorized source badges */}
      {flags.length > 0 && (
        <div>
          <p className="label mb-2.5">Risk Check Results</p>
          <div className="space-y-1.5">
            {flags.map((flag, i) => {
              const s   = severityConfig[flag.severity] ?? severityConfig.cleared
              const src = sourceBadge[flag.source] ?? sourceBadge['system']
              return (
                <div key={i} className={`p-2.5 rounded-xl border ${s.bg} transition-all`}>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className={`w-3.5 h-3.5 flex-shrink-0 ${s.color}`}>
                      {flagIcons[flag.flag] ?? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <p className={`text-xs font-semibold ${s.color} flex-1 truncate`}>{flag.flag}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${s.bg} ${s.color} flex-shrink-0`}>
                      {s.label}
                    </span>
                  </div>
                  {/* Colorized source badge */}
                  <div className="pl-6">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${src} uppercase tracking-wide`}>
                      {flag.source}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Confidence bar */}
      <div className="border-t border-white/[0.06] pt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="label">Model Confidence</p>
          <span className={`text-sm font-bold ${confidenceScore >= 0.8 ? 'text-emerald-400' : confidenceScore >= 0.6 ? 'text-amber-400' : 'text-red-400'}`}>
            {(confidenceScore * 100).toFixed(1)}%
          </span>
        </div>
        <div className="risk-gauge">
          <div
            className={`risk-gauge-fill ${
              confidenceScore >= 0.8 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
              : confidenceScore >= 0.6 ? 'bg-gradient-to-r from-amber-600 to-amber-400'
              : 'bg-gradient-to-r from-red-600 to-red-400'
            }`}
            style={{ width: `${confidenceScore * 100}%` }}
          />
        </div>
      </div>

      {/* Vision summary */}
      {visionFeatures && (
        <div className="border-t border-white/[0.06] pt-4">
          <p className="label mb-2.5">Evidence Summary</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Images',       value: visionFeatures.images_analyzed ?? visionFeatures.image_count },
              { label: 'Products',     value: visionFeatures.total_product_detections ?? visionFeatures.total_products_detected },
              { label: 'Shelf Density', value: `${((visionFeatures.shelf_density_index ?? visionFeatures.overall_shelf_density_index) * 100).toFixed(0)}%` },
              { label: 'SKU Diversity', value: visionFeatures.sku_diversity_proxy ?? '—' },
            ].map(s => (
              <div key={s.label} className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.05] text-center">
                <p className="text-base font-bold text-slate-200">{s.value}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
