# KiranaFlow AI - Component Showcase

Visual guide to all frontend components and their features.

## 🎨 Component Overview

### 1. UploadPanel Component
**Location**: `components/UploadPanel.tsx`

**Features**:
- ✅ Store Photos Upload (3-5 images)
  - Click-to-upload interface
  - Grid preview with thumbnails
  - Remove button on hover
  - File name display
  - Upload count indicator
  
- ✅ Bank Statement Upload (PDF)
  - Single file upload
  - PDF icon display
  - File name display
  
- ✅ Supplier Bill Upload (Image)
  - Single image upload
  - Image preview
  - File name display
  
- ✅ GPS Coordinates (Optional)
  - Latitude input field
  - Longitude input field
  - Number validation

**Props**:
```typescript
{
  storePhotos: UploadedFile[]
  setStorePhotos: (photos: UploadedFile[]) => void
  bankStatement: File | null
  setBankStatement: (file: File | null) => void
  supplierBill: UploadedFile | null
  setSupplierBill: (file: UploadedFile | null) => void
  lat: string
  setLat: (lat: string) => void
  lon: string
  setLon: (lon: string) => void
}
```

---

### 2. MetricsCards Component
**Location**: `components/MetricsCards.tsx`

**Features**:
- ✅ 4 Metric Cards in Grid Layout
  1. **Monthly Revenue** (Blue)
     - Currency icon
     - Formatted value (₹1.85L)
  
  2. **Net Cash Flow** (Green)
     - Trending up icon
     - Formatted value (₹24K)
  
  3. **Safe Loan Band** (Purple)
     - Shield icon
     - Band range (₹1.5L - ₹2L)
  
  4. **Confidence Score** (Dynamic Color)
     - Bar chart icon
     - Percentage (81%)
     - Color: Green (≥80%), Yellow (≥60%), Red (<60%)

**Props**:
```typescript
{
  monthlyRevenue: number
  netCashFlow: number
  safeLoanBand: string
  confidenceScore: number
}
```

**Responsive**:
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 4 columns

---

### 3. AssessmentBanner Component
**Location**: `components/AssessmentBanner.tsx`

**Features**:
- ✅ Dynamic Status Display
  - **APPROVED** (Green) - Low risk, confidence ≥70%
  - **REVIEW REQUIRED** (Yellow) - Medium risk
  - **HIGH RISK** (Red) - High risk, confidence <50%

- ✅ Status Information
  - Large status icon
  - Status text
  - Descriptive message
  - 3-column metrics grid:
    - Recommended Loan Band
    - Confidence Level
    - Risk Category

**Props**:
```typescript
{
  confidenceScore: number
  fraudFlags: string[]
  safeLoanBand: string
  monthlyRevenue: number
  netCashFlow: number
}
```

**Logic**:
- Analyzes confidence score
- Checks fraud flags for critical issues
- Determines risk level (low/medium/high)
- Selects appropriate color scheme

---

### 4. FraudFlags Component
**Location**: `components/FraudFlags.tsx`

**Features**:
- ✅ Location Information Card (Blue)
  - Location Tier (Excellent/Good/Average/Below Average)
  - Geo Multiplier (0.9x - 1.2x)

- ✅ Fraud Detection Results
  - List of fraud flags
  - Color-coded indicators:
    - Green: No issues
    - Yellow: Warnings
  - Icon for each flag
  - Clear messaging

**Props**:
```typescript
{
  flags: string[]
  locationTier: string
  geoMultiplier: number
}
```

**Display Logic**:
- Empty flags → "No fraud indicators detected" (green)
- Has flags → Individual flag items (yellow/green)

---

### 5. ExplainabilityChart Component
**Location**: `components/ExplainabilityChart.tsx`

**Features**:
- ✅ Horizontal Bar Chart (Recharts)
  - Feature names on Y-axis
  - Contribution values on X-axis
  - Color-coded bars:
    - Green: High positive (>20%)
    - Blue: Positive (>0%)
    - Red: Negative (<0%)
  - Percentage labels
  - Tooltip on hover

- ✅ Vision Features Summary Grid
  - Products Detected
  - Shelf Density (%)
  - Avg per Image
  - Images Analyzed

**Props**:
```typescript
{
  contributions: ShapContribution[]
  visionFeatures: {
    total_products_detected: number
    overall_shelf_density_index: number
    avg_detections_per_image: number
    image_count: number
  }
}
```

**Chart Configuration**:
- Responsive container
- 300px height
- Left margin: 100px (for labels)
- Grid lines
- Formatted tooltips

---

### 6. JsonViewer Component
**Location**: `components/JsonViewer.tsx`

**Features**:
- ✅ Collapsible Panel
  - Click to expand/collapse
  - Smooth animation
  - Chevron icon rotation

- ✅ JSON Display
  - Syntax highlighting
  - Formatted with 2-space indent
  - Scrollable container
  - Monospace font
  - Gray background

**Props**:
```typescript
{
  data: PredictionResponse
}
```

**States**:
- Collapsed: Shows header only
- Expanded: Shows formatted JSON

---

## 🎯 Page Layout (app/page.tsx)

