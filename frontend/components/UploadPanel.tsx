'use client'

import { useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { UploadedFile } from '@/types'

interface Props {
  storePhotos: UploadedFile[]
  setStorePhotos: (p: UploadedFile[]) => void
  bankStatement: File | null
  setBankStatement: (f: File | null) => void
  supplierBill: UploadedFile | null
  setSupplierBill: (f: UploadedFile | null) => void
  shopVideo: File | null
  setShopVideo: (f: File | null) => void
  inventoryDays: number
  setInventoryDays: (n: number) => void
  receivableDays: number
  setReceivableDays: (n: number) => void
  payableDays: number
  setPayableDays: (n: number) => void
  showFraudSummary?: boolean
  duplicateDetected?: boolean
  hasMetadataWarning?: boolean
  lat: string; setLat: (v: string) => void
  lon: string; setLon: (v: string) => void
}

const LocationPickerMap = dynamic(() => import('@/components/LocationPickerMap'), { ssr: false })

export default function UploadPanel({
  storePhotos, setStorePhotos,
  bankStatement, setBankStatement,
  supplierBill, setSupplierBill,
  shopVideo, setShopVideo,
  inventoryDays, setInventoryDays,
  receivableDays, setReceivableDays,
  payableDays, setPayableDays,
  showFraudSummary = false,
  duplicateDetected = false,
  hasMetadataWarning = false,
  lat, setLat, lon, setLon,
}: Props) {
  const photosRef = useRef<HTMLInputElement>(null)
  const bankRef   = useRef<HTMLInputElement>(null)
  const billRef   = useRef<HTMLInputElement>(null)
  const videoRef  = useRef<HTMLInputElement>(null)
  const [dragPhoto, setDragPhoto] = useState(false)
  const [address, setAddress] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const latNum = Number.parseFloat(lat || '18.5204')
  const lonNum = Number.parseFloat(lon || '73.8567')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) return
    setIsSearching(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`)
      const data = await res.json()
      if (data && data.length > 0) {
        setLat(Number(data[0].lat).toFixed(6))
        setLon(Number(data[0].lon).toFixed(6))
        setAddress(data[0].display_name.split(',').slice(0, 3).join(', '))
      }
    } catch (error) {
      console.error('Search failed', error)
    } finally {
      setIsSearching(false)
    }
  }

  const addPhotos = (files: FileList | null) => {
    if (!files) return
    const newPhotos: UploadedFile[] = Array.from(files).map(file => ({ file, preview: URL.createObjectURL(file) }))
    setStorePhotos([...storePhotos, ...newPhotos].slice(0, 5))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragPhoto(false)
    addPhotos(e.dataTransfer.files)
  }

  return (
    <div className="card p-5 sticky top-[105px] space-y-5">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h2 className="title">Evidence Upload</h2>
      </div>

      {/* Store Photos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-300">
            Store Photos <span className="text-red-400">*</span>
          </label>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${storePhotos.length >= 3 ? 'text-teal-400 bg-teal-500/10' : 'text-slate-500 bg-white/[0.04]'}`}>
            {storePhotos.length}/5
          </span>
        </div>

        <div
          onClick={() => photosRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragPhoto(true) }}
          onDragLeave={() => setDragPhoto(false)}
          className={`upload-zone p-4 text-center ${dragPhoto ? 'drag-over' : ''}`}
        >
          <svg className="mx-auto w-8 h-8 text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xs text-slate-400 font-medium">Click or drag photos here</p>
          <p className="text-[10px] text-slate-600 mt-0.5">JPG, PNG · 3–5 required</p>
        </div>
        <input ref={photosRef} type="file" accept="image/jpeg,image/jpg,image/png" multiple onChange={e => addPhotos(e.target.files)} className="hidden" />

        {storePhotos.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {storePhotos.map((photo, i) => (
              <div key={i} className="relative group aspect-square">
                <img src={photo.preview} alt={`Store ${i + 1}`} className="w-full h-full object-cover rounded-lg border border-white/[0.08]" />
                <button
                  onClick={() => setStorePhotos(storePhotos.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {i < 3 && <div className="absolute bottom-1 left-1 w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">{i + 1}</span>
                </div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Geo-Intelligence / GPS */}
      <div className="border-t border-[var(--hairline)] pt-4">
        <label className="text-xs font-bold text-[var(--muted)] block mb-2.5">
          Store Location
          <span className="text-[var(--muted-soft)] font-normal ml-1">(Required for Geo Intelligence)</span>
        </label>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative mb-3">
          <input 
            type="text" 
            value={address} 
            onChange={e => setAddress(e.target.value)}
            placeholder="Search address, landmark, or pincode..." 
            className="input text-xs py-2.5 pr-10 bg-[var(--canvas)] focus:border-[var(--primary)]" 
            style={{ paddingLeft: '36px' }}
          />
          <svg className="w-4 h-4 text-[var(--muted-soft)] absolute left-3 top-[11px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <button 
            type="submit" 
            disabled={isSearching}
            className="absolute right-1 top-1 bottom-1 px-2.5 bg-[var(--primary)] text-white text-[10px] font-bold rounded flex items-center hover:bg-[var(--primary-active)] transition-colors disabled:opacity-50"
          >
            {isSearching ? '...' : 'FIND'}
          </button>
        </form>

        <p className="text-[10px] text-[var(--muted-soft)] mb-2 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Drag the pin to adjust location precisely
        </p>

        <div className="mt-1">
          <LocationPickerMap
            lat={Number.isFinite(latNum) ? latNum : 18.5204}
            lon={Number.isFinite(lonNum) ? lonNum : 73.8567}
            onSelect={(newLat, newLon, newAddress) => {
              setLat(newLat.toFixed(6))
              setLon(newLon.toFixed(6))
              if (newAddress) setAddress(newAddress)
            }}
          />
        </div>
      </div>

      {/* Bank Statement */}
      <div className="border-t border-[var(--hairline)] pt-4">
        <label className="text-xs font-bold text-slate-300 block mb-2">
          Bank Statement <span className="text-slate-600 font-normal">(Optional PDF)</span>
        </label>
        <div
          onClick={() => bankRef.current?.click()}
          className={`upload-zone p-3.5 flex items-center gap-3 ${bankStatement ? 'border-teal-500/30 bg-teal-500/[0.04]' : ''}`}
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bankStatement ? 'bg-teal-500/15 border border-teal-500/25' : 'bg-white/[0.04] border border-white/[0.08]'}`}>
            <svg className={`w-4 h-4 ${bankStatement ? 'text-teal-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold truncate ${bankStatement ? 'text-teal-300' : 'text-slate-500'}`}>
              {bankStatement ? bankStatement.name : 'Click to upload PDF'}
            </p>
            {bankStatement && <p className="text-[10px] text-slate-600">{(bankStatement.size / 1024).toFixed(0)} KB</p>}
          </div>
          {bankStatement && (
            <button onClick={e => { e.stopPropagation(); setBankStatement(null) }} className="text-slate-600 hover:text-red-400 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <input ref={bankRef} type="file" accept="application/pdf" onChange={e => setBankStatement(e.target.files?.[0] || null)} className="hidden" />
      </div>

      {/* Supplier Bill */}
      <div>
        <label className="text-xs font-bold text-slate-300 block mb-2">
          Supplier Bill <span className="text-slate-600 font-normal">(Optional Image)</span>
        </label>
        <div
          onClick={() => billRef.current?.click()}
          className={`upload-zone overflow-hidden ${supplierBill ? 'border-teal-500/30' : ''}`}
        >
          {supplierBill?.preview ? (
            <div className="relative">
              <img src={supplierBill.preview} alt="Supplier Bill" className="w-full h-28 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                <p className="text-[10px] text-white font-medium truncate">{supplierBill.file.name}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center">
              <svg className="mx-auto w-7 h-7 text-slate-600 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-xs text-slate-500 font-medium">Click to upload bill image</p>
            </div>
          )}
        </div>
        <input ref={billRef} type="file" accept="image/jpeg,image/jpg,image/png" onChange={e => {
          const f = e.target.files?.[0]
          if (f) setSupplierBill({ file: f, preview: URL.createObjectURL(f) })
        }} className="hidden" />
      </div>

      {/* Optional Shop Video */}
      <div>
        <label className="text-xs font-bold text-slate-300 block mb-2">
          1-minute Shop Video <span className="text-slate-600 font-normal">(Optional)</span>
        </label>
        <div
          onClick={() => videoRef.current?.click()}
          className={`upload-zone p-3.5 flex items-center gap-3 ${shopVideo ? 'border-teal-500/30 bg-teal-500/[0.04]' : ''}`}
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${shopVideo ? 'bg-teal-500/15 border border-teal-500/25' : 'bg-white/[0.04] border border-white/[0.08]'}`}>
            <svg className={`w-4 h-4 ${shopVideo ? 'text-teal-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14m-6 5h4a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold truncate ${shopVideo ? 'text-teal-300' : 'text-slate-500'}`}>
              {shopVideo ? shopVideo.name : 'Upload'}
            </p>
            <p className="text-[10px] text-slate-600">200MB per file - MP4, MOV, AVI, MKV</p>
          </div>
          {shopVideo && (
            <button onClick={e => { e.stopPropagation(); setShopVideo(null) }} className="text-slate-600 hover:text-red-400 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <input
          ref={videoRef}
          type="file"
          accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,.mp4,.mov,.avi,.mkv"
          onChange={e => setShopVideo(e.target.files?.[0] || null)}
          className="hidden"
        />
      </div>

      {/* Working capital inputs */}
      <div className="border-t border-[var(--hairline)] pt-4">
        <h4 className="text-lg font-bold text-[var(--ink)] mb-3">Working Capital (CCC)</h4>
        {[
          { label: 'Inventory Days', value: inventoryDays, setValue: setInventoryDays },
          { label: 'Receivable Days', value: receivableDays, setValue: setReceivableDays },
          { label: 'Payable Days', value: payableDays, setValue: setPayableDays },
        ].map((item) => (
          <div key={item.label} className="mb-3">
            <p className="text-xs font-bold text-[var(--muted)] mb-2">{item.label}</p>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-[var(--surface)] border border-[var(--hairline-strong)] px-3 py-2 shadow-sm">
              <span className="text-[28px] text-[var(--ink)] mono leading-none font-bold">{item.value.toFixed(2)}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => item.setValue(Math.max(0, item.value - 1))}
                  className="w-7 h-7 rounded-md bg-[var(--canvas-soft)] border border-[var(--hairline-strong)] text-[var(--ink)] hover:bg-[var(--hairline)] flex items-center justify-center font-bold text-lg"
                >
                  −
                </button>
                <button
                  onClick={() => item.setValue(item.value + 1)}
                  className="w-7 h-7 rounded-md bg-[var(--canvas-soft)] border border-[var(--hairline-strong)] text-[var(--ink)] hover:bg-[var(--hairline)] flex items-center justify-center font-bold text-lg"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fraud summary badges */}
      {showFraudSummary && (
        <div className="space-y-2">
          {duplicateDetected ? (
            <div className="rounded-xl border border-[var(--semantic-error)] px-4 py-3 text-[var(--semantic-error)] text-sm font-bold" style={{ backgroundColor: 'rgba(207,45,86,0.06)' }}>
              Critical Fraud Flag: duplicate_evidence_detected
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--semantic-success)] px-4 py-3 text-[var(--semantic-success)] text-sm font-bold" style={{ backgroundColor: 'rgba(31,138,101,0.06)' }}>
              No duplicate evidence found.
            </div>
          )}
          {hasMetadataWarning && (
            <div className="rounded-xl border border-[#9a6c20] px-4 py-3 text-[#9a6c20] text-sm font-bold" style={{ backgroundColor: 'rgba(192,133,50,0.07)' }}>
              Warning Flag: metadata_stripped_suspicious
            </div>
          )}
        </div>
      )}

    </div>
  )
}
