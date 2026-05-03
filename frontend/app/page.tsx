'use client'

import Link from 'next/link'

function IconBolt() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
}
function IconChart() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
}

// ── Reusable style helpers using CSS vars ──────────────────────────────────
const S = {
  ink:      { color: 'var(--ink)' } as React.CSSProperties,
  body:     { color: 'var(--body)' } as React.CSSProperties,
  muted:    { color: 'var(--muted)' } as React.CSSProperties,
  mutedSoft:{ color: 'var(--muted-soft)' } as React.CSSProperties,
  primary:  { color: 'var(--primary)' } as React.CSSProperties,
  canvas:   { background: 'var(--canvas)' } as React.CSSProperties,
  surface:  { background: 'var(--surface)' } as React.CSSProperties,
  hairline: { borderColor: 'var(--hairline)' } as React.CSSProperties,
  label:    { fontSize: '11px', fontWeight: 600, letterSpacing: '0.88px', textTransform: 'uppercase', color: 'var(--muted)' } as React.CSSProperties,
  sectionHead: { fontSize: 'clamp(28px,4vw,36px)', fontWeight: 400, lineHeight: 1.2, letterSpacing: '-0.72px', color: 'var(--ink)' } as React.CSSProperties,
  fileLabel:{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.88px', textTransform: 'uppercase', color: 'var(--muted-soft)' } as React.CSSProperties,
  numLabel: { fontSize: '11px', fontWeight: 600, letterSpacing: '0.88px', textTransform: 'uppercase', color: 'var(--primary)' } as React.CSSProperties,
}

// ── Step card ─────────────────────────────────────────────────────────────
function StepCard({ num, title, desc, icon }: { num: string; title: string; desc: string; icon: React.ReactNode }) {
  return (
    <div className="flex-1 min-w-[140px] px-5 py-5 border-r last:border-r-0 first:pl-0 last:pr-0" style={{ borderColor: 'var(--hairline)' }}>
      <span style={S.numLabel}>{num}</span>
      <div className="mt-3 mb-2 w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ background: 'rgba(245,78,0,0.09)', border: '1px solid rgba(245,78,0,0.2)', color: 'var(--primary)' }}>
        {icon}
      </div>
      <h3 className="text-sm font-semibold mb-1" style={S.ink}>{title}</h3>
      <p className="text-xs leading-relaxed" style={S.muted}>{desc}</p>
    </div>
  )
}

// ── Innovation card ────────────────────────────────────────────────────────
function InnovationCard({ file, title, desc, tag, dotColor }: { file: string; title: string; desc: string; tag: string; dotColor: string }) {
  return (
    <div className="card p-6 flex flex-col gap-3 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <span style={S.fileLabel}>{file}</span>
        <div className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" style={{ background: dotColor }} />
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2" style={S.ink}>{title}</h3>
        <p className="text-xs leading-relaxed" style={S.body}>{desc}</p>
      </div>
      <div className="mt-auto pt-3" style={{ borderTop: '1px solid var(--hairline)' }}>
        <span style={S.fileLabel}>{tag}</span>
      </div>
    </div>
  )
}

// ── Criterion card ─────────────────────────────────────────────────────────
function CriterionCard({ num, title, desc, pct }: { num: string; title: string; desc: string; pct: number }) {
  return (
    <div className="flex-1 min-w-[130px] px-5 py-5 border-r last:border-r-0 first:pl-0 last:pr-0" style={{ borderColor: 'var(--hairline)' }}>
      <span style={S.numLabel}>{num}</span>
      <h3 className="text-sm font-semibold mt-3 mb-1.5" style={S.ink}>{title}</h3>
      <p className="text-xs leading-relaxed mb-4" style={S.body}>{desc}</p>
      <div className="pt-3" style={{ borderTop: '1px solid var(--hairline)' }}>
        <div className="w-full h-1 rounded-full mb-1.5" style={{ background: 'var(--hairline)' }}>
          <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: 'var(--primary)' }} />
        </div>
        <span style={S.fileLabel}>Weighted {pct}% of total</span>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen" style={S.canvas}>

      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 pt-20 pb-24 text-center">

        <h1 className="mb-6"
          style={{ fontSize: 'clamp(38px,7vw,72px)', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-2px', color: 'var(--ink)' }}>
          A Credit Bureau for the{' '}
          <span style={{ color: 'var(--primary)' }}>Physical World</span>
        </h1>

        <p className="max-w-2xl mx-auto mb-10" style={{ fontSize: '17px', lineHeight: 1.6, color: 'var(--body)' }}>
          Remote cash flow underwriting for India&apos;s{' '}
          <strong style={S.ink}>13M+ kirana stores.</strong>{' '}
          We replaced a 5-day, ₹2,000 field-officer process with a{' '}
          <strong style={S.primary}>10-second AI pipeline</strong>{' '}
          that fuses vision, geography, payment behavior, and economic reasoning to generate a formal credit decision.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/underwrite" className="btn-primary"><IconBolt /> Run Live Assessment</Link>
          <Link href="/portfolio" className="btn-secondary"><IconChart /> View Portfolio</Link>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {[
            { value: '13M+',  label: 'Kirana Stores Addressable' },
            { value: '10s',   label: 'End-to-End Decision Time' },
            { value: '90%',   label: 'Cost Reduction vs Field Visit' },
            { value: '₹25K+', label: 'Micro-Loans Now Profitable' },
          ].map(s => (
            <div key={s.label} className="card p-5 text-center">
              <p className="text-3xl mb-1" style={{ fontWeight: 400, letterSpacing: '-1px', color: 'var(--primary)' }}>{s.value}</p>
              <p className="text-xs" style={S.muted}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="py-20" style={{ borderTop: '1px solid var(--hairline)', background: 'var(--surface)' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="mb-10">
            <span className="label">System Architecture</span>
            <h2 className="mt-1 mb-2" style={S.sectionHead}>How It Works</h2>
            <p style={S.body}>From smartphone photo to disbursement decision in under 10 seconds</p>
          </div>
          <div className="card overflow-hidden">
            <div className="h-px" style={{ background: 'var(--primary)' }} />
            <div className="flex flex-wrap p-5">
              <StepCard num="01" title="Capture" desc="Field agent uploads 3–5 interior photos, a supplier bill, and a bank statement via our mobile-first portal."
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              />
              <StepCard num="02" title="Vision" desc="14 features extracted (V1–V7 visual + G1–G7 geo-spatial) via YOLO-based shelf density analysis."
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>}
              />
              <StepCard num="03" title="Fusion" desc="Supply × Demand × Location × Seasonality fusion model synthesises multi-signal revenue proxy."
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>}
              />
              <StepCard num="04" title="Trust" desc="5 fraud patterns + 4-component confidence score with EXIF metadata audit and cross-validation."
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>}
              />
              <StepCard num="05" title="Decide" desc="Loan eligibility band + auto-generated PDF Sanction Report. Underwriting completed in seconds."
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4 CORE INNOVATIONS ───────────────────────────────────────── */}
      <section className="py-20" style={{ borderTop: '1px solid var(--hairline)' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="mb-2" style={S.sectionHead}>4 Core Innovations</h2>
            <p style={S.body}>Each independently grounded in microeconomics. Together unbeatable.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <InnovationCard file="File 01" dotColor="#dfa88f" title="Multi-Signal Revenue Proxy"
              desc="Fuses vision (YOLO shelf features) + geo-spatial (OSM) + document (OCR) signals. Single inflated source can't fool consensus. Catches 3 fraud patterns at intake." tag="Revenue" />
            <InnovationCard file="File 02" dotColor="#9fbbe0" title="Cash Conversion Cycle Estimator"
              desc="Inventory + Receivables − Payables. Reveals true solvency. Auto-recommends loan band: supplier-funded, balanced, capital-intensive, or high-risk." tag="Solvency" />
            <InnovationCard file="File 03" dotColor="#9fc9a2" title="Location Intelligence"
              desc="Demographics × Competition × Traffic × Tier produces 0.35×–1.85× multiplier. Free Census + OSM + Google Places. Tier 2/3 markets unlocked." tag="Geography" />
            <InnovationCard file="File 04" dotColor="#c0a8dd" title="Dynamic Confidence Recalibration"
              desc="Multi-factor confidence with fraud penalty gates. Every EMI payment retrains the model. Portfolio-level NPA learning auto-tunes weights over time." tag="Confidence" />
          </div>
        </div>
      </section>

      {/* ─── BEFORE VS AFTER ──────────────────────────────────────────── */}
      <section className="py-20" style={{ borderTop: '1px solid var(--hairline)', background: 'var(--surface)' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="mb-10">
            <h2 className="mb-2" style={S.sectionHead}>
              Before <em style={{ color: 'var(--muted)', fontStyle: 'italic' }}>vs</em> After
            </h2>
            <p style={S.body}>From manual judgement to AI-driven credit intelligence</p>
          </div>
          <div className="card overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ borderColor: 'var(--hairline)' }}>

              {/* Manual */}
              <div className="p-8" style={{ borderRight: '1px solid var(--hairline)' }}>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center"
                    style={{ background: 'var(--canvas)', border: '1px solid var(--hairline)' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={S.muted}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold" style={S.ink}>Manual Underwriting (Today)</h3>
                </div>
                <ul className="space-y-3">
                  {['Field officer visits store · 30–60 min observation','₹800–₹2,000 per application','5–10 days to decision','±40% income variance between officers','Owner-declared income inflated 30–80%','Min loan ₹1.5–2L (cost floor)','Tier 2/3 unreachable'].map(item => (
                    <li key={item} className="flex items-start gap-3 text-sm" style={S.body}>
                      <span className="flex-shrink-0 mt-0.5" style={{ color: 'var(--semantic-error)' }}>✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* KiranaCredit AI */}
              <div className="p-8" style={{ background: 'rgba(245,78,0,0.03)' }}>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center"
                    style={{ background: 'rgba(245,78,0,0.1)', border: '1px solid rgba(245,78,0,0.2)' }}>
                    <svg className="w-4 h-4" fill="none" stroke="var(--primary)" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold" style={S.primary}>Guardian AI Workstation</h3>
                </div>
                <ul className="space-y-3">
                  {['Photos, GPS & documents fused in < 10 sec','₹80–₹200 per application (90% ↓)','Instant PDF Sanction Report generation','Deterministic — same input, same output','Truth-Layer Verification & OCR validation','₹25,000+ loans now profitable','Works anywhere in India'].map(item => (
                    <li key={item} className="flex items-start gap-3 text-sm" style={S.body}>
                      <span className="flex-shrink-0 mt-0.5" style={{ color: 'var(--semantic-success)' }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── JUDGING CRITERIA ─────────────────────────────────────────── */}
      <section className="py-20" style={{ borderTop: '1px solid var(--hairline)' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="mb-10">
            <span className="label">Transparency Protocol</span>
            <h2 className="mt-1 mb-2" style={S.sectionHead}>Enterprise Validation Framework</h2>
            <p style={S.body}>Our underwriting engine maps to every dimension of institutional credit risk policy</p>
          </div>
          <div className="card overflow-hidden">
            <div className="h-px" style={{ background: 'var(--primary)' }} />
            <div className="flex flex-wrap p-5">
              <CriterionCard num="01" title="Feature Extraction" pct={35} desc="Deep YOLOv8 integration for visual shelf density and SKU diversity proxy." />
              <CriterionCard num="02" title="Economic Logic" pct={25} desc="Multi-Signal Revenue Engine fusing computer vision with OSM geo-spatial intel." />
              <CriterionCard num="03" title="Cash Flow Analysis" pct={15} desc="CCC (Cash Conversion Cycle) calculator deriving accurate solvency metrics." />
              <CriterionCard num="04" title="Guardian Fraud Audit" pct={20} desc="Forensic Flashcard logic detecting staging, duplicate evidence, and EXIF spoofing." />
              <CriterionCard num="05" title="Production Ready" pct={5} desc="FastAPI backend, React UI, automated PDF Sanction Reports, and LOS-ready outputs." />
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-24 text-center" style={{ borderTop: '1px solid var(--hairline)', background: 'var(--surface)' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="mb-4" style={S.sectionHead}>Ready to underwrite at scale?</h2>
          <p className="mb-8 max-w-lg mx-auto" style={S.body}>
            Upload store evidence and run an AI-powered credit assessment in under 10 seconds.
            Zero field visits. Automated decisions.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/underwrite" className="btn-primary"><IconBolt /> Open Underwriting Workstation</Link>
            <Link href="/dashboard" className="btn-secondary"><IconChart /> View Dashboard</Link>
          </div>
        </div>
      </section>

    </div>
  )
}