### Structure:
```
┌─────────────────────────────────────┐
│ Header (White, Fixed)               │
│ - Title: KiranaFlow AI              │
│ - Subtitle                          │
│ - API Status Indicator              │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Upload Panel                        │
│ - Store Photos (3-5)                │
│ - Bank Statement (PDF)              │
│ - Supplier Bill (Image)             │
│ - GPS Coordinates (Optional)        │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Action Buttons                      │
│ [Reset]              [Analyze Store]│
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Error Display (if error)            │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Results Section (if success)        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Assessment Banner               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌───┬───┬───┬───┐                  │
│ │ M │ N │ S │ C │  Metrics Cards   │
│ │ R │ C │ L │ S │                  │
│ └───┴───┴───┴───┘                  │
│                                     │
│ ┌─────────────┬─────────────────┐  │
│ │ Fraud Flags │ Explainability  │  │
│ │             │ Chart           │  │
│ └─────────────┴─────────────────┘  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ JSON Viewer (Collapsible)       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Success Footer                  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Footer (White, Fixed)               │
│ - Copyright / Credits               │
└─────────────────────────────────────┘
```

---

## 🎨 Color Scheme

### Primary Colors:
- **Blue**: `#3b82f6` - Primary actions, revenue
- **Green**: `#10b981` - Success, cash flow, approved
- **Yellow**: `#f59e0b` - Warnings, review required
- **Red**: `#ef4444` - Errors, high risk
- **Purple**: `#8b5cf6` - Loan band, special metrics

### Background Colors:
- **Page**: Gradient `from-blue-50 via-white to-purple-50`
- **Cards**: White `#ffffff`
- **Hover**: Gray-50 `#f9fafb`

### Text Colors:
- **Primary**: Gray-900 `#111827`
- **Secondary**: Gray-600 `#4b5563`
- **Muted**: Gray-500 `#6b7280`

---

## 📱 Responsive Breakpoints

### Tailwind Breakpoints:
- **sm**: 640px (Mobile landscape)
- **md**: 768px (Tablet)
- **lg**: 1024px (Desktop)
- **xl**: 1280px (Large desktop)

### Component Behavior:
- **MetricsCards**: 1 → 2 → 4 columns
- **Two-column layout**: 1 → 2 columns
- **Upload grid**: 2 → 3 → 5 columns
- **Padding**: Responsive px-4 → px-6 → px-8

---

## 🔄 State Management

### Upload State:
```typescript
const [storePhotos, setStorePhotos] = useState<UploadedFile[]>([])
const [bankStatement, setBankStatement] = useState<File | null>(null)
const [supplierBill, setSupplierBill] = useState<UploadedFile | null>(null)
const [lat, setLat] = useState<string>('')
const [lon, setLon] = useState<string>('')
```

### UI State:
```typescript
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
const [result, setResult] = useState<PredictionResponse | null>(null)
```

### State Flow:
1. **Initial**: Empty state, show upload panel
2. **Uploading**: Files added, previews shown
3. **Validating**: Check file counts and types
4. **Loading**: Show spinner, disable buttons
5. **Success**: Display results, enable reset
6. **Error**: Show error message, enable retry

---

## ✨ Animations & Transitions

### Hover Effects:
- Upload panels: Border color change + background
- Buttons: Background color + shadow
- Cards: Subtle shadow increase
- Remove buttons: Opacity fade-in

### Loading States:
- Spinner: Rotate animation
- Pulse: API status indicator
- Smooth scroll: Results appear

### Transitions:
- All: `transition-colors` (200ms)
- Chevron: `transform rotate-180`
- Opacity: `opacity-0` → `opacity-100`

---

## 🧪 Testing Checklist

### Upload Panel:
- [ ] Can upload 3-5 store photos
- [ ] Can remove individual photos
- [ ] Shows image previews
- [ ] Validates file types
- [ ] Shows file names
- [ ] Accepts PDF for bank statement
- [ ] Accepts JPG/PNG for supplier bill
- [ ] GPS coordinates are optional

### Validation:
- [ ] Error if < 3 photos
- [ ] Error if > 5 photos
- [ ] Error if no bank statement
- [ ] Error if no supplier bill
- [ ] Error if wrong file types
- [ ] Clear error messages

### Results Display:
- [ ] Assessment banner shows correct status
- [ ] Metrics cards display formatted values
- [ ] Fraud flags show all items
- [ ] Chart renders correctly
- [ ] Vision summary shows all metrics
- [ ] JSON viewer is collapsible
- [ ] Smooth scroll to results

### Responsive:
- [ ] Works on mobile (320px+)
- [ ] Works on tablet (768px+)
- [ ] Works on desktop (1024px+)
- [ ] Grid layouts adjust properly
- [ ] Text is readable at all sizes

---

## 🎯 Key Features Summary

✅ **Professional UI** - Looks like real fintech product
✅ **Complete Flow** - Upload → Validate → Process → Display
✅ **Error Handling** - Clear messages, retry options
✅ **Loading States** - Spinner, disabled buttons
✅ **Responsive** - Mobile-first design
✅ **Type-Safe** - TypeScript throughout
✅ **Reusable** - Modular components
✅ **Accessible** - Semantic HTML, ARIA labels
✅ **Performant** - Optimized images, lazy loading
✅ **Polished** - Smooth animations, professional styling

---

## 📚 Component Dependencies

```
page.tsx
├── UploadPanel
├── MetricsCards
├── AssessmentBanner
├── FraudFlags
├── ExplainabilityChart
│   └── Recharts (BarChart, Bar, XAxis, YAxis, etc.)
└── JsonViewer

lib/api.ts
└── submitPrediction()

lib/utils.ts
├── formatCurrency()
├── formatPercentage()
├── getConfidenceColor()
├── getRiskLevel()
└── validateFiles()

types/index.ts
├── PredictionResponse
├── VisionFeatures
├── ShapContribution
├── RawMetadata
└── UploadedFile
```

---

This is a **complete, production-ready frontend** with professional UI/UX! 🚀
