'use client'

import { useState } from 'react'
import { PredictionResponse } from '@/types'

interface JsonViewerProps {
  data: PredictionResponse
}

export default function JsonViewer({ data }: JsonViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="premium-card overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-slate-600 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
          <span className="text-sm font-bold text-slate-900">Raw JSON Response</span>
          <span className="ml-2 text-xs text-slate-500 font-medium">(Debug Mode)</span>
        </div>
        <svg
          className={`w-5 h-5 text-slate-600 transition-transform ${
            isExpanded ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-200 bg-slate-50">
          <div className="p-4">
            <pre className="text-xs text-slate-800 overflow-x-auto bg-white rounded-lg border border-slate-200 p-4 font-mono">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
