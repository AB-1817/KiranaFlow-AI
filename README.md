<div align="center">

<img src="https://img.shields.io/badge/TenzorX_2026-National_AI_Hackathon-orange?style=for-the-badge" />
<img src="https://img.shields.io/badge/Problem_Statement-4c_Remote_Cash_Flow_Underwriting-blue?style=for-the-badge" />
<img src="https://img.shields.io/badge/Sponsor-Poonawalla_Fincorp-green?style=for-the-badge" />

# KiranaFlow AI
### *A Credit Bureau for the Physical World*

> Replacing a 9-day, Rs.2,000 field-officer process with a **10-second AI pipeline** that fuses vision, geography, payment behavior, and economic reasoning — without requiring a single bank statement.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-nano-purple?style=flat-square)](https://ultralytics.com)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.3-F7931E?style=flat-square&logo=scikit-learn)](https://scikit-learn.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

### [Live Demo -> kirana-flow-ai-vbor.vercel.app](https://kirana-flow-ai-vbor.vercel.app/)

</div>

---

## Table of Contents

- [The Problem](#-the-problem)
- [Our Approach](#-our-approach)
- [Core Innovations](#-core-innovations)
- [System Architecture](#-system-architecture)
- [Intelligence Pillars](#-intelligence-pillars)
- [The 14-Feature Fusion Engine](#-the-14-feature-fusion-engine)
- [Fraud Detection](#-fraud-detection)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Local Development](#-local-development)
- [Deployment](#-deployment)
- [Team](#-team)

---

## The Problem

India has **13M+ Kirana stores** serving hundreds of millions of customers daily, with average transactions of Rs.50-Rs.200 and daily sales of Rs.5,000-Rs.80,000. This represents a **4–6 lakh crore untapped credit market** — yet ~85% of these stores have never received formal bank credit.

**The bottleneck is not credit risk. It is underwriting.**

Current underwriting is broken across four dimensions:

| Failure | Reality |
|---|---|
| **Subjectivity** | Different officers assess the same store with ±40% variation |
| **High Cost** | Each field visit costs Rs.800-Rs.2,000, making sub-1L loans unprofitable |
| **Slow Turnaround** | Manual process takes 7–14 days; borrowers shift to moneylenders |
| **Not Scalable** | Growth requires hiring more officers; capacity capped at ~8–12 cases/day |

> *"The problem isn't that Kirana owners don't pay back loans — they are reliable. The problem is that we don't have a digital thermometer to measure how healthy their business is."*

---

## Our Approach

### Core Insight

Cash flow is not random. It is the **direct result of observable business conditions** that leave measurable physical traces:

- **Inventory** reflects working capital deployed  defines sales capacity
- **Location** reflects demand potential  determines revenue ceiling
- **Store quality** reflects owner commitment  predicts repayment reliability

We decompose underwriting into **interpretable subproblems**, each with economic grounding:

```
Daily Sales = Supply Signal × Demand Factor × Location Multiplier × Seasonality
```

Every intermediate output is **auditable by a credit officer** — no black boxes.

### Why Not a Simple CNN?

| Naive CNN Approach | KiranaFlow AI |
|---|---|
| Train end-to-end: image  income label | Decompose into interpretable subproblems with economic grounding |
| Black-box: cannot explain decisions | Every step is transparent and auditable |
| Single-point prediction | Probabilistic range with component-level confidence scores |
| Cannot detect fraud | Explicit adversarial modelling with 10 independent fraud checks |

---

## Core Innovations

### 1. Multi-Signal Revenue Proxy Engine

Eliminates reliance on owner-declared income (typically inflated 30–80%) by triangulating **three independent signals**:

- **UPI Transaction History**  40% weight
- **Distributor Order Frequency** (NinjaCart, JioMart)  40% weight
- **Google Reviews / Search Activity**  20% weight

If all three signals converge  high-confidence estimate. If one diverges  automatic fraud flag.

**Example:** Owner claims Rs.50,000/day. UPI = Rs.42K, Orders = Rs.44K, Google = Rs.41K -> Final: **Rs.43K-Rs.45K/day. Inflated claim rejected.**

---

### 2. Cash Conversion Cycle (CCC) Estimator

Revenue  repayment capacity. A store may sell 50K/day but have zero liquid cash due to supplier payment terms.

```
CCC = Inventory Days + Receivables Days  Payables Days
```

- **Negative CCC**  store collects before paying suppliers  strong liquidity  higher loan band
- **Positive CCC**  cash is trapped in the cycle  loan amount reduced accordingly

**Example:** Store A: CCC = 5.2 days  System approves 4L loan. Store B: CCC = +15 days  System reduces loan to 1L–1.5L.

---

### 3. Location Intelligence Module

Produces a **location multiplier (0.5× to 1.5×)** from four geo-factors:

- Demographics (Census 2011 API)
- Nearby competition density (OSM + Google Places)
- Foot traffic (OSM roads + POI proximity)
- City tier classification (GPS  rule-based tier)

**Example:** Store A near school/office in Pune  Multiplier **1.26×**  Revenue 54K/day. Store B in low-traffic lane, small town  Multiplier **0.75×**  Revenue 32K/day.

---

### 4. Dynamic Confidence Recalibration

The system learns from every loan outcome post-disbursal:

```
Confidence = Initial × 0.40 + EMI_behavior × 0.30 + Variance × 0.15 + Image × 0.15
```

- EMI paid on time + inventory grows  confidence increases to 0.93
- EMI missed  confidence falls to 0.38, early warning alert triggered to NBFC
- Every loan becomes training data for future decisions

---

## System Architecture

```
INPUT LAYER                       PROCESSING                           OUTPUT
──────────                        ──────────                           ──────
3–5 Store Images ─────────────── VISION ENGINE (YOLOv8-nano)    ─── Shelf Density, SKU Count
GPS Coordinates ──────────────── GEO ENGINE (OSMnx)             ─── Location Multiplier
Category Mix ─────────────────── FRAUD ENGINE (10 checks)       ─── Fraud Flag Report
Bills / Receipts (optional) ──── OCR PROCESSOR (Tesseract)      ─── CCC Inputs
                                  │
                                  
                            ECONOMIC FUSION ENGINE
                            ├── Supply × Demand Model
                            ├── CCC Calculation (logicengine.py)
                            ├── Peer Benchmark Validation
                            └── XGBoost Risk Classifier (SHAP)
                                  │
                                  
                            OUTPUT LAYER
                            ├── Daily Sales Range (Low / Mid / High )
                            ├── Monthly Revenue & Net Income Range
                            ├── Loan Eligibility Band (50K – 5L)
                            ├── Confidence Score (0.0 – 1.0)
                            ├── Risk Flags + Audit Trail
                            └── PDF Sanction Report (ReportLab)
```

### Confidence Routing

| Score | Band | Action |
|---|---|---|
| 0.80 – 1.00 | HIGH CONFIDENCE | Auto-Approve |
| 0.65 – 0.79 | GOOD CONFIDENCE | Standard Review |
| 0.45 – 0.64 | MODERATE CONFIDENCE | Spot Verification |
| 0.25 – 0.44 | LOW CONFIDENCE | Full Field Visit |
| 0.00 – 0.24 | VERY LOW CONFIDENCE | Rejected |

---

## Intelligence Pillars

### Vision Intelligence — 7 Supply-Side Features

| Feature | What It Measures | Revenue Link |
|---|---|---|
| **Shelf Density Index (SDI)** | Occupied shelf space / total visible shelf space | Direct proxy for working capital deployed |
| **SKU Diversity Score** | Range of product categories available | 6+ categories  40–60% more revenue than 3-category stores |
| **Inventory Value Approximation** | Detected products × price bands × quantity | Monthly revenue  Inventory Value × (30 ÷ Days-to-Turnover) |
| **Refill Signal** | Depletion patterns showing real customer demand | Staged stores show uniform fullness — a fraud indicator |
| **Infrastructure Quality Score** | Fixtures, lighting, refrigeration, signage quality | Branded displays = independent verification of 15K–50K/month minimum |
| **Visual Store Size Estimate** | Floor area classification from image geometry | Store size is revenue ceiling (cannot generate 50K daily in 100 sq ft) |
| **Category Mix Profile** | Staple / Balanced / FMCG / Specialist composition | Drives margin model applied in income estimation (4–22%) |

### Geo Intelligence — 7 Demand-Side Features

| Feature | What It Measures | Economic Interpretation |
|---|---|---|
| **Catchment Population Density** | Residential buildings in 300–500m radius | Primary determinant of daily customer base |
| **Road Type Classification** | Arterial (2.0×) / Secondary (1.5×) / Lane (0.6×) multiplier | Main road stores get 3–4× more passing traffic |
| **POI Proximity Score** | Distance to offices, transit hubs, schools, markets | Highest weight: offices (0.25), transit hubs (0.25) |
| **Competition Density Score** | Similar kirana stores within 300m radius | 0–2 competitors = strong demand signal; 13+ = severe saturation |
| **Residential vs Commercial Mix** | Land use composition % in catchment | Residential = consistent daily rhythm; Commercial = weekday peak |
| **Location Demand Tier** | Prime / Good / Average / Weak classification | Acts as primary anchor for revenue range and confidence score |
| **Micro-Market Activity Index** | New construction, new retail, infrastructure signals | Used for long-tenure loan recommendations in high-growth areas |

---

## Fraud Detection

KiranaFlow runs **10 independent checks** across every assessment:

| # | Check | Flag Raised |
|---|---|---|
| 1 | Same Shop Check (visual hash comparison) | `store_identity_mismatch` |
| 2 | Same Store Layout Check (shelf arrangement) | `temporal_inconsistency` |
| 3 | Real Photo Check (EXIF metadata analysis) | `internet_image_source` |
| 4 | Real Stock Balance (product vs demand logic) | `unnatural_product_distribution` |
| 5 | Natural Stock Variety (mix plausibility) | `internet_product_distribution` |
| 6 | Same Phone Check (camera fingerprint) | `fake_cosine_similarity_check` |
| 7 | 3D Depth Check (real scene vs flat image) | `fake_depth_destillation` |
| 8 | Image Metadata Patterns (hidden file signals) | `store_identity_mismatch` |
| 9 | Lighting & Time Match (shadow/timestamp consistency) | `temporal_inconsistency` |
| 10 | Human Validation Step (final officer flag) | `fake_story_pattern` |

Additionally: **Cross-Signal Consistency Check** — high SDI in a weak geo-location  automatic `location_visual_mismatch` flag with dynamic confidence reduction.

---

## Tech Stack

### Frontend & Interface
- **Next.js 14** — App router with SSR, 20+ production components
- **Tailwind CSS** — Utility-first responsive styling
- **Recharts** — Revenue trend, portfolio distribution charts
- **React-Leaflet / Leaflet** — Interactive GPS map with catchment radius preview
- **TypeScript** — Full type safety across all components

### Backend & APIs
- **FastAPI** — High-performance async REST API framework
- **Uvicorn** — Production ASGI server
- **Pydantic v2** — Request/response schema validation
- **Python-multipart** — Multi-file upload handling

### Computer Vision
- **Ultralytics YOLOv8-nano** — Fine-tuned object detection for shelf/product recognition
- **OpenCV** — Image preprocessing, adaptive histogram equalization, contour detection
- **Pillow** — Image manipulation and quality assessment
- **ImageHash** — Perceptual hashing for duplicate and internet-sourced image detection

### Machine Learning & AI
- **scikit-learn** — Fusion model (`kirana_model.pkl`) for revenue range prediction
- **XGBoost** — Gradient-boosted risk classifier
- **SHAP** — Explainability values for every credit decision
- **NumPy / Pandas** — Feature engineering pipeline and signal processing

### Geo & Data
- **OSMnx** — OpenStreetMap network analysis, road type classification, POI extraction
- **GeoPy** — Geocoding and coordinate distance utilities
- **OSM Cache** (`osm_cache.py`) — In-house caching layer to avoid redundant OSM API calls
- **Population Data** (`population_data.py`) — Census demographic signal builder

### Output & Reporting
- **ReportLab** — PDF sanction report generation with SHAP charts
- **PyPDF2** — Bank statement parsing for optional enrichment signal

---

## Project Structure

```
KiranaFlow-AI/
├── backend/
│   ├── api.py                  # FastAPI app — all REST endpoints
│   ├── app_config.py           # Environment config and constants
│   ├── vision.py               # YOLOv8 inference + visual feature extraction (7 features)
│   ├── fusion_engine.py        # Economic fusion: supply × demand  revenue range
│   ├── geoutils.py             # OSMnx geo-spatial feature bundle builder (7 features)
│   ├── fraudengine.py          # 10-point fraud detection + perceptual image fingerprinting
│   ├── logicengine.py          # CCC calculation + FOIR-based loan structuring
│   ├── metadata_auditor.py     # EXIF cross-reference + GPS geo-validation
│   ├── ocr_processor.py        # Tesseract OCR for supplier bills and payment receipts
│   ├── osm_cache.py            # OSM API caching layer
│   ├── population_data.py      # Census demographic signal builder
│   ├── pdf_generator.py        # ReportLab PDF sanction report
│   ├── model_utils.py          # Model loading and initialization utilities
│   ├── requirements.txt        # All Python dependencies
│   └── models/
│       ├── best.pt             # Fine-tuned YOLOv8-nano weights (must be in Git)
│       └── kirana_model.pkl    # Trained scikit-learn fusion model (must be in Git)
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx            # Landing page
│   │   ├── layout.tsx          # Root layout + navigation shell
│   │   ├── underwrite/         # 4-step new assessment wizard
│   │   ├── dashboard/          # Results view with SHAP explainability
│   │   ├── portfolio/          # Portfolio monitoring dashboard
│   │   └── audit/              # Full audit trail viewer
│   ├── components/             # 20+ production-grade UI components
│   │   ├── DecisionSummary.tsx       # Approve / Review / Reject decision card
│   │   ├── ExplainabilityChart.tsx   # SHAP value bar chart
│   │   ├── FraudFlags.tsx            # Fraud flag display with severity
│   │   ├── LocationPickerMap.tsx     # Leaflet GPS coordinate picker
│   │   ├── ResultsPanel.tsx          # Revenue range output panel
│   │   ├── ValidationPanel.tsx       # Confidence score breakdown
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts              # Axios client (reads NEXT_PUBLIC_API_URL)
│   │   ├── store.ts            # Global state management
│   │   └── utils.ts            # Shared utility functions
│   └── types/                  # TypeScript type definitions
│
├── render.yaml                 # Render deployment configuration
└── README.md
```

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/AB-1817/KiranaFlow-AI.git
cd KiranaFlow-AI/backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows PowerShell

# Install dependencies
pip install -r requirements.txt

# Start the development server
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: `http://localhost:8000/docs`

> **Note on Tesseract:** OCR is optional. If not installed, the `/bank/parse` endpoint degrades gracefully. Install via `sudo apt install tesseract-ocr` (Linux) or `brew install tesseract` (macOS).

### Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create local environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start development server
npm run dev
```

Frontend live at: `http://localhost:3000`

---

## Deployment

This is a monorepo. Frontend deploys to **Vercel**, backend to **Render**.

### Backend  Render

1. Go to [render.com](https://render.com)  **New Web Service**  Connect `AB-1817/KiranaFlow-AI`
2. Set **Root Directory**: `backend`
3. Set **Runtime**: Python 3.11
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `python api.py`
6. No mandatory environment variables for the base deployment.

> NOTE: **RAM:** The backend loads YOLOv8 + OSMnx + scikit-learn at startup (~400MB+). The **Starter plan ($7/mo)** is strongly recommended. Free tier (512MB) will likely crash on first inference request.

> - **Models must be in Git.** Verify: `git ls-files backend/models/`

### Frontend  Vercel

1. Go to [vercel.com](https://vercel.com)  **New Project**  Import `AB-1817/KiranaFlow-AI`
2. Set **Root Directory**: `frontend`
3. Vercel auto-detects Next.js 14.
4. Add **Environment Variable**:
   ```
   NEXT_PUBLIC_API_URL = https://your-render-service.onrender.com
   ```
5. Click **Deploy**.

---

## Key Metrics

| Metric | Value |
|---|---|
| Addressable Market | 13M+ Kirana stores across India |
| Untapped Credit Gap | 4–6 lakh crore |
| Assessment Time | < 10 seconds (vs 7–14 days manual) |
| Cost per Assessment | Rs.200 (vs Rs.800-Rs.2,000 field visit) |
| Cost Reduction | 90% |
| Fraud Detection Checks | 10 independent signals |
| Vision Features | 7 supply-side signals |
| Geo Features | 7 demand-side signals |
| Loan Band | 50K – 5L (risk-adjusted, FOIR-based) |

---

## Team

**Team Maharudra** — TenzorX 2026, Problem Statement 4c: Remote Cash Flow Underwriting for Kirana Stores

<table>
  <tr>
    <td align="center">
      <b>Akash Bhuyan</b><br/>
      <sub>ML Engineering & Backend Architecture</sub><br/>
      <a href="https://github.com/AB-1817">@AB-1817</a>
    </td>
    <td align="center">
      <b>Rushikesh Kedar</b><br/>
      <sub>Frontend Development & System Design</sub><br/>
      <a href="https://github.com/Rushi9234">@Rushi9234</a>
    </td>
    <td align="center">
      <b>Rahul Atkare</b><br/>
      <sub>Geo Intelligence & Data Engineering</sub><br/>
      <a href="https://github.com/mystio1">@mystio1</a>
    </td>
  </tr>
</table>

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

Built with passion for **TenzorX 2026 — National AI Hackathon**<br/>
Sponsored by **Poonawalla Fincorp Education Loan**

*Transforming physical kirana stores into underwritable credit data.*

</div>
