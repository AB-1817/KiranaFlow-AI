/**
 * Utility functions for KiranaFlow AI
 */

export function formatCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(2)}K`
  }
  return `₹${amount.toLocaleString('en-IN')}`
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function getConfidenceColor(score: number): string {
  if (score >= 0.8) return 'text-green-600'
  if (score >= 0.6) return 'text-yellow-600'
  return 'text-red-600'
}

export function getConfidenceBgColor(score: number): string {
  if (score >= 0.8) return 'bg-green-50 border-green-200'
  if (score >= 0.6) return 'bg-yellow-50 border-yellow-200'
  return 'bg-red-50 border-red-200'
}

export function getRiskLevel(confidenceScore: number, fraudFlags: string[]): 'low' | 'medium' | 'high' {
  const hasCriticalFlags = fraudFlags.some(flag => 
    flag.toLowerCase().includes('fraud') || 
    flag.toLowerCase().includes('suspicious')
  )
  
  if (hasCriticalFlags || confidenceScore < 0.5) return 'high'
  if (confidenceScore < 0.7 || fraudFlags.length > 2) return 'medium'
  return 'low'
}

export function validateFiles(
  storePhotos: File[],
  bankStatement: File | null,
  supplierBill: File | null
): { valid: boolean; error?: string } {
  if (storePhotos.length < 3) {
    return { valid: false, error: 'Please upload at least 3 store photos' }
  }
  if (storePhotos.length > 5) {
    return { valid: false, error: 'Maximum 5 store photos allowed' }
  }
  
  // Validate file types
  const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png']
  for (const photo of storePhotos) {
    if (!validImageTypes.includes(photo.type)) {
      return { valid: false, error: 'Store photos must be JPG or PNG' }
    }
  }
  
  if (bankStatement && bankStatement.type !== 'application/pdf') {
    return { valid: false, error: 'Bank statement must be a PDF file' }
  }
  
  if (supplierBill && !validImageTypes.includes(supplierBill.type)) {
    return { valid: false, error: 'Supplier bill must be JPG or PNG' }
  }
  
  return { valid: true }
}
