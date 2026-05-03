'use client'

import { useState, useEffect } from 'react'
import { FlashcardData } from '@/types'

interface FraudFlashcardModalProps {
  isOpen: boolean
  onClose: () => void
  flashcards: FlashcardData[]
}

export default function FraudFlashcardModal({ isOpen, onClose, flashcards }: FraudFlashcardModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [activeTab, setActiveTab] = useState('All')

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0)
      setFlipped(false)
      setActiveTab('All')
    }
  }, [isOpen])

  // Reset flip when changing cards
  useEffect(() => {
    setFlipped(false)
  }, [currentIndex, activeTab])

  if (!isOpen || flashcards.length === 0) return null

  // Categorization
  const categories = ['All', ...Array.from(new Set(flashcards.map(f => f.category)))]
  const filteredCards = activeTab === 'All' ? flashcards : flashcards.filter(f => f.category === activeTab)
  
  // Safety check if active tab leaves no cards (e.g. while closing)
  if (filteredCards.length === 0 && flashcards.length > 0) {
    setActiveTab('All')
    return null
  }

  const currentCard = filteredCards[currentIndex] || filteredCards[0]
  const totalSteps = filteredCards.length

  const handleNext = () => {
    if (currentIndex < totalSteps - 1) setCurrentIndex(prev => prev + 1)
  }

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ perspective: '1000px' }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-[var(--canvas-soft)] border border-[var(--hairline)] rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 max-h-[90vh]">
        
        {/* Header: Tabs & Close */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--hairline)]">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveTab(cat); setCurrentIndex(0); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === cat 
                    ? 'bg-[var(--primary)] text-white' 
                    : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--hairline)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <button 
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--hairline)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--primary)] transition-all ml-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-4 flex justify-between items-center">
          <span className="text-xs font-semibold tracking-wider text-[var(--muted)] uppercase">
            Fraud Signal Analysis
          </span>
          <span className="text-xs font-mono font-bold text-[var(--primary)] bg-[rgba(245,78,0,0.1)] px-2.5 py-1 rounded-md border border-[rgba(245,78,0,0.2)]">
            {currentIndex + 1} OF {totalSteps}
          </span>
        </div>

        {/* Main Content Area (Flip Container) */}
        <div className="relative flex-1 p-6 flex flex-col min-h-[500px]">
          <div 
            className="relative w-full h-full flex-1 transition-transform duration-500"
            style={{ 
              transformStyle: 'preserve-3d', 
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
            }}
          >
            {/* FRONT FACE */}
            <div 
              className="absolute inset-0 w-full h-full flex flex-col overflow-y-auto custom-scrollbar pr-2"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-[var(--semantic-error)] animate-pulse" />
                <h2 className="text-xl sm:text-2xl font-semibold text-[var(--ink)] leading-tight">
                  {currentCard.title}
                </h2>
              </div>

              {/* Split View Evidence Pane */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6 flex-1">
                {/* Left: Detected Signal */}
                <div className="flex-1 bg-[var(--surface)] border border-[var(--hairline)] rounded-xl p-4 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-[var(--primary)]" />
                  <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)] mb-3">
                    Detected Signal
                  </h3>
                  {currentCard.detectedSignal.imageSrc ? (
                    <div className="flex-1 bg-[var(--canvas)] rounded-lg border border-[var(--hairline)] mb-3 overflow-hidden flex items-center justify-center relative min-h-[140px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={currentCard.detectedSignal.imageSrc} alt="Detected Evidence" className="w-full h-full object-cover opacity-80" />
                    </div>
                  ) : (
                    <div className="flex-1 bg-[var(--canvas)] rounded-lg border border-[var(--hairline)] mb-3 flex items-center justify-center min-h-[140px]">
                      <svg className="w-8 h-8 text-[var(--muted-soft)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-[var(--muted)]">{currentCard.detectedSignal.label}</p>
                    <p className="text-sm font-semibold text-[var(--ink)]">{currentCard.detectedSignal.value}</p>
                  </div>
                </div>

                {/* Right: Conflicting Reality */}
                <div className="flex-1 bg-[var(--surface)] border border-[var(--hairline)] rounded-xl p-4 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-[var(--semantic-error)]" />
                  <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)] mb-3">
                    Conflicting Reality
                  </h3>
                  {currentCard.conflictingReality.imageSrc ? (
                    <div className="flex-1 bg-[var(--canvas)] rounded-lg border border-[var(--hairline)] mb-3 overflow-hidden flex items-center justify-center relative min-h-[140px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={currentCard.conflictingReality.imageSrc} alt="Conflicting Evidence" className="w-full h-full object-cover opacity-80" />
                    </div>
                  ) : (
                    <div className="flex-1 bg-[var(--canvas)] rounded-lg border border-[var(--hairline)] mb-3 flex items-center justify-center min-h-[140px] relative overflow-hidden">
                      {/* Map/Grid placeholder pattern */}
                      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]" />
                      <svg className="w-8 h-8 text-[var(--muted-soft)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-[var(--muted)]">{currentCard.conflictingReality.label}</p>
                    <p className="text-sm font-semibold text-[var(--ink)]">{currentCard.conflictingReality.value}</p>
                  </div>
                </div>
              </div>

              {/* Logic Breakdown */}
              <div className="bg-[rgba(245,78,0,0.04)] border border-[rgba(245,78,0,0.15)] rounded-xl p-4 flex gap-3 items-start mb-4">
                <svg className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--primary)] mb-1">Logic Breakdown</p>
                  <p className="text-sm text-[var(--ink)] leading-relaxed">{currentCard.logicBreakdown}</p>
                </div>
              </div>

              <div className="mt-auto flex justify-center">
                <button 
                  onClick={() => setFlipped(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[var(--surface)] border border-[var(--hairline)] hover:bg-[var(--canvas)] hover:border-[var(--primary)] text-[var(--ink)] text-sm font-semibold rounded-lg transition-all"
                >
                  <svg className="w-4 h-4 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Flip for Manual Audit Pro-Tips
                </button>
              </div>
            </div>

            {/* BACK FACE */}
            <div 
              className="absolute inset-0 w-full h-full flex flex-col bg-[var(--surface)] border border-[var(--hairline)] rounded-2xl p-6"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(31,138,101,0.1)] flex items-center justify-center border border-[rgba(31,138,101,0.2)]">
                    <svg className="w-4 h-4 text-[var(--semantic-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-[var(--ink)]">Manual Audit Protocol</h2>
                </div>
                <button 
                  onClick={() => setFlipped(false)}
                  className="text-[var(--muted)] hover:text-[var(--primary)] text-sm font-semibold flex items-center gap-1 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Evidence
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)] mb-4">
                  Recommended Questions for Field Agent / Store Owner
                </h3>
                <div className="space-y-4">
                  {currentCard.proTip.map((tip, idx) => (
                    <div key={idx} className="flex gap-3 bg-[var(--canvas)] p-4 rounded-xl border border-[var(--hairline)]">
                      <div className="w-6 h-6 rounded-full bg-[var(--surface)] border border-[var(--hairline)] flex items-center justify-center flex-shrink-0 text-xs font-bold text-[var(--muted)]">
                        {idx + 1}
                      </div>
                      <p className="text-sm text-[var(--ink)] leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Progress Navigation */}
        <div className="flex items-center justify-between p-4 border-t border-[var(--hairline)] bg-[var(--surface)]">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0 || flipped}
            className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            &larr; Prev
          </button>
          
          <div className="flex gap-1.5">
            {filteredCards.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentIndex ? 'bg-[var(--primary)]' : 'bg-[var(--hairline-strong)]'
                }`} 
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === totalSteps - 1 || flipped}
            className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next &rarr;
          </button>
        </div>

      </div>
    </div>
  )
}
