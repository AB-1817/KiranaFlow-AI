/**
 * Results visualization component using Recharts
 * TODO: Implement cashflow visualization
 * TODO: Add risk score charts
 * TODO: Add transaction timeline
 */

'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ResultsChartProps {
  data: any[]
  title: string
}

export default function ResultsChart({ data, title }: ResultsChartProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
