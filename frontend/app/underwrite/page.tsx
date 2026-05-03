'use client'

import { useState } from 'react'
import { UploadedFile, PredictionResponse } from '@/types'
import { submitPrediction } from '@/lib/api'
import { validateFiles } from '@/lib/utils'
import UploadPanel from '@/components/UploadPanel'
import ResultsPanel from '@/components/ResultsPanel'
import ValidationPanel from '@/components/ValidationPanel'
import { saveAssessment } from '@/lib/store'
import FraudFlashcardModal from '@/components/FraudFlashcardModal'
import { FlashcardData } from '@/types'

function generateFlashcards(result: PredictionResponse, storePhotos: UploadedFile[]): FlashcardData[] {
  const flashcards: FlashcardData[] = []
  let idCounter = 1

  const defaultImg = storePhotos.length > 0 ? storePhotos[0].preview : undefined

  // Process risk flags (which have severity)
  result.risk_flags?.forEach(flag => {
    if (flag.severity === 'high') {
      let category = 'General'
      let proTip = ['Ask the store owner to explain the discrepancy.']
      let leftLabel = 'Detected Feature'
      let rightLabel = 'Expected Baseline'
      let leftValue = 'Anomaly Detected'
      let rightValue = 'Standard Profile'
      let logic = `The system detected an anomaly related to: ${flag.flag}. This conflicts with the expected baseline for this store profile.`

      if (flag.flag.toLowerCase().includes('vision') || flag.flag.toLowerCase().includes('inventory')) {
        category = 'Visual Mismatch'
        proTip = [
          'Verify if recent bulk purchases were made that haven\'t been sold yet.',
          'Check if the store acts as a micro-wholesaler for nearby stalls.',
          'Request physical purchase invoices for the high-value stock visible.'
        ]
        leftLabel = 'Visual Shelf Density'
        rightLabel = 'Historical Profile'
        logic = `System detected unusually high inventory relative to the location tier. This suggests temporary stock staging for credit inflation.`
        leftValue = 'Extensive Inventory'
        rightValue = 'Low-Tier Expectation'
      } else if (flag.flag.toLowerCase().includes('geo') || flag.flag.toLowerCase().includes('address')) {
        category = 'Geo Conflict'
        proTip = [
          'Check if the GPS coordinates were spoofed during capture.',
          'Ask for a utility bill matching the exact shop location.',
          'Verify if a new market area has opened nearby recently.'
        ]
        leftLabel = 'GPS Coordinates'
        rightLabel = 'Registered Address / OSM Data'
        logic = `The GPS coordinates from the photo do not match the registered address or show an impossible distance traveled between captures.`
      }

      flashcards.push({
        id: `fc-${idCounter++}`,
        title: flag.flag,
        category,
        severity: 'high',
        detectedSignal: { label: leftLabel, value: leftValue, imageSrc: defaultImg },
        conflictingReality: { label: rightLabel, value: rightValue },
        logicBreakdown: logic,
        proTip
      })
    }
  })

  // Process string fraud flags (treating as high severity metadata/identity issues)
  result.fraud_flags?.forEach(flag => {
    let category = 'Identity / Metadata'
    let proTip = ['Verify the authenticity of the uploaded documents.']
    if (flag.toLowerCase().includes('duplicate')) {
      proTip = ['Check if these photos were submitted for a previous loan application.']
    } else if (flag.toLowerCase().includes('metadata')) {
      proTip = ['Ask the field agent why EXIF data was stripped.', 'Request a live photo capture via the secure app.']
    }

    flashcards.push({
      id: `fc-${idCounter++}`,
      title: flag.replace(/_/g, ' ').toUpperCase(),
      category,
      severity: 'high',
      detectedSignal: { label: 'Metadata Analysis', value: 'Suspicious Artifacts', imageSrc: defaultImg },
      conflictingReality: { label: 'System Policy', value: 'Original Metadata Required' },
      logicBreakdown: `System flagged: ${flag}. This suggests potential manipulation of the submitted evidence.`,
      proTip
    })
  })

  return flashcards
}

