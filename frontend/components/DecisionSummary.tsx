'use client'

interface DecisionSummaryProps {
  recommendation: string
  peerBenchmarkPercentile: number
  locationTier: string
  fraudStatus: string
  reviewRoute: string
  loanBand: string
  confidenceScore: number
  onExport?: () => void
  onSendToReview?: () => void
  onMarkReady?: () => void
}

export default function DecisionSummary({
  recommendation,
  peerBenchmarkPercentile,
  locationTier,
  fraudStatus,
  reviewRoute,
  loanBand,
  confidenceScore,
  onExport,
  onSendToReview,
  onMarkReady,
}: DecisionSummaryProps) {
  const isAutoApproved = reviewRoute.toLowerCase().includes('auto')
  const isFlagged = reviewRoute.toLowerCase().includes('flag')

  const routeBadgeColor = isAutoApproved
    ? 'badge-approved'
    : isFlagged
    ? 'badge-flagged'
    : 'badge-review'

  const fraudBadgeColor = fraudStatus.toLowerCase().includes('no flag') || fraudStatus.toLowerCase().includes('clear')
    ? 'badge-cleared'
    : 'badge-flagged'

  return (
    <div className="premium-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <h4 className="panel-title">Decision Summary</h4>
      </div>

      {/* Recommendation banner */}
      <div className={`rounded-lg px-4 py-3 mb-4 border-l-4 ${
        isAutoApproved
          ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
          : isFlagged
          ? 'bg-red-50 border-red-500 text-red-900'
          : 'bg-amber-50 border-amber-500 text-amber-900'
      }`}>
        <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-0.5">Recommendation</p>
        <p className="text-sm font-bold">{recommendation}</p>
        <p className="text-xs opacity-70 mt-0.5">
          Loan band: <span className="font-bold">{loanBand}</span>
        </p>
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <p className="section-label mb-1">Peer Benchmark</p>
          <p className="text-lg font-bold text-slate-900">{peerBenchmarkPercentile}th %ile</p>
          <p className="text-xs text-slate-500 mt-0.5">vs. similar stores</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <p className="section-label mb-1">Location Tier</p>
          <p className="text-sm font-bold text-slate-900 leading-tight">{locationTier}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <p className="section-label mb-1">Fraud Status</p>
          <span className={`badge ${fraudBadgeColor}`}>{fraudStatus}</span>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <p className="section-label mb-1">Review Route</p>
          <span className={`badge ${routeBadgeColor}`}>{reviewRoute}</span>
        </div>
      </div>

      {/* Confidence mini gauge */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="section-label">Model Confidence</span>
          <span className="font-bold text-slate-700">{(confidenceScore * 100).toFixed(0)}%</span>
        </div>
        <div className="risk-gauge">
          <div
            className="risk-gauge-fill"
            style={{
              width: `${confidenceScore * 100}%`,
              background: confidenceScore >= 0.8
                ? 'linear-gradient(90deg, #0f766e, #14b8a6)'
                : confidenceScore >= 0.6
                ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                : 'linear-gradient(90deg, #dc2626, #ef4444)',
            }}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          id="btn-export-report"
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-lg font-semibold text-xs transition-all shadow-sm hover:shadow"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Report
        </button>
        <button
          id="btn-send-review"
          onClick={onSendToReview}
          className="flex items-center gap-1.5 px-3 py-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-semibold text-xs transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Send to Review
        </button>
        <button
          id="btn-mark-ready"
          onClick={onMarkReady}
          className="flex items-center gap-1.5 px-3 py-2 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-semibold text-xs transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Mark Ready
        </button>
      </div>
    </div>
  )
}
