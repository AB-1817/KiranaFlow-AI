'use client'

import { useState } from 'react'
import { PredictionResponse } from '@/types'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import InnovationsPanel from './InnovationsPanel'
import { downloadReport } from '@/lib/api'

interface Props { result: PredictionResponse }

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n}`
}

function ConfidenceRing({ score }: { score: number }) {
  const r = 32, circ = 2 * Math.PI * r
  const offset = circ - score * circ
  const color = score >= 0.8 ? '#10b981' : score >= 0.6 ? '#f59e0b' : '#ef4444'
  const glow  = score >= 0.8 ? 'drop-shadow(0 0 6px rgba(16,185,129,0.5))' : score >= 0.6 ? 'drop-shadow(0 0 6px rgba(245,158,11,0.5))' : 'drop-shadow(0 0 6px rgba(239,68,68,0.5))'
  return (
    <svg width="80" height="80" className="progress-ring flex-shrink-0" style={{ filter: glow }}>
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
      <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      <text x="40" y="45" textAnchor="middle" fill={color} fontSize="14" fontWeight="800" fontFamily="sans-serif">
        {Math.round(score * 100)}%
      </text>
    </svg>
  )
}

const routeConfig: Record<string, { color: string; bg: string; border: string; icon: string; glow: string }> = {
  'Auto Approved': {
    color: 'text-emerald-400', bg: 'bg-emerald-500/[0.08]', border: 'border-emerald-500/30',
    icon: '✓', glow: 'shadow-emerald-500/10',
  },
  'Manual Review': {
    color: 'text-amber-400', bg: 'bg-amber-500/[0.08]', border: 'border-amber-500/30',
    icon: '⚠', glow: 'shadow-amber-500/10',
  },
  'Flagged': {
    color: 'text-red-400', bg: 'bg-red-500/[0.08]', border: 'border-red-500/30',
    icon: '✕', glow: 'shadow-red-500/10',
  },
}

const fraudStatusConfig: Record<string, { color: string; bg: string; border: string }> = {
  'No Flags Detected':                    { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' },
  'No Critical Flags':                    { color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/25'     },
  'Review Recommended':                   { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25'   },
  'Flags Detected — Investigation Required': { color: 'text-red-400', bg: 'bg-red-500/10',     border: 'border-red-500/25'     },
}

const cccLabels: Record<string, { label: string; color: string; bg: string }> = {
  fast:    { label: 'Fast Cycle',   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25' },
  healthy: { label: 'Healthy',      color: 'text-teal-400',    bg: 'bg-teal-500/10 border-teal-500/25'       },
  slow:    { label: 'Slow Cycle',   color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/25'     },
  unknown: { label: 'Unknown',      color: 'text-slate-400',   bg: 'bg-slate-500/10 border-slate-500/25'     },
  'N/A':   { label: 'N/A',          color: 'text-slate-500',   bg: 'bg-slate-500/10 border-slate-500/20'     },
}

const TABS = ['Results', 'Innovations', 'Raw JSON'] as const
type Tab = typeof TABS[number]

// Custom recharts tooltip
function ShapTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const pos = d.value >= 0
  return (
    <div className="bg-[#111827] border border-white/10 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-slate-400 mb-1">{d.feature}</p>
      <p className={`font-bold mono ${pos ? 'text-teal-400' : 'text-red-400'}`}>
        {pos ? '+' : ''}{d.value.toFixed(4)}
      </p>
    </div>
  )
}

export default function ResultsPanel({ result }: Props) {
  const [tab, setTab] = useState<Tab>('Results')
  const [copied, setCopied] = useState(false)

  const route     = routeConfig[result.review_route] ?? routeConfig['Manual Review']
  const fraudCfg  = fraudStatusConfig[result.fraud_status] ?? fraudStatusConfig['Review Recommended']
  const cccKey    = result.ccc_tier?.toLowerCase() ?? 'n/a'
  const cccCfg    = cccLabels[cccKey] ?? cccLabels['N/A']
  const vf        = result.vision_features
  const shapMax   = Math.max(...result.shap_contributions.map(s => Math.abs(s.value)), 0.01)

  const cleanFlags     = result.fraud_flags.filter(f => f.toLowerCase().includes('no fraud') || f.toLowerCase().includes('no indicator'))
  const activeFlags    = result.fraud_flags.filter(f => !f.toLowerCase().includes('no fraud') && !f.toLowerCase().includes('no indicator'))

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const [isDownloading, setIsDownloading] = useState(false)
  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true)
      await downloadReport(result)
    } catch (e) {
      console.error(e)
      alert("Failed to generate PDF")
    } finally {
      setIsDownloading(false)
    }
  }

  // Radar data from SHAP contributions
  const radarData = result.shap_contributions.map(s => ({
    subject: s.feature.split(' ')[0],
    value: Math.max(0, s.value) * 100,
    fullMark: shapMax * 100,
  }))

  return (
    <div className="space-y-4">

      {/* ── Tab bar ── */}
      <div className="card p-1 flex gap-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === t
                ? 'bg-teal-500/15 text-teal-400 border border-teal-500/25'
                : 'text-slate-500 hover:text-slate-300'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Innovations' && <InnovationsPanel result={result} />}

      {tab === 'Raw JSON' && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="label">Full API Response</p>
            <button
              onClick={copyJson}
              className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 transition-all"
            >
              {copied ? (
                <><svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg><span className="text-emerald-400">Copied!</span></>
              ) : (
                <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>Copy JSON</>
              )}
            </button>
          </div>
          <pre className="text-[10px] text-slate-400 mono overflow-auto max-h-[600px] leading-relaxed bg-black/20 rounded-xl p-4 border border-white/[0.04]">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {tab === 'Results' && <>

      {/* ── Decision Banner ── */}
      <div className={`card p-5 border ${route.border} ${route.bg} shadow-lg ${route.glow}`}>
        <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <ConfidenceRing score={result.confidence_score} />
            <div>
              <p className="label mb-1">Assessment Decision</p>
              <p className={`text-2xl font-bold ${route.color} leading-tight`}>{result.review_route}</p>
              {/* fraud_status as badge */}
              <span className={`inline-flex items-center gap-1.5 mt-1.5 text-[10px] font-bold px-2 py-1 rounded-lg border ${fraudCfg.bg} ${fraudCfg.border} ${fraudCfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  result.fraud_status.includes('No Flags') ? 'bg-emerald-400' :
                  result.fraud_status.includes('No Critical') ? 'bg-sky-400' :
                  result.fraud_status.includes('Review') ? 'bg-amber-400' : 'bg-red-400'
                }`} />
                {result.fraud_status}
              </span>
              <div className="mt-3">
                <button 
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-[11px] font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {isDownloading ? 'Generating...' : 'Download Formal PDF Report'}
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full 2xl:w-auto 2xl:flex-1 min-w-0">
            {[
              { label: 'Monthly Revenue', value: `${fmt(result.monthly_revenue_range[0])} - ${fmt(result.monthly_revenue_range[1])}`, color: 'text-teal-400', sub: 'Estimated Range' },
              { label: 'Net Income',      value: `${fmt(result.monthly_income_range[0])} - ${fmt(result.monthly_income_range[1])}`,   color: 'text-emerald-400', sub: 'Cash Flow Range' },
              { label: 'Daily Sales',     value: `${fmt(result.daily_sales_range[0])} - ${fmt(result.daily_sales_range[1])}`, color: 'text-amber-400', sub: 'Estimated Range' },
              { label: 'Safe Loan Band',  value: result.safe_loan_band,       color: 'text-indigo-400', sub: 'Recommended' },
            ].map(m => (
              <div key={m.label} className="text-center bg-white/[0.04] rounded-xl p-3 border border-white/[0.07] overflow-hidden flex flex-col justify-center">
                <p className={`font-bold ${m.color} leading-tight tracking-tight break-words ${m.value.length > 9 && !m.value.includes(' ') ? 'text-sm sm:text-base' : 'text-base sm:text-lg'}`}>{m.value}</p>
                <p className="text-[9px] text-slate-600 font-medium mt-0.5 truncate">{m.sub}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-1 truncate">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Vision Intelligence ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="label">Vision Intelligence — YOLO Analysis</p>
          {vf.demo_mode && (
            <span className="badge badge-demo text-[9px]">Demo Mode</span>
          )}
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-4">
          {[
            { label: 'Products Detected', value: vf.total_product_detections.toLocaleString(), color: 'text-teal-300' },
            { label: 'Shelf Density',      value: `${(vf.shelf_density_index * 100).toFixed(1)}%`, color: 'text-indigo-300' },
            { label: 'Refill Signal',      value: vf.refill_signal_proxy, color: vf.refill_signal_proxy?.includes('High') ? 'text-red-400' : 'text-emerald-300' },
            { label: 'Inventory Proxy',    value: fmt(vf.inventory_value_proxy), color: 'text-emerald-300' },
            { label: 'SKU Diversity',      value: vf.sku_diversity_proxy.toString(), color: 'text-amber-300' },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06] text-center group hover:border-white/10 transition-colors">
              <p className={`text-xl font-bold ${s.color} leading-none`}>{s.value}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Per-image breakdown with dimensions */}
        {vf.per_image && vf.per_image.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Per-Image Breakdown</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="text-left pb-2 pr-3">#</th>
                    <th className="text-left pb-2 pr-3">File</th>
                    <th className="text-right pb-2 pr-3">Detections</th>
                    <th className="text-right pb-2 pr-3">Density</th>
                    <th className="text-right pb-2 pr-3">Confidence</th>
                    <th className="text-right pb-2">Dimensions</th>
                  </tr>
                </thead>
                <tbody>
                  {vf.per_image.map((img, i) => (
                    <tr key={i} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="py-2 pr-3 text-slate-600 font-mono">{i + 1}</td>
                      <td className="py-2 pr-3 text-slate-400 truncate max-w-[120px]">
                        {img.file.split(/[/\\]/).pop()}
                      </td>
                      <td className="py-2 pr-3 text-right text-teal-400 font-semibold">{img.detections}</td>
                      <td className="py-2 pr-3 text-right text-slate-300">
                        {(img.shelf_density * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 pr-3 text-right text-slate-400">
                        {(img.confidence_mean * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 text-right text-slate-600 font-mono text-[10px]">
                        {img.image_width}×{img.image_height}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Geo Intelligence ── */}
      <div className="card p-5">
        <p className="label mb-4">Geo Intelligence</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            {
              label: 'Location Tier',
              value: result.geo_features.location_tier.toUpperCase(),
              color: result.geo_features.location_tier === 'high'   ? 'text-emerald-400'
                   : result.geo_features.location_tier === 'medium' ? 'text-amber-400' : 'text-slate-400',
            },
            { label: 'Geo Multiplier', value: `${result.geo_features.geo_multiplier.toFixed(2)}×`, color: 'text-teal-400' },
            { label: 'Area Type', value: result.geo_features.area_type, color: 'text-slate-300' },
            { label: 'Nearby Competitors', value: result.geo_features.competition_density?.toString() || '0', color: 'text-amber-400' },
            {
              label: 'Coordinates',
              value: result.geo_features.latitude
                ? `${result.geo_features.latitude.toFixed(4)}, ${result.geo_features.longitude?.toFixed(4)}`
                : 'Not provided',
              color: 'text-slate-400',
            },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06] text-center">
              <p className={`text-base font-bold ${s.color} leading-tight`}>{s.value}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── SHAP Explainability ── */}
      <div className="card p-5">
        <p className="label mb-4">Model Explainability — Feature Contributions</p>

        {/* Horizontal bars */}
        <div className="space-y-3 mb-5">
          {result.shap_contributions.map((s, i) => {
            const pct     = Math.abs(s.value) / shapMax * 100
            const positive = s.value >= 0
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-44 flex-shrink-0 truncate">{s.feature}</span>
                <div className="flex-1 contrib-track">
                  <div
                    className={`contrib-fill ${positive ? 'bg-gradient-to-r from-teal-600 to-teal-400' : 'bg-gradient-to-r from-red-600 to-red-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={`text-xs font-bold mono w-16 text-right ${positive ? 'text-teal-400' : 'text-red-400'}`}>
                  {positive ? '+' : ''}{s.value.toFixed(4)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Two-column: bar chart + radar chart */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Bar chart */}
          <div className="h-56">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-2">Contribution Bars</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.shap_contributions} margin={{ top: 4, right: 4, bottom: 24, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="feature"
                  tick={{ fontSize: 8, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => v.split(' ')[0]}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ShapTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {result.shap_contributions.map((s, i) => (
                    <Cell key={i} fill={s.value >= 0 ? '#0d9488' : '#ef4444'} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar chart */}
          <div className="h-56">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-2">Signal Radar</p>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#64748b' }} />
                <PolarRadiusAxis tick={{ fontSize: 8, fill: '#475569' }} />
                <Radar
                  name="SHAP"
                  dataKey="value"
                  stroke="#14b8a6"
                  fill="#14b8a6"
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Fraud Detection Results ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="label">Fraud Detection Results</p>
          <div className="flex items-center gap-2">
            {activeFlags.length > 0 && (
              <span className="badge badge-high">{activeFlags.length} flag{activeFlags.length > 1 ? 's' : ''}</span>
            )}
            {cleanFlags.length > 0 && (
              <span className="badge badge-cleared">Clean</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {result.fraud_flags.map((flag, i) => {
            const isClean = flag.toLowerCase().includes('no fraud') || flag.toLowerCase().includes('no indicator')
            return (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${
                isClean
                  ? 'bg-emerald-500/[0.06] border-emerald-500/20'
                  : 'bg-red-500/[0.06] border-red-500/20'
              }`}>
                <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isClean ? 'text-emerald-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isClean
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  }
                </svg>
                <span className={isClean ? 'text-emerald-300' : 'text-red-300'}>{flag}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Pipeline Metadata ── */}
      <div className="card p-5">
        <p className="label mb-3">Pipeline Metadata</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            {
              label: 'Inference Mode',
              value: result.raw_metadata.mode.toUpperCase(),
              badge: result.raw_metadata.mode === 'demo' ? 'badge-demo' : 'badge-teal',
            },
            {
              label: 'Images Processed',
              value: `${result.raw_metadata.processed_images} images`,
              badge: null,
            },
            {
              label: 'Confidence',
              value: `${(result.confidence_score * 100).toFixed(1)}%`,
              badge: null,
            },
            {
              label: 'YOLO Model',
              value: result.raw_metadata.yolo_model.split(/[/\\]/).pop() || result.raw_metadata.yolo_model,
              title: result.raw_metadata.yolo_model,
              badge: null,
            },
            {
              label: 'GPS (metadata)',
              value: result.raw_metadata.lat != null
                ? `${result.raw_metadata.lat.toFixed(4)}, ${result.raw_metadata.lon?.toFixed(4)}`
                : 'Not provided',
              badge: null,
            },
            {
              label: 'CCC Tier',
              value: cccCfg.label,
              badge: null,
              color: cccCfg.color,
            },
          ].map(m => (
            <div key={m.label} className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.05]" title={(m as any).title}>
              <p className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">{m.label}</p>
              {m.badge ? (
                <span className={`badge ${m.badge} mt-1`}>{m.value}</span>
              ) : (
                <p className={`text-xs font-bold mt-0.5 mono truncate ${(m as any).color ?? 'text-slate-300'}`}>{m.value}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      </>}
    </div>
  )
}
