# KiranaFlow AI - Frontend

Professional Next.js 14+ frontend for AI-powered Kirana store underwriting.

## Features

✅ **Complete Upload Flow**
- 3-5 store photos with image previews
- Bank statement PDF upload
- Supplier bill image upload
- Optional GPS coordinates

✅ **Professional UI Components**
- MetricsCards - Key financial metrics display
- AssessmentBanner - Final decision with risk level
- FraudFlags - Risk assessment and fraud detection
- ExplainabilityChart - SHAP-style feature contributions
- JsonViewer - Collapsible raw JSON debug panel

✅ **Validation & Error Handling**
- Client-side file validation
- Loading states with spinner
- Error messages with retry
- Success states with smooth scrolling

✅ **Responsive Design**
- Mobile-first approach
- Tailwind CSS styling
- Professional fintech aesthetic
- Smooth animations and transitions

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **API**: Fetch API with FormData

## Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with fonts
│   ├── page.tsx            # Main page with upload & results
│   └── globals.css         # Global styles
├── components/
│   ├── UploadPanel.tsx     # File upload interface
│   ├── MetricsCards.tsx    # Top 4 metric cards
│   ├── AssessmentBanner.tsx # Final decision banner
│   ├── FraudFlags.tsx      # Risk assessment display
│   ├── ExplainabilityChart.tsx # SHAP contributions chart
│   └── JsonViewer.tsx      # Collapsible JSON viewer
├── lib/
│   ├── api.ts              # API client functions
│   └── utils.ts            # Utility functions
└── types/
    └── index.ts            # TypeScript interfaces
```

## API Integration

The frontend expects this response from `POST /predict`:

```typescript
{
  monthly_revenue: number
  net_cash_flow: number
  safe_loan_band: string
  confidence_score: number
  location_tier: string
  geo_multiplier: number
  fraud_flags: string[]
  vision_features: {
    total_products_detected: number
    total_bbox_area: number
    total_image_area: number
    overall_shelf_density_index: number
    avg_detections_per_image: number
    image_count: number
  }
  shap_contributions: Array<{
    feature: string
    value: number
  }>
  raw_metadata: {
    mode: string
    lat: number | null
    lon: number | null
    processed_images: number
  }
}
```

## Usage

1. Upload 3-5 store photos
2. Upload bank statement PDF
3. Upload supplier bill image
4. (Optional) Enter GPS coordinates
5. Click "Analyze Store"
6. View comprehensive underwriting results

## Components

### MetricsCards
Displays 4 key metrics in colored cards:
- Monthly Revenue (blue)
- Net Cash Flow (green)
- Safe Loan Band (purple)
- Confidence Score (dynamic color)

### AssessmentBanner
Shows final decision with:
- APPROVED (green) - Low risk, high confidence
- REVIEW REQUIRED (yellow) - Medium risk
- HIGH RISK (red) - Requires verification

### FraudFlags
Displays:
- Location tier and geo multiplier
- Fraud detection results
- Risk indicators

### ExplainabilityChart
- Horizontal bar chart of SHAP contributions
- Vision features summary grid
- Color-coded positive/negative impacts

### JsonViewer
- Collapsible raw JSON response
- Syntax-highlighted display
- Debug information

## Styling

Uses Tailwind CSS with:
- Professional color palette
- Smooth transitions
- Responsive grid layouts
- Shadow and border utilities
- Custom gradient backgrounds

## Validation

Client-side validation ensures:
- 3-5 store photos (JPG/PNG)
- 1 bank statement (PDF)
- 1 supplier bill (JPG/PNG)
- Valid file types
- Proper error messages

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Production Ready

✅ TypeScript for type safety
✅ Error boundaries
✅ Loading states
✅ Responsive design
✅ Accessibility features
✅ Clean code structure
✅ Reusable components
✅ Professional UI/UX
