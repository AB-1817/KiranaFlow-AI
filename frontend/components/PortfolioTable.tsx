'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'

interface PortfolioCase {
  caseId: string
  storeName: string
  locality: string
  city: string
  revenueEstimate: number
  netCashFlow: number
  loanBand: string
  confidence: number
  riskTier: string
  status: string
  lastUpdated: string
}

interface PortfolioTableProps {
  data: PortfolioCase[]
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 85 ? 'badge-approved' : pct >= 70 ? 'badge-review' : 'badge-flagged'
  return <span className={`badge ${color}`}>{pct}%</span>
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'Auto Approved': 'badge-approved',
    'Manual Review': 'badge-review',
    'Flagged': 'badge-flagged',
  }
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`}>{status}</span>
}

function RiskBadge({ tier }: { tier: string }) {
  const map: Record<string, string> = {
    Low: 'badge-cleared',
    Medium: 'badge-medium',
    High: 'badge-high',
  }
  return <span className={`badge ${map[tier] ?? 'badge-neutral'}`}>{tier}</span>
}

export default function PortfolioTable({ data }: PortfolioTableProps) {
  const [statusFilter, setStatusFilter] = useState('All')
  const [riskFilter, setRiskFilter] = useState('All')
  const [confFilter, setConfFilter] = useState('All')

  const filtered = data.filter((row) => {
    const statusMatch = statusFilter === 'All' || row.status === statusFilter
    const riskMatch = riskFilter === 'All' || row.riskTier === riskFilter
    const confPct = Math.round(row.confidence * 100)
    const confMatch =
      confFilter === 'All' ||
      (confFilter === 'High (85%+)' && confPct >= 85) ||
      (confFilter === 'Medium (70-84%)' && confPct >= 70 && confPct < 85) ||
      (confFilter === 'Low (<70%)' && confPct < 70)
    return statusMatch && riskMatch && confMatch
  })

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5 p-4 bg-white border border-slate-200 rounded-xl">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Filter:</span>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">Status</label>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            id="filter-status"
          >
            <option>All</option>
            <option>Auto Approved</option>
            <option>Manual Review</option>
            <option>Flagged</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">Risk Level</label>
          <select
            className="filter-select"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            id="filter-risk"
          >
            <option>All</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">Confidence</label>
          <select
            className="filter-select"
            value={confFilter}
            onChange={(e) => setConfFilter(e.target.value)}
            id="filter-confidence"
          >
            <option>All</option>
            <option>High (85%+)</option>
            <option>Medium (70-84%)</option>
            <option>Low (&lt;70%)</option>
          </select>
        </div>

        <div className="ml-auto text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{filtered.length}</span> of {data.length} cases
        </div>
      </div>

      {/* Table */}
      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {[
                  'Case ID',
                  'Store / Locality',
                  'City',
                  'Revenue Est.',
                  'Net Cash Flow',
                  'Loan Band',
                  'Confidence',
                  'Risk Tier',
                  'Status',
                  'Last Updated',
                ].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-400 font-medium">
                    No cases match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.caseId} className="table-row-hover">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                        {row.caseId}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 text-sm leading-tight">{row.storeName}</p>
                      <p className="text-xs text-slate-500">{row.locality}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-sm">{row.city}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(row.revenueEstimate)}</td>
                    <td className="px-4 py-3 text-emerald-700 font-semibold">{formatCurrency(row.netCashFlow)}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium text-xs whitespace-nowrap">{row.loanBand}</td>
                    <td className="px-4 py-3">
                      <ConfidenceBadge value={row.confidence} />
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge tier={row.riskTier} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{row.lastUpdated}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