export default function Home() {
  const [storePhotos, setStorePhotos] = useState<UploadedFile[]>([])
  const [bankStatement, setBankStatement] = useState<File | null>(null)
  const [supplierBill, setSupplierBill] = useState<UploadedFile | null>(null)
  const [shopVideo, setShopVideo] = useState<File | null>(null)
  const [inventoryDays, setInventoryDays] = useState(15)
  const [receivableDays, setReceivableDays] = useState(3)
  const [payableDays, setPayableDays] = useState(10)
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PredictionResponse | null>(null)
  const [showFlashcards, setShowFlashcards] = useState(false)
  const [flashcardsData, setFlashcardsData] = useState<FlashcardData[]>([])

  const canSubmit = storePhotos.length >= 3

  const handleSubmit = async () => {
    setError(null)
    const validation = validateFiles(storePhotos.map(p => p.file), bankStatement, supplierBill?.file || null)
    if (!validation.valid) { setError(validation.error || 'Validation failed'); return }
    setLoading(true)
    try {
      const res = await submitPrediction(
        storePhotos.map(p => p.file),
        bankStatement,
        supplierBill?.file || null,
        shopVideo,
        lat ? parseFloat(lat) : undefined,
        lon ? parseFloat(lon) : undefined,
        inventoryDays,
        receivableDays,
        payableDays,
      )
      saveAssessment(res)
      setResult(res)
      
      // Generate flashcards and show modal if high-severity flags exist
      const cards = generateFlashcards(res, storePhotos)
      if (cards.length > 0) {
        setFlashcardsData(cards)
        setShowFlashcards(true)
      }

      setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err: any) {
      setError(err.message || 'Failed to process request')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStorePhotos([]); setBankStatement(null); setSupplierBill(null); setShopVideo(null)
    setInventoryDays(15); setReceivableDays(3); setPayableDays(10)
    setLat(''); setLon(''); setResult(null); setError(null)
  }

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ── LEFT: Upload Panel ── */}
        <div className="xl:col-span-3 lg:col-span-4">
          <UploadPanel
            storePhotos={storePhotos} setStorePhotos={setStorePhotos}
            bankStatement={bankStatement} setBankStatement={setBankStatement}
            supplierBill={supplierBill} setSupplierBill={setSupplierBill}
            shopVideo={shopVideo} setShopVideo={setShopVideo}
            inventoryDays={inventoryDays} setInventoryDays={setInventoryDays}
            receivableDays={receivableDays} setReceivableDays={setReceivableDays}
            payableDays={payableDays} setPayableDays={setPayableDays}
            showFraudSummary={!!result}
            duplicateDetected={result?.fraud_flags?.some(flag => flag.toLowerCase().includes('duplicate')) ?? false}
            hasMetadataWarning={result?.fraud_flags?.some(flag => flag.toLowerCase().includes('metadata_stripped_suspicious')) ?? false}
            lat={lat} setLat={setLat} lon={lon} setLon={setLon}
          />
        </div>

        {/* ── CENTER: Workstation ── */}
        <div className="xl:col-span-6 lg:col-span-8 space-y-4">

          {/* Action bar */}
          <div className="card p-4 flex items-center justify-between gap-3">
            <button onClick={handleReset} disabled={loading} className="btn-secondary disabled:opacity-40">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>

            <div className="flex items-center gap-2">
              {/* Evidence chips */}
              <div className="hidden md:flex items-center gap-1.5">
                {[
                  { label: `${storePhotos.length}/3 Photos`, done: storePhotos.length >= 3 },
                  { label: 'Bank Stmt', done: !!bankStatement },
                  { label: 'Bill', done: !!supplierBill },
                ].map(c => (
                  <span key={c.label} className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border ${c.done ? 'bg-teal-500/10 border-teal-500/25 text-teal-400' : 'bg-white/[0.03] border-white/10 text-slate-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.done ? 'bg-teal-400' : 'bg-slate-600'}`} />
                    {c.label}
                  </span>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !canSubmit}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-[var(--primary)]/25"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Analysing…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Run Assessment
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="card-red p-4 flex items-start gap-3 fade-up">
              <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-bold text-red-300">Error</p>
                <p className="text-sm text-red-400/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="card p-6 space-y-5 fade-up">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-500/15 border border-teal-500/25 flex items-center justify-center flex-shrink-0">
                  <svg className="animate-spin w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">Running AI Pipeline</p>
                  <p className="text-xs text-slate-500">This takes 30–60s — YOLO + OSM geo lookup are the slow steps</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: '1. YOLO Vision Inference', sub: 'Detecting products across store photos…' },
                  { label: '2. OSM Geo Intelligence', sub: 'Querying OpenStreetMap for location signals…' },
                  { label: '3. Fraud & EXIF Checks', sub: 'Cross-validating metadata and signals…' },
                  { label: '4. ML Scoring (kirana_model.pkl)', sub: 'Computing revenue & loan band…' },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="w-5 h-5 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold text-teal-400">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-300">{step.label}</p>
                      <p className="text-[10px] text-slate-600">{step.sub}</p>
                    </div>
                    <div className="shimmer w-16 h-4 rounded" />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 text-center">Check the backend terminal for live progress logs</p>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div id="results" className="fade-up">
              <ResultsPanel result={result} />
            </div>
          )}

          {/* Empty state */}
          {!result && !loading && !error && (
            <div className="card p-10 text-center fade-up">
              <div className="max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-5">
                  <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">Workstation Ready</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-7">
                  Upload store evidence to begin AI-powered cash-flow analysis and credit risk assessment
                </p>
                <div className="space-y-2 text-left">
                  <p className="label text-center mb-3">Evidence Checklist</p>
                  {[
                    { label: '3–5 store interior photos (Required)', done: storePhotos.length >= 3, status: storePhotos.length > 0 ? `${storePhotos.length} uploaded` : 'Not uploaded' },
                    { label: 'Bank statement (PDF) (Optional)', done: !!bankStatement, status: bankStatement ? bankStatement.name : 'Not uploaded' },
                    { label: 'Supplier bill (image) (Optional)', done: !!supplierBill, status: supplierBill ? supplierBill.file.name : 'Not uploaded' },
                  ].map(item => (
                    <div key={item.label} className={`flex items-center gap-3 p-3 rounded-xl border ${item.done ? 'bg-teal-500/[0.07] border-teal-500/20' : 'bg-white/[0.02] border-white/[0.07]'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-teal-500' : 'bg-white/10'}`}>
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${item.done ? 'text-teal-300' : 'text-slate-400'}`}>{item.label}</p>
                        <p className={`text-xs truncate ${item.done ? 'text-teal-500' : 'text-slate-600'}`}>{item.status}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 p-3 rounded-xl border bg-white/[0.02] border-white/[0.07] opacity-60">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-400">GPS Coordinates</p>
                      <p className="text-xs text-slate-600">{lat && lon ? `${lat}, ${lon}` : 'Optional — boosts geo accuracy'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Validation Panel ── */}
        <div className="xl:col-span-3 lg:col-span-12">
          {result ? (
            <div className="space-y-4">
              <ValidationPanel
                fraudFlags={result.fraud_flags}
                locationTier={result.location_tier}
                geoMultiplier={result.geo_multiplier}
                confidenceScore={result.confidence_score}
                visionFeatures={result.vision_features}
                riskFlags={result.risk_flags}
              />
              
              {/* Show Flashcards Button if any exist */}
              {flashcardsData.length > 0 && (
                <button 
                  onClick={() => setShowFlashcards(true)}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-[var(--surface)] border border-[var(--semantic-error)] text-[var(--semantic-error)] hover:bg-[rgba(229,64,96,0.05)] rounded-xl font-semibold transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Review {flashcardsData.length} Fraud Signals
                </button>
              )}
            </div>
          ) : (
            <div className="card p-5 sticky top-[105px]">
              <div className="flex items-center gap-2 mb-5">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="title">Validation & Risk Flags</h3>
              </div>
              <div className="space-y-2 mb-6">
                {['Address Mismatch', 'Inventory Staging', 'Vision vs Geo', 'Entity Conflict', 'Confidence Penalty'].map(name => (
                  <div key={name} className="flex items-center justify-between p-2.5 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                    <span className="text-xs font-medium text-slate-500">{name}</span>
                    <span className="text-[10px] font-bold text-slate-600 bg-white/[0.04] border border-white/[0.07] px-2 py-0.5 rounded">PENDING</span>
                  </div>
                ))}
              </div>
              <div className="text-center py-4 border-t border-white/[0.06]">
                <p className="text-xs text-slate-600 font-medium">Risk assessment appears after analysis</p>
              </div>
            </div>
          )}
        </div>

      </div>

      <FraudFlashcardModal 
        isOpen={showFlashcards} 
        onClose={() => setShowFlashcards(false)} 
        flashcards={flashcardsData} 
      />
    </div>
  )
}
