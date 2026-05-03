/**
 * KiranaFlow AI — Assessment history store (localStorage)
 * Persists real /predict results so Dashboard, Portfolio, Audit show live data.
 */

import { PredictionResponse } from '@/types'

export interface StoredAssessment {
  id: string                  // e.g. KF-2025-0001
  timestamp: string           // ISO string
  result: PredictionResponse
}

export interface AuditEvent {
  timestamp: string
  caseId: string
  event: string
  details: string
  status: 'completed' | 'flagged'
}

const ASSESSMENTS_KEY = 'kf_assessments'
const AUDIT_KEY = 'kf_audit'

function nextCaseId(existing: StoredAssessment[]): string {
  const year = new Date().getFullYear()
  const next = (existing.length + 1).toString().padStart(4, '0')
  return `KF-${year}-${next}`
}

export function loadAssessments(): StoredAssessment[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(ASSESSMENTS_KEY) || '[]')
  } catch { return [] }
}

export function saveAssessment(result: PredictionResponse): StoredAssessment {
  const existing = loadAssessments()
  const entry: StoredAssessment = {
    id: nextCaseId(existing),
    timestamp: new Date().toISOString(),
    result,
  }
  localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify([entry, ...existing]))

  // Write audit events
  const auditEvents = buildAuditEvents(entry.id, result)
  const existingAudit = loadAuditEvents()
  localStorage.setItem(AUDIT_KEY, JSON.stringify([...auditEvents, ...existingAudit]))

  return entry
}

export function loadAuditEvents(): AuditEvent[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]')
  } catch { return [] }
}

export function clearStore() {
  localStorage.removeItem(ASSESSMENTS_KEY)
  localStorage.removeItem(AUDIT_KEY)
}

function ts(offsetSeconds = 0): string {
  const d = new Date(Date.now() - offsetSeconds * 1000)
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

function buildAuditEvents(caseId: string, r: PredictionResponse): AuditEvent[] {
  const vf = r.vision_features
  const events: AuditEvent[] = [
    {
      timestamp: ts(0),
      caseId,
      event: 'Assessment Complete',
      details: `Route: ${r.review_route} · Confidence: ${(r.confidence_score * 100).toFixed(0)}% · Revenue: ₹${(r.monthly_revenue / 1000).toFixed(0)}K`,
      status: r.review_route === 'Flagged' ? 'flagged' : 'completed',
    },
    {
      timestamp: ts(5),
      caseId,
      event: 'Fraud Check Completed',
      details: r.fraud_flags[0] ?? 'No fraud indicators detected',
      status: r.fraud_flags.some(f => !f.toLowerCase().includes('no fraud')) ? 'flagged' : 'completed',
    },
    {
      timestamp: ts(10),
      caseId,
      event: 'Confidence Score Calculated',
      details: `Final confidence: ${(r.confidence_score * 100).toFixed(0)}% · Loan band: ${r.safe_loan_band}`,
      status: 'completed',
    },
    {
      timestamp: ts(15),
      caseId,
      event: 'Geo Multiplier Assigned',
      details: `Location tier: ${r.geo_features.location_tier} · Area: ${r.geo_features.area_type} · Multiplier: ${r.geo_features.geo_multiplier.toFixed(2)}×`,
      status: 'completed',
    },
    {
      timestamp: ts(20),
      caseId,
      event: 'ML Scoring Completed',
      details: `Revenue: ₹${(r.monthly_revenue / 1000).toFixed(0)}K · Cash flow: ₹${(r.net_cash_flow / 1000).toFixed(0)}K`,
      status: 'completed',
    },
    {
      timestamp: ts(28),
      caseId,
      event: 'YOLO Inference Completed',
      details: `${vf.total_product_detections} products detected across ${vf.images_analyzed ?? vf.image_count} images · Shelf density: ${(vf.shelf_density_index * 100).toFixed(1)}%`,
      status: 'completed',
    },
    {
      timestamp: ts(35),
      caseId,
      event: 'Evidence Uploaded',
      details: `${vf.images_analyzed ?? vf.image_count} store photos · Bank statement · Supplier bill`,
      status: 'completed',
    },
  ]
  return events
}
