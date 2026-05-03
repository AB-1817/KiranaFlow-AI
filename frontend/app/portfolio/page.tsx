'use client'

import { useEffect, useState } from 'react'
import { loadAssessments, StoredAssessment } from '@/lib/store'
import { formatCurrency } from '@/lib/utils'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const statusBadge: Record<string, string> = {
  'Auto Approved': 'badge badge-approved',
  'Manual Review': 'badge badge-review',
  'Flagged': 'badge badge-flagged',
}

export default function PortfolioPage() {
  const [assessments, setAssessments] = useState<StoredAssessment[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setAssessments(loadAssessments())
    setMounted(true)
  }, [])

  if (!mounted) return null

  const total = assessments.length
  const totalRevenue = assessments.reduce((s, a) => s + a.result.monthly_revenue, 0)
  const avgConf = total ? assessments.reduce((s, a) => s + a.result.confidence_score, 0) / total : 0
  const autoApproved = assessments.filter(a => a.result.review_route === 'Auto Approved').length
  const flagged = assessments.filter(a => a.result.review_route === 'Flagged').length
  const manualReview = assessments.filter(a => a.result.review_route === 'Manual Review').length

  const statusData = [
    { name: 'Auto Approved', value: autoApproved, color: '#10b981' },
    { name: 'Manual Review', value: manualReview, color: '#f59e0b' },
    { name: 'Flagged', value: flagged, color: '#ef4444' },
  ].filter(item => item.value > 0)

  const decisionBars = statusData.map((item) => ({
    ...item,
    pct: total ? Math.round((item.value / total) * 100) : 0,
  }))

  const tierData = [
    { name: 'Tier 1 Metro', key: 'high', color: '#a855f7' },
    { name: 'Tier 2 City', key: 'medium', color: '#3b82f6' },
    { name: 'Tier 3 Town', key: 'low', color: '#10b981' },
    { name: 'Rural', key: 'unknown', color: '#f43f5e' },
  ].map((item) => ({
    ...item,
    value: assessments.filter(a => (a.result.location_tier || 'unknown').toLowerCase() === item.key).length,
  })).filter((item) => item.value > 0)

  const recentAssessments = [...assessments]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-7)

  const trendData = recentAssessments.map((a) => ({
    date: new Date(a.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    revenue: Math.round(a.result.monthly_revenue / 1000),
    cashFlow: Math.round(a.result.net_cash_flow / 1000),
  }))

  if (total === 0) {
    return (
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Portfolio</h2>
          <p className="text-sm text-slate-500 mt-0.5">All assessed cases — NBFC analyst view</p>
        </div>
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-200 mb-2">No cases in portfolio</h3>
          <p className="text-sm text-slate-500">Complete an underwriting assessment on the <span className="text-teal-400 font-semibold">Underwrite</span> tab — cases will appear here automatically.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6 space-y-5">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Portfolio</h2>
          <p className="text-sm text-slate-500 mt-0.5">{total} real case{total !== 1 ? 's' : ''} — live data</p>
        </div>
        <button className="btn-primary" onClick={() => {
          const rows = assessments.map(a => [
            a.id, a.result.monthly_revenue, a.result.net_cash_flow,
            a.result.safe_loan_band, (a.result.confidence_score * 100).toFixed(0) + '%',
            a.result.location_tier, a.result.review_route,
            new Date(a.timestamp).toLocaleDateString('en-IN'),
          ].join(','))
          const csv = ['Case ID,Revenue,Cash Flow,Loan Band,Confidence,Location Tier,Status,Date', ...rows].join('\n')
          const a = document.createElement('a')
          a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
          a.download = 'kirana_portfolio.csv'
          a.click()
        }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Cases', value: total.toString(), sub: 'In active portfolio' },
          { label: 'Total Revenue Est.', value: formatCurrency(totalRevenue), sub: 'Aggregate monthly' },
          { label: 'Avg Confidence', value: `${Math.round(avgConf * 100)}%`, sub: 'Portfolio mean' },
          { label: 'Auto Approved', value: autoApproved.toString(), sub: `${total ? Math.round((autoApproved / total) * 100) : 0}% of portfolio` },
        ].map((c, i) => (
          <div key={i} className="card p-5">
            <p className="label mb-2">{c.label}</p>
            <p className="text-2xl font-bold text-slate-100">{c.value}</p>
            <p className="text-xs text-slate-500 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Visual overview */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="label mb-2">Decision Mix</p>
          <p className="text-xs text-slate-500 mb-4">Approval vs review distribution</p>
          <div className="h-56 flex flex-col justify-center gap-3">
            {decisionBars.map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">{item.name}</span>
                  <span className="text-slate-500">{item.value} ({item.pct}%)</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <p className="label mb-2">Geographic Distribution</p>
          <p className="text-xs text-slate-500 mb-4">Loan exposure across India tiers</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={95}
                  stroke="none"
                  paddingAngle={4}
                  cornerRadius={6}
                >
                  {tierData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} cases`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {tierData.map((tier) => {
              const pct = total ? Math.round((tier.value / total) * 100) : 0
              return (
                <div key={tier.name} className="flex items-center gap-2 bg-[var(--canvas-soft)] border border-[var(--hairline-strong)] rounded-md px-2 py-1.5 shadow-sm">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: tier.color }} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <span className="text-[11px] font-semibold text-[var(--ink)] whitespace-nowrap">
                    {tier.name} <span className="text-[var(--muted)] font-normal ml-0.5">— {pct}%</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card p-5">
          <p className="label mb-2">Recent Trend (7 Cases)</p>
          <p className="text-xs text-slate-500 mb-4">Revenue vs cash flow (₹K)</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} barGap={8}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(value: number) => `₹${value}K`} />
                <Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]} fill="#5b8def" />
                <Bar dataKey="cashFlow" name="Cash Flow" radius={[6, 6, 0, 0]} fill="#f6a23a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <p className="title">Case Portfolio</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['Case ID', 'Revenue', 'Cash Flow', 'Loan Band', 'Confidence', 'Location Tier', 'Geo Mult.', 'Fraud Status', 'Status', 'Date'].map(col => (
                  <th key={col} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {assessments.map(a => {
                const r = a.result
                const hasFraud = r.fraud_flags.some(f => !f.toLowerCase().includes('no fraud') && !f.toLowerCase().includes('no indicator'))
                return (
                  <tr key={a.id} className="table-row">
                    <td className="px-4 py-3">
                      <span className="mono text-[11px] font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">{a.id}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">{formatCurrency(r.monthly_revenue)}</td>
                    <td className="px-4 py-3 text-teal-400 font-semibold">{formatCurrency(r.net_cash_flow)}</td>
                    <td className="px-4 py-3 text-slate-300 text-xs font-medium whitespace-nowrap">{r.safe_loan_band}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${r.confidence_score >= 0.8 ? 'badge-approved' : r.confidence_score >= 0.6 ? 'badge-review' : 'badge-flagged'}`}>
                        {(r.confidence_score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs capitalize">{r.location_tier}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{r.geo_multiplier.toFixed(2)}×</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${hasFraud ? 'badge-flagged' : 'badge-cleared'}`}>
                        {hasFraud ? 'Flags' : 'Clean'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusBadge[r.review_route] ?? 'badge badge-neutral'}>{r.review_route}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 mono whitespace-nowrap">
                      {new Date(a.timestamp).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
