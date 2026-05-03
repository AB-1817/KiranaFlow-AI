'use client'

import { useEffect, useState } from 'react'
import { HealthStatus } from '@/types'
import { checkHealth } from '@/lib/api'

type ModuleStatus = {
  label: string
  key: keyof HealthStatus
  description: string
  critical: boolean
}

const MODULES: ModuleStatus[] = [
  { label: 'YOLO Vision',    key: 'model_loaded',       description: 'YOLOv8 product detection model',   critical: true  },
  { label: 'ML Model (PKL)', key: 'pkl_model_loaded',   description: 'kirana_model.pkl revenue predictor', critical: true  },
  { label: 'Geo / OSM',      key: 'geo_available',      description: 'OpenStreetMap intelligence',        critical: true  },
  { label: 'Fraud Engine',   key: 'fraud_available',    description: 'Multi-signal fraud detection',      critical: false },
  { label: 'OCR Processor',  key: 'ocr_available',      description: 'Supplier bill text extraction',     critical: false },
  { label: 'EXIF Auditor',   key: 'auditor_available',  description: 'GPS metadata spoofing check',       critical: false },
  { label: 'Fusion Engine',  key: 'fusion_available',   description: 'CCC + underwriting assembler',      critical: false },
  { label: 'PDF Parser',     key: 'pdf_available',      description: 'Bank statement extraction',         critical: false },
]

function ModuleRow({ module, health }: { module: ModuleStatus; health: HealthStatus }) {
  const active = !!health[module.key]
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-emerald-400' : module.critical ? 'bg-red-400' : 'bg-amber-400'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-200 leading-tight">{module.label}</p>
        <p className="text-[10px] text-slate-600 truncate">{module.description}</p>
      </div>
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${
        active
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          : module.critical
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
      }`}>
        {active ? 'READY' : module.critical ? 'DOWN' : 'DEMO'}
      </span>
    </div>
  )
}

export type HealthState = 'healthy' | 'degraded' | 'offline' | 'loading'

interface Props {
  onStatusChange?: (state: HealthState, health: HealthStatus | null) => void
}

export default function SystemHealthPanel({ onStatusChange }: Props) {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [state, setState] = useState<HealthState>('loading')
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [show, setShow] = useState(false)

  const refresh = async () => {
    try {
      const data = await checkHealth()
      setHealth(data)
      const coreReady = data.model_loaded && data.geo_available && data.fusion_available
      const next: HealthState = coreReady ? 'healthy' : 'degraded'
      setState(next)
      onStatusChange?.(next, data)
    } catch {
      setState('offline')
      setHealth(null)
      onStatusChange?.('offline', null)
    }
    setLastChecked(new Date())
  }

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 30_000)
    return () => clearInterval(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stateConfig = {
    healthy:  { dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'All Systems Ready', ring: 'ring-emerald-500/30' },
    degraded: { dot: 'bg-amber-400',   text: 'text-amber-400',   label: 'Demo Mode Active',  ring: 'ring-amber-500/30'  },
    offline:  { dot: 'bg-red-400',     text: 'text-red-400',     label: 'API Offline',        ring: 'ring-red-500/30'    },
    loading:  { dot: 'bg-slate-500',   text: 'text-slate-400',   label: 'Connecting…',        ring: 'ring-slate-500/20'  },
  }[state]

  const readyCount = health ? MODULES.filter(m => !!health[m.key]).length : 0

  return (
    <div className="relative">
      {/* Badge trigger */}
      <button
        onClick={() => setShow(v => !v)}
        className={`flex items-center gap-1.5 text-xs bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-1.5 transition-all hover:bg-white/[0.07] ring-1 ${stateConfig.ring}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${stateConfig.dot} ${state !== 'offline' ? 'animate-[pulse_2s_ease-in-out_infinite]' : ''}`} />
        <span className={`font-medium ${stateConfig.text}`}>{stateConfig.label}</span>
        {health && (
          <span className="text-slate-600 ml-0.5">{readyCount}/{MODULES.length}</span>
        )}
        <svg className={`w-3 h-3 text-slate-600 transition-transform ${show ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Popover */}
      {show && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50 card p-4 shadow-2xl shadow-black/50 border border-white/[0.1]">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${stateConfig.dot}`} />
              <p className="text-xs font-bold text-slate-100">AI Module Status</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); refresh() }}
                className="text-slate-600 hover:text-teal-400 transition-colors"
                title="Refresh"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button onClick={() => setShow(false)} className="text-slate-600 hover:text-slate-400 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Health score bar */}
          {health && (
            <div className="mb-3">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-slate-500">Module Health</span>
                <span className={stateConfig.text}>{readyCount}/{MODULES.length} modules ready</span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${readyCount === MODULES.length ? 'bg-emerald-500' : readyCount >= 5 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${(readyCount / MODULES.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Module rows */}
          {health ? (
            <div>
              {MODULES.map(m => <ModuleRow key={m.key} module={m} health={health} />)}
            </div>
          ) : state === 'offline' ? (
            <div className="text-center py-6">
              <svg className="w-8 h-8 text-red-400/50 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-xs text-red-400 font-semibold">Backend unreachable</p>
              <p className="text-[10px] text-slate-600 mt-1">Make sure the FastAPI server is running on port 8000</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-5 h-5 border-2 border-teal-500/30 border-t-teal-400 rounded-full animate-spin mx-auto" />
            </div>
          )}

          {/* Footer */}
          {lastChecked && (
            <div className="mt-3 pt-3 border-t border-white/[0.05] text-center">
              <p className="text-[9px] text-slate-700 font-mono">
                Last checked: {lastChecked.toLocaleTimeString()} · Auto-refreshes every 30s
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
