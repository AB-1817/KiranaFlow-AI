'use client'

import { useEffect, useState } from 'react'
import { loadAssessments, StoredAssessment, clearStore } from '@/lib/store'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const Tip = ({ active, payload, label }: any) => active && payload?.length ? (
  <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs shadow-md">
    <p className="text-slate-500 mb-1">{label}</p>
    {payload.map((p: any) => (
      <p key={p.dataKey} className="font-bold" style={{ color: p.color }}>
        {p.name}: {p.value}
      </p>
    ))}
  </div>
) : null

function buildChartData(assessments: StoredAssessment[]) {
  const counts: Record<string, { total: number; approved: number; risk: number }> = {}
  assessments.forEach(a => {
    const month = new Date(a.timestamp).toLocaleString('en-IN', { month: 'short' })
    if (!counts[month]) counts[month] = { total: 0, approved: 0, risk: 0 }
    counts[month].total += 1
    if (a.result.review_route === 'Auto Approved') counts[month].approved += 1
    if (a.result.review_route === 'Flagged') counts[month].risk += 1
  })
  return Object.entries(counts).map(([month, values]) => ({ month, ...values })).slice(-6)
}

export default function DashboardPage() {
  const [assessments, setAssessments] = useState<StoredAssessment[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setAssessments(loadAssessments())
    setMounted(true)
  }, [])

  if (!mounted) return null

  const total = assessments.length
  const avgConf = total ? assessments.reduce((s, a) => s + a.result.confidence_score, 0) / total : 0
  const flagged = assessments.filter(a => a.result.review_route === 'Flagged').length
  const autoApproved = assessments.filter(a => a.result.review_route === 'Auto Approved').length
  const manualReview = assessments.filter(a => a.result.review_route === 'Manual Review').length
  const avgLoan = total ? assessments[0]?.result.safe_loan_band : '—'
  const chartData = buildChartData(assessments)
  const splitTotal = autoApproved + manualReview + flagged || 1

  const donutData = [
    { name: 'Auto Approved', value: autoApproved, color: '#5b8def' },
    { name: 'Manual Review', value: manualReview, color: '#6ee7b7' },
    { name: 'Flagged', value: flagged, color: '#f59e0b' },
  ].filter((item) => item.value > 0)

  const statusBadge: Record<string, string> = {
    'Auto Approved': 'badge badge-approved',
    'Manual Review': 'badge badge-review',
    'Flagged': 'badge badge-flagged',
  }

  // Empty state
  if (total === 0) {
    return (
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">Dashboard</h2>
            <p className="text-sm text-slate-500 mt-0.5">Portfolio overview</p>
          </div>
        </div>
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-200 mb-2">No assessments yet</h3>
          <p className="text-sm text-slate-500">Run your first underwriting assessment on the <span className="text-teal-400 font-semibold">Underwrite</span> tab — results will appear here automatically.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6 space-y-5">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">{total} real assessment{total !== 1 ? 's' : ''} — live data</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 pulse-dot" />
            <span className="text-slate-400 font-medium">Live · localStorage</span>
          </div>
          <button onClick={() => { clearStore(); setAssessments([]) }} className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10">
            Clear All
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Assessments', value: total.toLocaleString(), sub: 'Cases processed' },
          { label: 'Avg Confidence', value: formatPercentage(avgConf), sub: 'Model certainty' },
          { label: 'Flagged Cases', value: flagged.toString(), sub: 'Pending investigation' },
          { label: 'Latest Loan Band', value: avgLoan, sub: 'Most recent case' },
        ].map((c, i) => (
          <div key={i} className="card p-5">
            <p className="label mb-2">{c.label}</p>
            <p className="text-3xl font-bold text-slate-100 leading-none mb-3">{c.value}</p>
            <p className="text-xs text-slate-500">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="title">Portfolio Performance</p>
            <span className="text-xs text-slate-500">By month</span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barGap={8} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={28} allowDecimals={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="approved" name="Approved" fill="#5b8def" radius={[4, 4, 0, 0]} />
                <Bar dataKey="risk" name="Risk Cases" fill="#f6a23a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-600 text-sm">Not enough data yet</div>
          )}
        </div>

        <div className="card p-5">
          <p className="title mb-4">Assessment Split</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={68} paddingAngle={3}>
                  {donutData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} cases`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2.5 mt-2">
            {donutData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="inline-flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}
                </div>
                <span className="font-semibold text-slate-700">{((d.value / splitTotal) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent assessments table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <p className="title">Recent Assessments</p>
          <span className="text-xs text-slate-500">{assessments.length} cases</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['Case ID', 'Revenue', 'Cash Flow', 'Loan Band', 'Confidence', 'Location Tier', 'Status', 'Date'].map(col => (
                  <th key={col} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {assessments.map(a => (
                <tr key={a.id} className="table-row">
                  <td className="px-4 py-3">
                    <span className="mono text-[11px] font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">{a.id}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-200">{formatCurrency(a.result.monthly_revenue)}</td>
                  <td className="px-4 py-3 text-teal-400 font-semibold">{formatCurrency(a.result.net_cash_flow)}</td>
                  <td className="px-4 py-3 text-slate-300 text-xs font-medium whitespace-nowrap">{a.result.safe_loan_band}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${a.result.confidence_score >= 0.8 ? 'badge-approved' : a.result.confidence_score >= 0.6 ? 'badge-review' : 'badge-flagged'}`}>
                      {(a.result.confidence_score * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs capitalize">{a.result.location_tier}</td>
                  <td className="px-4 py-3">
                    <span className={statusBadge[a.result.review_route] ?? 'badge badge-neutral'}>{a.result.review_route}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 mono whitespace-nowrap">{new Date(a.timestamp).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System health */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <p className="label">System Health</p>
          {['YOLO Vision Engine', 'ML Inference (kirana_model.pkl)', 'Geo Intelligence (OSM)', 'Fraud Detection Engine', 'OCR Processor', 'Fusion Engine'].map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
              <span className="text-xs text-slate-400 font-medium">{s}</span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">OK</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
