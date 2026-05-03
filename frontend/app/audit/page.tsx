'use client'

import { useEffect, useState } from 'react'
import { loadAuditEvents, AuditEvent, clearStore } from '@/lib/store'

const eventStyle = (event: string, status: string) => {
  if (status === 'flagged')                              return { icon: '⚠', color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/25' }
  if (event.includes('YOLO') || event.includes('Vision')) return { icon: '👁', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/25' }
  if (event.includes('Fraud'))                           return { icon: '🛡', color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/25' }
  if (event.includes('Geo'))                             return { icon: '📍', color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/25' }
  if (event.includes('Confidence') || event.includes('Score')) return { icon: '📊', color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/25' }
  if (event.includes('Approved') || event.includes('Complete')) return { icon: '✓', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25' }
  return { icon: '·', color: 'text-slate-400', bg: 'bg-white/[0.04] border-white/10' }
}

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [search, setSearch] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setEvents(loadAuditEvents())
    setMounted(true)
  }, [])

  if (!mounted) return null

  const filtered = events.filter(e => !search || e.caseId.toLowerCase().includes(search.toLowerCase()))
  const uniqueCases = [...new Set(events.map(e => e.caseId))]

  if (events.length === 0) {
    return (
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Audit Log</h2>
          <p className="text-sm text-slate-500 mt-0.5">Chronological pipeline trace — interpretable AI decisions</p>
        </div>
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-200 mb-2">No audit events yet</h3>
          <p className="text-sm text-slate-500">Run an assessment on the <span className="text-teal-400 font-semibold">Underwrite</span> tab — every pipeline step will be logged here automatically.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Audit Log</h2>
          <p className="text-sm text-slate-500 mt-0.5">{events.length} events across {uniqueCases.length} case{uniqueCases.length !== 1 ? 's' : ''} — real pipeline trace</p>
        </div>
        <button onClick={() => { clearStore(); setEvents([]) }} className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10">
          Clear Log
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">

        {/* Sidebar */}
        <div className="xl:col-span-1 space-y-4">
          <div className="card p-4">
            <p className="label mb-3">Filter by Case</p>
            <input type="text" placeholder="Search case ID…" value={search}
              onChange={e => setSearch(e.target.value)} className="input text-xs py-2" />
            {search && <button onClick={() => setSearch('')} className="mt-2 text-xs text-slate-500 hover:text-teal-400 transition-colors">✕ Clear</button>}
          </div>

          <div className="card p-4">
            <p className="label mb-3">Cases in Log</p>
            <div className="space-y-1.5">
              {uniqueCases.map(id => {
                const count = events.filter(e => e.caseId === id).length
                const active = search === id
                return (
                  <button key={id} onClick={() => setSearch(active ? '' : id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${active ? 'bg-teal-500/10 border-teal-500/25 text-teal-300' : 'bg-white/[0.02] border-white/[0.07] text-slate-400 hover:border-white/15'}`}>
                    <span className="mono text-xs font-bold">{id}</span>
                    <span className="text-[10px] text-slate-600">{count} events</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="card p-4">
            <p className="label mb-3">Log Summary</p>
            <div className="space-y-2.5">
              {[
                { label: 'Total Events', value: events.length },
                { label: 'Cases Tracked', value: uniqueCases.length },
                { label: 'Fraud Flags', value: events.filter(e => e.status === 'flagged').length },
                { label: 'YOLO Runs', value: events.filter(e => e.event.includes('YOLO')).length },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{s.label}</span>
                  <span className="text-sm font-bold text-slate-200">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="xl:col-span-3 card p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="title">Event Timeline</p>
            <span className="text-xs text-slate-500">{filtered.length} event{filtered.length !== 1 ? 's' : ''}{search ? ` · ${search}` : ''}</span>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500">No events found for this case ID</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[22px] top-0 bottom-0 w-px bg-white/[0.06]" />
              <div className="space-y-1">
                {filtered.map((e, i) => {
                  const cfg = eventStyle(e.event, e.status)
                  return (
                    <div key={i} className="flex items-start gap-4 py-2.5 pl-1">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 text-sm z-10 ${cfg.bg}`}>
                        <span className={cfg.color}>{cfg.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <span className="text-sm font-semibold text-slate-200">{e.event}</span>
                            <span className="ml-2 mono text-[10px] text-teal-500 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">{e.caseId}</span>
                          </div>
                          <span className="mono text-[10px] text-slate-600 flex-shrink-0">{e.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{e.details}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
