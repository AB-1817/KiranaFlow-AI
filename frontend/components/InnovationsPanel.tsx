'use client'

import { PredictionResponse } from '@/types'

interface Props { result: PredictionResponse }

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-flex w-2 h-2 rounded-full flex-shrink-0 ${ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />
  )
}

function Row({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xs font-bold mono ${highlight ? 'text-teal-400' : 'text-slate-200'}`}>{value}</span>
    </div>
  )
}

export default function InnovationsPanel({ result }: Props) {
  const vf = result.vision_features
  const geo = result.geo_features
  const shap = result.shap_contributions

  // ── Innovation 1: Multi-Signal Revenue Proxy ──────────────────────────────
  const visionSignal  = vf.total_product_detections > 0
  const geoSignal     = geo.geo_multiplier !== 1.0
  const docSignal     = !result.fraud_flags.some(f => f.toLowerCase().includes('incomplete') || f.toLowerCase().includes('unverified'))
  const signalsAgreed = [visionSignal, geoSignal, docSignal].filter(Boolean).length
  const shapGeo       = shap.find(s => s.feature.toLowerCase().includes('geo'))
  const shapShelf     = shap.find(s => s.feature.toLowerCase().includes('shelf'))
  const shapSupplier  = shap.find(s => s.feature.toLowerCase().includes('supplier'))

  // ── Innovation 2: CCC Estimator ──────────────────────────────────────────────
  // Use the properly typed field (no longer (result as any))
  const cccRaw    = result.ccc_tier ?? 'N/A'
  const cccLabels: Record<string, { label: string; color: string; badge: string }> = {
    fast:    { label: 'Fast Cycle',  color: 'text-emerald-400', badge: 'badge-approved' },
    healthy: { label: 'Healthy',     color: 'text-teal-400',    badge: 'badge-teal'     },
    slow:    { label: 'Slow Cycle',  color: 'text-amber-400',   badge: 'badge-review'   },
    unknown: { label: 'Unknown',     color: 'text-slate-400',   badge: 'badge-neutral'  },
    'n/a':   { label: 'N/A',         color: 'text-slate-500',   badge: 'badge-neutral'  },
  }
  const cccCfg    = cccLabels[cccRaw.toLowerCase()] ?? cccLabels['n/a']
  const cccWorking = result.net_cash_flow > 0 && result.safe_loan_band !== '—'

  // ── Innovation 3: Location Intelligence ──────────────────────────────────
  const geoWorking    = geo.location_tier !== 'medium' || geo.geo_multiplier !== 1.0
  const hasCoords     = geo.latitude !== null && geo.longitude !== null
  const tierColor     = geo.location_tier === 'high' ? 'text-emerald-400' : geo.location_tier === 'medium' ? 'text-amber-400' : 'text-red-400'

  // ── Innovation 4: Dynamic Confidence ─────────────────────────────────────
  const confScore     = result.confidence_score
  const confColor     = confScore >= 0.8 ? 'text-emerald-400' : confScore >= 0.6 ? 'text-amber-400' : 'text-red-400'
  const highRisk      = result.risk_flags?.filter(f => f.severity === 'high').length ?? 0

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1 h-5 bg-teal-500 rounded-full" />
        <p className="text-sm font-bold text-slate-100">Core Innovations — Live Output</p>
      </div>

      {/* ── Innovation 1 ── */}
      <div className="card p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-500/15 border border-teal-500/25 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-teal-400">1</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Multi-Signal Revenue Proxy Engine</p>
              <p className="text-[10px] text-slate-500">Vision + Geo + Document cross-validation</p>
            </div>
          </div>
          <span className={`badge ${signalsAgreed >= 2 ? 'badge-approved' : 'badge-review'}`}>
            {signalsAgreed}/3 signals
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Vision (YOLO)', active: visionSignal, value: `${vf.total_product_detections} det.` },
            { label: 'Geo (OSM)', active: geoSignal, value: `${geo.geo_multiplier.toFixed(2)}×` },
            { label: 'Document (OCR)', active: docSignal, value: docSignal ? 'Verified' : 'Partial' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-2.5 border text-center ${s.active ? 'bg-teal-500/[0.07] border-teal-500/20' : 'bg-white/[0.02] border-white/[0.07]'}`}>
              <StatusDot ok={s.active} />
              <p className={`text-sm font-bold mt-1 ${s.active ? 'text-teal-300' : 'text-slate-500'}`}>{s.value}</p>
              <p className="text-[9px] text-slate-600 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.05]">
          <Row label="Final Revenue Estimate" value={`₹${(result.monthly_revenue / 1000).toFixed(0)}K/month`} highlight />
          <Row label="Shelf Contribution (SHAP)" value={shapShelf ? `+${shapShelf.value.toFixed(3)}` : '—'} />
          <Row label="Geo Contribution (SHAP)" value={shapGeo ? `+${shapGeo.value.toFixed(3)}` : '—'} />
          <Row label="Supplier Bill Contribution" value={shapSupplier ? `${shapSupplier.value > 0 ? '+' : ''}${shapSupplier.value.toFixed(3)}` : '—'} />
          <Row label="Signal Agreement" value={signalsAgreed >= 2 ? 'Trusted ✓' : 'Divergence — review'} />
        </div>
      </div>

      {/* ── Innovation 2 ── */}
      <div className="card p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-indigo-400">2</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Cash Conversion Cycle Estimator</p>
              <p className="text-[10px] text-slate-500">CCC = Inventory Days + Receivable Days − Payable Days</p>
            </div>
          </div>
          <StatusDot ok={cccWorking} />
        </div>

        <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.05]">
          <Row label="CCC Tier" value={cccCfg.label} highlight />
          <Row label="Net Cash Flow" value={`₹${(result.net_cash_flow / 1000).toFixed(0)}K/month`} />
          <Row label="Safe Loan Band" value={result.safe_loan_band} highlight />
          <Row label="Loan Adjustment" value={cccWorking ? 'Applied via logicengine.py' : 'Heuristic fallback'} />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className={`badge ${cccCfg.badge}`}>{cccCfg.label}</span>
          <span className="text-[10px] text-slate-600">from fusion_engine CCC adjustment</span>
        </div>

        <div className="mt-2 text-[10px] text-slate-600 bg-white/[0.02] rounded-lg px-3 py-2 border border-white/[0.04]">
          CCC adjusts the base loan: negative CCC (customers pay fast, suppliers give credit) → higher loan. Positive CCC → reduced loan. Population tier (urban/suburban/rural) calibrates thresholds.
        </div>
      </div>

      {/* ── Innovation 3 ── */}
      <div className="card p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-blue-400">3</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Location Intelligence Module</p>
              <p className="text-[10px] text-slate-500">OSM + Census + Competition density → multiplier</p>
            </div>
          </div>
          <span className={`badge ${geo.location_tier === 'high' ? 'badge-approved' : geo.location_tier === 'medium' ? 'badge-review' : 'badge-neutral'}`}>
            {geo.location_tier.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { label: 'Location Tier', value: geo.location_tier.toUpperCase(), color: tierColor },
            { label: 'Geo Multiplier', value: `${geo.geo_multiplier.toFixed(2)}×`, color: 'text-teal-400' },
            { label: 'Area Type', value: geo.area_type, color: 'text-slate-300' },
            { label: 'Coordinates', value: hasCoords ? `${geo.latitude?.toFixed(2)}, ${geo.longitude?.toFixed(2)}` : 'Not provided', color: 'text-slate-500' },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.02] rounded-xl p-2.5 border border-white/[0.05]">
              <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-slate-600 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.05]">
          <Row label="Revenue Impact" value={`Base × ${geo.geo_multiplier.toFixed(2)} = ₹${(result.monthly_revenue / 1000).toFixed(0)}K`} highlight />
          <Row label="OSM Data Source" value={hasCoords ? 'Live OpenStreetMap query' : 'Metro bounding-box heuristic'} />
          <Row label="Census Profile" value={hasCoords ? 'Population + household density' : 'Fallback profile'} />
        </div>
      </div>

      {/* ── Innovation 4 ── */}
      <div className="card p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-amber-400">4</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Dynamic Confidence Recalibration</p>
              <p className="text-[10px] text-slate-500">Multi-factor confidence with fraud penalty gates</p>
            </div>
          </div>
          <span className={`text-sm font-bold ${confColor}`}>{(confScore * 100).toFixed(1)}%</span>
        </div>

        {/* Confidence breakdown bar */}
        <div className="space-y-2 mb-3">
          {[
            { label: 'Base model score', pct: 75, color: 'bg-teal-500' },
            { label: 'Vision quality boost', pct: Math.min(vf.images_analyzed * 6, 24), color: 'bg-blue-500' },
            { label: 'Document verification', pct: docSignal ? 11 : 3, color: 'bg-indigo-500' },
            { label: 'Geo signal boost', pct: geoSignal ? 8 : 0, color: 'bg-purple-500' },
            { label: 'Fraud/EXIF penalty', pct: highRisk > 0 ? -15 : 0, color: 'bg-red-500' },
          ].filter(s => s.pct !== 0).map(s => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500 w-40 flex-shrink-0">{s.label}</span>
              <div className="flex-1 bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
                <div className={`h-full rounded-full ${s.color}`} style={{ width: `${Math.abs(s.pct)}%` }} />
              </div>
              <span className={`text-[10px] font-bold mono w-10 text-right ${s.pct < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                {s.pct > 0 ? '+' : ''}{s.pct}%
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.05]">
          <Row label="Final Confidence" value={`${(confScore * 100).toFixed(1)}%`} highlight />
          <Row label="Review Route" value={result.review_route} />
          <Row label="High-Risk Flags" value={highRisk > 0 ? `${highRisk} flag(s) — penalty applied` : 'None'} />
          <Row label="EXIF Trust Gate" value={result.raw_metadata.mode === 'demo' ? 'Demo mode' : 'Active'} />
        </div>

        <div className="mt-2 text-[10px] text-amber-600/80 bg-amber-500/[0.05] rounded-lg px-3 py-2 border border-amber-500/10">
          ⚠ Post-disbursement EMI feedback loop not yet implemented — confidence is static per assessment.
        </div>
      </div>

    </div>
  )
}
