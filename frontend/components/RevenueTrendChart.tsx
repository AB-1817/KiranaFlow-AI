'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface RevenueTrendChartProps {
  data: { month: string; revenue: number }[]
  title?: string
}

function formatRevenue(value: number) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`
  return `₹${value}`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2">
        <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-primary-700">{formatRevenue(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export default function RevenueTrendChart({ data, title = '6-Month Revenue Trend' }: RevenueTrendChartProps) {
  const minVal = Math.min(...data.map((d) => d.revenue)) * 0.93
  const maxVal = Math.max(...data.map((d) => d.revenue)) * 1.05

  return (
    <div className="premium-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <h4 className="panel-title">{title}</h4>
        </div>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
          +11.8% MoM
        </span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0f766e" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#0f766e" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
          />
          <YAxis
            domain={[minVal, maxVal]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickFormatter={formatRevenue}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#0f766e"
            strokeWidth={2}
            fill="url(#revenueGradient)"
            dot={{ fill: '#0f766e', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#0f766e', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
