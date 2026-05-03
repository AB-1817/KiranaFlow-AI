'use client'

interface TimelineEvent {
  timestamp: string
  caseId: string
  event: string
  details: string
  status: 'completed' | 'in-progress' | 'failed' | 'flagged'
}

interface ActivityTimelineProps {
  events: TimelineEvent[]
}

// Timeline pastel colors from DESIGN-cursor.md spec
const eventIconMap: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  'Case Created': {
    bg: '#e6e5e0', color: '#26251e',
    icon: (<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>),
  },
  'Evidence Uploaded': {
    bg: '#9fbbe0', color: '#26251e',  // timeline-read (blue)
    icon: (<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>),
  },
  'Photos Validated': {
    bg: '#c0a8dd', color: '#26251e',  // timeline-edit (lavender)
    icon: (<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>),
  },
  'YOLO Inference Completed': {
    bg: '#dfa88f', color: '#26251e',  // timeline-thinking (peach)
    icon: (<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>),
  },
  'Geo Multiplier Assigned': {
    bg: '#9fc9a2', color: '#26251e',  // timeline-grep (mint)
    icon: (<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>),
  },
  'Supplier Bill Processed': {
    bg: '#9fbbe0', color: '#26251e',  // timeline-read (blue)
    icon: (<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>),
  },
  'Confidence Score Calculated': {
    bg: '#c08532', color: '#ffffff',  // timeline-done (gold)
    icon: (<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>),
  },
  'Fraud Check Completed': {
    bg: '#1f8a65', color: '#ffffff',  // semantic-success
    icon: (<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>),
  },
  'Fraud Flag Triggered': {
    bg: '#cf2d56', color: '#ffffff',  // semantic-error
    icon: (<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>),
  },
  'Recommendation Generated': {
    bg: '#c08532', color: '#ffffff',  // timeline-done (gold)
    icon: (<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
  },
  'Report Exported': {
    bg: '#e6e5e0', color: '#26251e',  // neutral
    icon: (<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>),
  },
  'Sent to Manual Review': {
    bg: '#dfa88f', color: '#26251e',  // timeline-thinking (peach)
    icon: (<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
  },
}

const defaultIcon = {
  bg: '#e6e5e0', color: '#807d72',
  icon: (<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
}

export default function ActivityTimeline({ events }: ActivityTimelineProps) {
  return (
    <div className="space-y-0">
      {events.map((event, index) => {
        const cfg = eventIconMap[event.event] ?? defaultIcon
        const isLast = index === events.length - 1

        return (
          <div key={index} className="flex gap-4 group">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div
                className="timeline-dot ring-2 ring-[#f7f7f4]"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                {cfg.icon}
              </div>
              {!isLast && <div className="w-0.5 flex-1 my-1 min-h-[20px]" style={{ background: '#e6e5e0' }} />}
            </div>

            {/* Content */}
            <div className="flex-1 pb-5">
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: '#26251e' }}>{event.event}</span>
                  <span
                    className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ color: '#f54e00', background: 'rgba(245,78,0,0.08)', border: '1px solid rgba(245,78,0,0.18)' }}
                  >
                    {event.caseId}
                  </span>
                </div>
                <span className="text-[10px] font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#a09c92' }}>
                  {event.timestamp}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#5a5852' }}>{event.details}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
