/**
 * KiranaFlow AI — API utilities
 */

import { PredictionResponse, HealthStatus } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function submitPrediction(
  storePhotos: File[],
  bankStatement: File | null,
  supplierBill: File | null,
  shopVideo?: File | null,
  lat?: number,
  lon?: number,
  inventoryDays?: number,
  receivableDays?: number,
  payableDays?: number
): Promise<PredictionResponse> {
  const formData = new FormData()

  storePhotos.forEach((photo) => {
    formData.append('store_photos', photo)
  })

  if (bankStatement) {
    formData.append('bank_statement', bankStatement)
  }
  if (supplierBill) {
    formData.append('supplier_bill', supplierBill)
  }
  if (shopVideo) {
    formData.append('shop_video', shopVideo)
  }

  if (lat !== undefined && lat !== null && !isNaN(lat)) {
    formData.append('lat', lat.toString())
  }
  if (lon !== undefined && lon !== null && !isNaN(lon)) {
    formData.append('lon', lon.toString())
  }
  if (inventoryDays !== undefined && !isNaN(inventoryDays)) {
    formData.append('inventory_days', inventoryDays.toString())
  }
  if (receivableDays !== undefined && !isNaN(receivableDays)) {
    formData.append('receivable_days', receivableDays.toString())
  }
  if (payableDays !== undefined && !isNaN(payableDays)) {
    formData.append('payable_days', payableDays.toString())
  }

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    const detailString = Array.isArray(error.detail) 
      ? error.detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join(', ')
      : error.detail
    throw new Error(detailString || `HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

export async function checkHealth(): Promise<HealthStatus> {
  const response = await fetch(`${API_BASE_URL}/health`)
  if (!response.ok) throw new Error('Health check failed')
  return response.json()
}

export async function downloadReport(predictionData: PredictionResponse): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/generate_report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(predictionData),
  })

  if (!response.ok) {
    throw new Error(`Failed to generate report: ${response.statusText}`)
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'KiranaFlow_Report.pdf'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
