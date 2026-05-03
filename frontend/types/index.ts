/**
 * KiranaFlow AI — TypeScript interfaces matching the real backend API schema
 * Backend: api.py — PredictionResponse model
 */

export interface PerImageResult {
  file: string
  detections: number
  shelf_density: number
  confidence_mean: number
  image_width: number
  image_height: number
}

export interface VisionFeatures {
  // Primary signals
  total_product_detections: number
  shelf_density_index: number
  inventory_value_proxy: number
  sku_diversity_proxy: number
  refill_signal_proxy: string
  images_analyzed: number
  demo_mode: boolean
  per_image: PerImageResult[]
  // Legacy compat fields
  total_products_detected: number
  total_bbox_area: number
  total_image_area: number
  overall_shelf_density_index: number
  avg_detections_per_image: number
  image_count: number
}

export interface GeoFeatures {
  location_tier: string
  geo_multiplier: number
  area_type: string
  competition_density: number
  latitude: number | null
  longitude: number | null
}

export interface ShapContribution {
  feature: string
  value: number
}

export interface RiskFlag {
  flag: string
  severity: 'low' | 'medium' | 'high' | 'cleared'
  source: string
}

export interface RawMetadata {
  mode: string
  processed_images: number
  yolo_model: string
  lat: number | null
  lon: number | null
}

export interface PredictionResponse {
  // Core financials
  monthly_revenue: number
  net_cash_flow: number
  daily_sales_range: [number, number]
  monthly_revenue_range: [number, number]
  monthly_income_range: [number, number]
  safe_loan_band: string
  confidence_score: number
  ccc_tier: string
  ccc_value?: number
  session_id?: string
  inventory_days?: number
  receivable_days?: number
  payable_days?: number
  // Geo
  location_tier: string
  geo_multiplier: number
  // Status
  fraud_status: string
  review_route: string
  fraud_flags: string[]
  exif_flags?: string[]
  duplicate_detected?: boolean
  // Structured data
  vision_features: VisionFeatures
  geo_features: GeoFeatures
  shap_contributions: ShapContribution[]
  risk_flags: RiskFlag[]
  raw_metadata: RawMetadata
}

export interface HealthStatus {
  status: string
  yolo_available: boolean
  model_loaded: boolean
  model_path: string | null
  pkl_model_loaded: boolean
  geo_available: boolean
  fraud_available: boolean
  ocr_available: boolean
  auditor_available: boolean
  fusion_available: boolean
  pdf_available: boolean
}

export interface UploadedFile {
  file: File
  preview?: string
}

export interface FlashcardData {
  id: string
  title: string
  category: string
  severity: 'high' | 'medium' | 'low'
  detectedSignal: {
    label: string
    value: string
    imageSrc?: string
  }
  conflictingReality: {
    label: string
    value: string
    imageSrc?: string
  }
  logicBreakdown: string
  proTip: string[]
}

