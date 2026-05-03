# KiranaFlow AI: Underwriting Intelligence

KiranaFlow AI is an advanced, computer-vision driven underwriting workstation designed to assess the financial health of Kirana stores (micro-retailers) with zero traditional data. By analyzing store imagery and geo-location signals, it predicts monthly revenue, calculates safe loan bands, and flags fraudulent applications.

## 🚀 Key Features

- **Vision Intelligence**: Uses YOLO object detection to quantify shelf density, SKU diversity, and inventory proxies directly from store photos.
- **Geo-Intelligence**: Leverages OpenStreetMap (OSM) to assess location tiers, local competition density, and economic multipliers based on the store's GPS coordinates.
- **Cross-Signal Fraud Detection**: Automatically flags visual contradictions (e.g., claiming 30 days of inventory but showing empty shelves), suspicious EXIF metadata, and address mismatches.
- **Machine Learning Fusion Engine**: A trained `scikit-learn` model (`kirana_model.pkl`) fuses vision, geo, and operational signals to predict highly accurate revenue ranges and CCC (Cash Conversion Cycle) tiers.
- **Explainability**: SHAP value charts clearly show credit officers *why* a decision was made.

## 🛠 Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, Recharts, Leaflet.
- **Backend**: FastAPI, Ultralytics YOLOv8, Scikit-Learn, ReportLab (for PDF generation), OSMnx.

---

## 📦 Deployment Guide

This project is structured as a monorepo. The frontend should be deployed on **Vercel**, and the backend on **Render**.

### 1. Deploying the Backend (Render)

1. Create a new **Web Service** on Render and connect this repository.
2. Set the Root Directory to `backend`.
3. **Environment**: `Python 3.x`
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `uvicorn api:app --host 0.0.0.0 --port $PORT`
6. **Environment Variables**:
   - (No strict API keys are required for the base app, but you can set `YOLO_MODEL_PATH=models/best.pt` if you customize weights).

*Note: The backend relies on `kirana_model.pkl` and `best.pt` inside `backend/models/`. These must be tracked in Git for Render to build successfully.*

### 2. Deploying the Frontend (Vercel)

1. Import the repository into **Vercel**.
2. Set the **Root Directory** to `frontend`.
3. Vercel will automatically detect the **Next.js** framework.
4. Add the following **Environment Variable**:
   - `NEXT_PUBLIC_API_URL`: Set this to the live URL of your Render backend (e.g., `https://kiranaflow-api.onrender.com`).
5. Click **Deploy**.

---

## 💻 Local Development

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
uvicorn api:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
# Ensure NEXT_PUBLIC_API_URL=http://localhost:8000 in .env.local
npm run dev
```

## 🏆 Hackathon Notes
This project was built to revolutionize micro-SME lending by turning unstructured data (images and location) into structured underwriting logic.
