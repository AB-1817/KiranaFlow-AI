"""
KiranaFlow AI — FastAPI Backend
Remote cash-flow underwriting for Kirana stores via Vision + Geo Intelligence.

Run with:
    uvicorn api:app --reload --host 0.0.0.0 --port 8000

The /predict endpoint drives the frontend Underwriting Workstation.
"""

import os
import uuid
import shutil
import logging
from pathlib import Path
from typing import List, Optional, Any, Dict

import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from PIL import Image
import io

# ── Optional dependencies with graceful fallback ──────────────────────────────
try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PyPDF2 = None
    PDF_AVAILABLE = False

# ── Geo engine (full OSM + census) ───────────────────────────────────────────
try:
    from geoutils import build_geo_feature_bundle, geo_intelligence
    GEO_AVAILABLE = True
except Exception as _e:
    build_geo_feature_bundle = None  # type: ignore
    geo_intelligence = None
    GEO_AVAILABLE = False
    logging.getLogger("kiranaflow.api").warning(f"geoutils unavailable: {_e}")

# ── Fraud engine ──────────────────────────────────────────────────────────────
try:
    from fraudengine import fraud_detector, verify_stock_authenticity, check_for_duplicates, generate_image_fingerprint
    FRAUD_AVAILABLE = True
except Exception as _e:
    fraud_detector = None  # type: ignore
    verify_stock_authenticity = None  # type: ignore
    check_for_duplicates = None  # type: ignore
    generate_image_fingerprint = None  # type: ignore
    FRAUD_AVAILABLE = False
    logging.getLogger("kiranaflow.api").warning(f"fraudengine unavailable: {_e}")

# ── OCR processor ─────────────────────────────────────────────────────────────
try:
    from ocr_processor import process_supplier_bill as _ocr_process_bill
    OCR_AVAILABLE = True
except Exception:
    _ocr_process_bill = None  # type: ignore
    OCR_AVAILABLE = False

# ── Metadata auditor (EXIF GPS) ───────────────────────────────────────────────
try:
    from metadata_auditor import audit_image_batch
    AUDITOR_AVAILABLE = True
except Exception:
    audit_image_batch = None  # type: ignore
    AUDITOR_AVAILABLE = False

# ── Fusion engine (kirana_model.pkl + CCC) ────────────────────────────────────
try:
    from fusion_engine import load_pkl_model, assemble_underwriting_output, assemble_from_heuristics
    FUSION_AVAILABLE = True
except Exception as _e:
    load_pkl_model = None  # type: ignore
    assemble_underwriting_output = None  # type: ignore
    assemble_from_heuristics = None  # type: ignore
    FUSION_AVAILABLE = False
    logging.getLogger("kiranaflow.api").warning(f"fusion_engine unavailable: {_e}")

# ── Vision module (YOLO) ──────────────────────────────────────────────────────
from vision import extract_vision_features, load_model, MODEL_PATH, BACKEND_DIR

# ── Paths ─────────────────────────────────────────────────────────────────────
TEMP_UPLOADS_DIR = BACKEND_DIR / "temp_uploads"
TEMP_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("kiranaflow.api")

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="KiranaFlow AI API",
    version="2.0.0",
    description=(
        "Remote cash-flow underwriting for Kirana stores. "
        "Powered by YOLOv8 computer vision + geo intelligence."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic response models ──────────────────────────────────────────────────

class PerImageResult(BaseModel):
    file: str
    detections: int
    shelf_density: float
    confidence_mean: float
    image_width: int
    image_height: int


class VisionFeatures(BaseModel):
    # Primary underwriting signals
    total_product_detections: int
    shelf_density_index: float
    inventory_value_proxy: int       # ₹ estimate
    sku_diversity_proxy: int
    refill_signal_proxy: str
    images_analyzed: int
    demo_mode: bool
    per_image: List[PerImageResult]

    # Legacy-compatible fields (keeps existing frontend schema working)
    total_products_detected: int
    total_bbox_area: int
    total_image_area: int
    overall_shelf_density_index: float
    avg_detections_per_image: float
    image_count: int


class ShapContribution(BaseModel):
    feature: str
    value: float


class GeoFeatures(BaseModel):
    location_tier: str
    geo_multiplier: float
    area_type: str
    competition_density: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class RiskFlag(BaseModel):
    flag: str
    severity: str     # "low" | "medium" | "high" | "cleared"
    source: str       # e.g. "vision", "geo", "document", "system"


class RawMetadata(BaseModel):
    mode: str
    processed_images: int
    yolo_model: str
    lat: Optional[float] = None
    lon: Optional[float] = None


class PredictionResponse(BaseModel):
    # Core financials
    monthly_revenue: int
    net_cash_flow: int
    daily_sales_range: List[int]
    monthly_revenue_range: List[int]
    monthly_income_range: List[int]
    safe_loan_band: str
    confidence_score: float
    ccc_tier: str                   # e.g. "fast", "healthy", "slow", "N/A"
    ccc_value: float                # raw CCC in days
    
    session_id: Optional[str] = None
    inventory_days: Optional[float] = None
    receivable_days: Optional[float] = None
    payable_days: Optional[float] = None

    # Geo
    location_tier: str
    geo_multiplier: float

    # Status
    fraud_status: str
    review_route: str
    fraud_flags: List[str]          # legacy compat

    # Fraud / EXIF detail
    exif_flags: List[str]           # e.g. ["metadata_stripped_suspicious"]
    duplicate_detected: bool

    # Structured data
    vision_features: VisionFeatures
    geo_features: GeoFeatures
    shap_contributions: List[ShapContribution]
    risk_flags: List[RiskFlag]
    raw_metadata: RawMetadata


# ── Startup event: pre-load YOLO model ───────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    logger.info("KiranaFlow AI backend starting up...")
    logger.info("Skipping eager YOLO loading to prevent Render port scan timeout.")
    # Models will be lazily loaded on the first API request!


# ── Utility functions ─────────────────────────────────────────────────────────

def _save_upload(upload: UploadFile, dest: Path) -> Path:
    """Save an UploadFile to disk synchronously and return the path."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    with dest.open("wb") as f:
        shutil.copyfileobj(upload.file, f)
    return dest


def _get_geo_data(lat: Optional[float], lon: Optional[float], city_name: Optional[str] = None) -> Dict[str, Any]:
    """Return full geo feature bundle using the real geo engine."""
    if GEO_AVAILABLE and build_geo_feature_bundle is not None and lat is not None and lon is not None:
        try:
            bundle = build_geo_feature_bundle(
                lat=lat,
                lon=lon,
                city_name=city_name,
                use_live_osm=True,
                fast_live_mode=True,
                radius=300,
            )
            return bundle
        except Exception as e:
            logger.warning(f"Geo bundle failed: {e}")

    # Fallback: metro bounding-box heuristic
    if lat is not None and lon is not None:
        METRO_BOXES = [
            (28.4, 76.8, 28.9, 77.4, "delhi"),
            (18.9, 72.7, 19.3, 73.0, "mumbai"),
            (12.8, 77.4, 13.1, 77.8, "bangalore"),
            (17.2, 78.2, 17.6, 78.7, "hyderabad"),
            (12.9, 80.1, 13.2, 80.3, "chennai"),
            (18.4, 73.7, 18.7, 74.0, "pune"),
            (22.4, 88.2, 22.7, 88.5, "kolkata"),
        ]
        for min_lat, min_lon, max_lat, max_lon, city in METRO_BOXES:
            if min_lat <= lat <= max_lat and min_lon <= lon <= max_lon:
                return {
                    "location_tier": "high", "location_multiplier": 1.15, "geo_multiplier": 1.15,
                    "area_type": "metro", "population_density": 10000.0,
                    "city_name": city, "demand_score": 0.75,
                }
        return {
            "location_tier": "medium", "location_multiplier": 1.00, "geo_multiplier": 1.00,
            "area_type": "urban", "population_density": 5000.0,
            "city_name": city_name, "demand_score": 0.45,
        }

    return {
        "location_tier": "medium", "location_multiplier": 1.00, "geo_multiplier": 1.00,
        "area_type": "unknown", "population_density": 1000.0,
        "city_name": None, "demand_score": 0.30,
    }


def _get_fraud_flags(vision: Dict, bank_parsed: bool, bill_parsed: bool, inventory_days: Optional[float] = None) -> List[str]:
    """Run fraud checks with fallback."""
    flags = []

    if FRAUD_AVAILABLE and fraud_detector is not None:
        try:
            result = fraud_detector.detect_fraud({
                "vision_features": vision,
                "bank_parsed": bank_parsed,
                "bill_parsed": bill_parsed,
            })
            if result.get("is_suspicious"):
                flags.extend(result.get("flags", []))
        except Exception as e:
            logger.warning(f"Fraud engine failed: {e}")
            flags.append("Fraud check incomplete — manual review recommended")

    # Rule-based cross-checks
    density = vision.get("shelf_density_index", 0)
    detections = vision.get("total_product_detections", 0)

    if density > 0.85:
        flags.append("Unusually high shelf density — possible staging")
    if detections > 500:
        flags.append("Product count outlier — verify store size")
    if density < 0.15 and inventory_days is not None and inventory_days > 15:
        flags.append("Visual Contradiction: Empty shelves but high claimed inventory days")
    if not bank_parsed:
        flags.append("Bank statement parsing incomplete")
    if not bill_parsed:
        flags.append("Supplier bill value unverified")

    return flags if flags else ["No fraud indicators detected"]


def _build_shap_contributions(
    vision: Dict,
    geo_multiplier: float,
    bank_parsed: bool,
    bill_parsed: bool,
    fraud_flags: List[str],
) -> List[Dict[str, Any]]:
    """
    Build interpretable feature contributions for the explainability panel.
    Values are normalised to approx 0–0.4 range (positive) or 0 to -0.1 (penalty).
    """
    density = vision.get("shelf_density_index", 0.2)
    detections = vision.get("total_product_detections", 100)

    shelf_contribution = round(min(density * 1.2, 0.40), 3)
    sku_contribution = round(min((detections / 300) * 0.30, 0.30), 3)
    supplier_contribution = 0.10 if bill_parsed else 0.03
    geo_contribution = round((geo_multiplier - 1.0) * 0.5 + 0.15, 3)
    penalty = round(-0.06 if len([f for f in fraud_flags if "No fraud" not in f]) > 1 else 0.02, 3)

    return [
        {"feature": "Shelf Density", "value": shelf_contribution},
        {"feature": "Product Count / SKU Diversity", "value": sku_contribution},
        {"feature": "Supplier Bill Validation", "value": supplier_contribution},
        {"feature": "Geo Multiplier", "value": geo_contribution},
        {"feature": "Confidence Adjustment", "value": penalty},
    ]


def _derive_financials(
    vision: Dict,
    geo_data: Dict,
    bank_parsed: bool,
    bill_parsed: bool,
    ocr_bill_amount: Optional[float] = None,
    inventory_days: Optional[float] = None,
    receivable_days: Optional[float] = None,
    payable_days: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Derive revenue, cash flow, loan band, and confidence.
    Uses the trained kirana_model.pkl via fusion_engine when available;
    falls back to rule-based heuristics otherwise.
    """
    geo_multiplier = float(geo_data.get("location_multiplier", geo_data.get("geo_multiplier", 1.0)))

    # Try real ML model first
    if FUSION_AVAILABLE and load_pkl_model is not None and assemble_underwriting_output is not None:
        pkl_model = load_pkl_model()
        if pkl_model is not None:
            try:
                result = assemble_underwriting_output(
                    model=pkl_model,
                    category_mix="Balanced",
                    vision_features=vision,
                    geo_features=geo_data,
                    trust_score=1.0,
                    inventory_days=inventory_days,
                    receivable_days=receivable_days,
                    payable_days=payable_days,
                )
                est_revenue = int(result["estimated_revenue"])
                net_income = float(result["net_income"])
                final_loan = float(result["final_loan"])

                # Clamp revenue to realistic range
                est_revenue = max(5_000, min(est_revenue, 600_000))
                net_cash_flow = int(net_income)

                # Depletion penalty for empty shelves (overrides model intercept)
                if vision.get("shelf_density_index", 0) < 0.15:
                    penalty_factor = max(0.1, vision.get("shelf_density_index", 0) * 4)
                    est_revenue = int(est_revenue * penalty_factor)
                    net_cash_flow = int(net_cash_flow * penalty_factor)
                    final_loan = final_loan * penalty_factor

                loan_band = _loan_band_label(final_loan)

                confidence = 0.75
                if vision.get("images_analyzed", 0) >= 4: confidence += 0.06
                if bank_parsed: confidence += 0.06
                if bill_parsed: confidence += 0.05
                if geo_multiplier != 1.0: confidence += 0.04
                if vision.get("shelf_density_index", 0) < 0.15: confidence -= 0.25
                confidence = round(min(confidence, 0.95), 3)

                logger.info(f"Fusion engine: revenue=\u20b9{est_revenue:,} | loan={final_loan:,.0f} | ccc={result['ccc_tier']}")

                return {
                    "monthly_revenue": est_revenue,
                    "net_cash_flow": net_cash_flow,
                    "safe_loan_band": loan_band,
                    "confidence_score": confidence,
                    "model_used": "kirana_model.pkl",
                    "ccc_tier": result.get("ccc_tier", ""),
                }
            except Exception as e:
                logger.warning(f"Fusion engine prediction failed: {e} — falling back to heuristics")

    # Heuristic fallback
    density = vision.get("shelf_density_index", 0.2)
    detections = vision.get("total_product_detections", 100)
    density_lift = 1.0 + density * 2.0
    base_revenue = int(detections * 1_200 * density_lift * geo_multiplier)
    monthly_revenue = max(5_000, min(base_revenue, 600_000))
    cf_rate = 0.10 + (density * 0.08)
    net_cash_flow = int(monthly_revenue * cf_rate)
    loan_proxy = net_cash_flow * 6

    # Depletion penalty for empty shelves
    if density < 0.15:
        penalty_factor = max(0.1, density * 4)
        monthly_revenue = int(monthly_revenue * penalty_factor)
        net_cash_flow = int(net_cash_flow * penalty_factor)
        loan_proxy = loan_proxy * penalty_factor

    loan_band = _loan_band_label(loan_proxy)

    confidence = 0.70
    if vision.get("images_analyzed", 0) >= 4: confidence += 0.06
    if bank_parsed: confidence += 0.06
    if bill_parsed: confidence += 0.05
    if geo_multiplier != 1.0: confidence += 0.04
    if vision.get("shelf_density_index", 0) < 0.15: confidence -= 0.25
    confidence = round(min(confidence, 0.95), 3)

    return {
        "monthly_revenue": monthly_revenue,
        "net_cash_flow": net_cash_flow,
        "safe_loan_band": loan_band,
        "confidence_score": confidence,
        "model_used": "heuristic",
        "ccc_tier": "N/A",
    }


def _loan_band_label(amount: float) -> str:
    """Convert a loan amount to a display band string."""
    if amount < 15_000:   return "INELIGIBLE"
    if amount < 50_000:   return "\u20b925K – \u20b950K"
    if amount < 100_000:  return "\u20b950K – \u20b91L"
    if amount < 200_000:  return "\u20b91L – \u20b92L"
    if amount < 300_000:  return "\u20b92L – \u20b93L"
    if amount < 500_000:  return "\u20b93L – \u20b95L"
    if amount < 800_000:  return "\u20b95L – \u20b98L"
    return "\u20b98L – \u20b915L"


def _build_risk_flags(
    fraud_flags: List[str],
    geo_data: Dict,
    vision: Dict,
    confidence: float,
) -> List[Dict[str, Any]]:
    """Build structured risk flag objects for the frontend ValidationPanel."""
    flags = []
    density = vision.get("shelf_density_index", 0)
    geo_mult = geo_data.get("geo_multiplier", 1.0)
    detections = vision.get("total_product_detections", 0)

    # Address / document
    has_fraud_doc = any("address" in f.lower() for f in fraud_flags)
    flags.append({
        "flag": "Address Mismatch",
        "severity": "high" if has_fraud_doc else "cleared",
        "source": "document",
    })

    # Inventory staging
    staging = density > 0.75 and geo_mult < 1.0
    flags.append({
        "flag": "Inventory Staging Mismatch",
        "severity": "medium" if staging else "cleared",
        "source": "vision",
    })

    # Vision vs geo alignment
    geo_vision_mismatch = detections > 200 and geo_mult < 1.0
    flags.append({
        "flag": "Vision vs Geo Mismatch",
        "severity": "low" if geo_vision_mismatch else "cleared",
        "source": "vision",
    })

    # Entity conflict
    has_entity = any("duplicate" in f.lower() or "conflict" in f.lower() for f in fraud_flags)
    flags.append({
        "flag": "Entity Conflict",
        "severity": "high" if has_entity else "cleared",
        "source": "system",
    })

    # Confidence penalty
    flags.append({
        "flag": "Confidence Penalty",
        "severity": "medium" if confidence < 0.70 else ("low" if confidence < 0.80 else "cleared"),
        "source": "model",
    })

    return flags


def _process_bank_statement(pdf_path: str) -> Dict[str, Any]:
    """Parse bank statement PDF — returns parsed=True only with real data."""
    try:
        if not PDF_AVAILABLE or PyPDF2 is None:
            raise ImportError("PyPDF2 unavailable")
        with open(pdf_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            text = "".join(p.extract_text() or "" for p in reader.pages)
            return {
                "pages": len(reader.pages),
                "estimated_transactions": len(text.split("\n")) // 3,
                "text_length": len(text),
                "parsed": True,
            }
    except Exception as e:
        logger.warning(f"Bank statement parse failed: {e}")
        return {"pages": 1, "estimated_transactions": 50, "text_length": 0, "parsed": False}


def _process_supplier_bill(image_path: str) -> Dict[str, Any]:
    """Basic supplier bill image check."""
    try:
        with Image.open(image_path) as img:
            return {"width": img.width, "height": img.height, "format": img.format, "parsed": True}
    except Exception as e:
        logger.warning(f"Supplier bill parse failed: {e}")
        return {"width": 0, "height": 0, "format": "UNKNOWN", "parsed": False}


# ── API Endpoints ─────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "service": "KiranaFlow AI API",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs",
    }


from fastapi.responses import StreamingResponse

@app.post("/generate_report")
async def generate_report(data: PredictionResponse):
    """Generate a high-fidelity PDF report from the prediction response."""
    try:
        from pdf_generator import generate_sanction_report
        storefront_image_path = None
        if data.session_id:
            potential_image = TEMP_UPLOADS_DIR / data.session_id / "store_0.jpg"
            if potential_image.exists():
                storefront_image_path = str(potential_image)
            else:
                potential_image = TEMP_UPLOADS_DIR / data.session_id / "store_0.png"
                if potential_image.exists():
                    storefront_image_path = str(potential_image)
        
        pdf_buffer = generate_sanction_report(data.dict(), storefront_image_path=storefront_image_path)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=KiranaFlow_Report.pdf"}
        )
    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")


@app.get("/health")
async def health():
    """System health check — used by frontend 'API Connected' badge."""
    from vision import _resolve_model_path, YOLO_AVAILABLE, _yolo_model
    model_path = _resolve_model_path()
    pkl_ready = False
    if FUSION_AVAILABLE and load_pkl_model is not None:
        pkl_ready = load_pkl_model() is not None
    return {
        "status": "healthy",
        "yolo_available": YOLO_AVAILABLE,
        "model_loaded": _yolo_model is not None,
        "model_path": str(model_path) if model_path else None,
        "pkl_model_loaded": pkl_ready,
        "geo_available": GEO_AVAILABLE,
        "fraud_available": FRAUD_AVAILABLE,
        "ocr_available": OCR_AVAILABLE,
        "auditor_available": AUDITOR_AVAILABLE,
        "fusion_available": FUSION_AVAILABLE,
        "pdf_available": PDF_AVAILABLE,
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict(
    store_photos: List[UploadFile] = File(..., description="3–5 store interior images (JPG/PNG)"),
    bank_statement: Optional[UploadFile] = File(None, description="Bank statement PDF (Optional)"),
    supplier_bill: Optional[UploadFile] = File(None, description="Supplier bill image (JPG/PNG) (Optional)"),
    lat: Optional[float] = Form(None, description="Store latitude"),
    lon: Optional[float] = Form(None, description="Store longitude"),
    inventory_days: Optional[float] = Form(None, description="Working capital: inventory days"),
    receivable_days: Optional[float] = Form(None, description="Working capital: receivable days"),
    payable_days: Optional[float] = Form(None, description="Working capital: payable days"),
    shop_video: Optional[UploadFile] = File(None, description="Optional 1-minute shop video (MP4/MOV/AVI/MKV)"),
):
    """
    Main underwriting endpoint.

    Accepts store photos, bank statement, and supplier bill.
    Returns a full underwriting assessment with vision signals, geo intelligence,
    fraud checks, and financial recommendations.
    """

    # ── Input validation ──────────────────────────────────────────────────────
    if len(store_photos) < 3:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum 3 store photos required. Got {len(store_photos)}.",
        )
    if len(store_photos) > 5:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum 5 store photos allowed. Got {len(store_photos)}.",
        )

    def _is_pdf(upload: UploadFile) -> bool:
        ct = (upload.content_type or "").lower()
        fn = (upload.filename or "").lower()
        return "pdf" in ct or fn.endswith(".pdf")

    def _is_image(upload: UploadFile) -> bool:
        ct = (upload.content_type or "").lower()
        fn = (upload.filename or "").lower()
        return any(x in ct for x in ["jpeg", "jpg", "png"]) or fn.endswith((".jpg", ".jpeg", ".png"))

    if bank_statement is not None and not _is_pdf(bank_statement):
        raise HTTPException(400, "bank_statement must be a PDF file.")
    if supplier_bill is not None and not _is_image(supplier_bill):
        raise HTTPException(400, "supplier_bill must be a JPG or PNG image.")
    for i, photo in enumerate(store_photos):
        if not _is_image(photo):
            raise HTTPException(400, f"store_photos[{i}] must be JPG or PNG.")

    # ── Save uploads to temp directory ───────────────────────────────────────
    session_id = uuid.uuid4().hex
    session_dir = TEMP_UPLOADS_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    image_paths: List[str] = []
    bank_path: Optional[str] = None
    bill_path: Optional[str] = None

    try:
        # Store photos
        for i, photo in enumerate(store_photos):
            ext = Path(photo.filename or f"photo_{i}.jpg").suffix or ".jpg"
            dest = session_dir / f"store_{i}{ext}"
            _save_upload(photo, dest)
            image_paths.append(str(dest))

        # Bank statement
        if bank_statement is not None:
            bank_dest = session_dir / "bank_statement.pdf"
            _save_upload(bank_statement, bank_dest)
            bank_path = str(bank_dest)

        # Supplier bill
        if supplier_bill is not None:
            ext = Path(supplier_bill.filename or "bill.jpg").suffix or ".jpg"
            bill_dest = session_dir / f"supplier_bill{ext}"
            _save_upload(supplier_bill, bill_dest)
            bill_path = str(bill_dest)

        # Video frames
        if shop_video is not None:
            try:
                vid_ext = Path(shop_video.filename or "video.mp4").suffix or ".mp4"
                vid_dest = session_dir / f"shop_video{vid_ext}"
                _save_upload(shop_video, vid_dest)
                from vision import process_video_frames
                vid_frames = process_video_frames(str(vid_dest), session_dir)
                if vid_frames:
                    image_paths.extend(vid_frames)
                    logger.info(f"[{session_id}] Extracted {len(vid_frames)} frames from video")
            except Exception as ve:
                logger.warning(f"[{session_id}] Video upload handling failed: {ve}")

        logger.info(f"[{session_id}] Files saved — {len(image_paths)} photos (including video frames)")

        # ── EXIF metadata audit (GPS spoofing check) ──────────────────────────
        exif_audit: Dict[str, Any] = {"results": [], "overall_confidence": 1.0, "flags": []}
        if AUDITOR_AVAILABLE and audit_image_batch is not None:
            try:
                exif_audit = audit_image_batch(image_paths, lat, lon)
                logger.info(f"[{session_id}] EXIF audit flags: {exif_audit['flags']}")
            except Exception as _ae:
                logger.warning(f"[{session_id}] EXIF audit failed: {_ae}")

        # ── YOLO vision pipeline ──────────────────────────────────────────────
        logger.info(f"[{session_id}] Running YOLO vision pipeline...")
        vision = extract_vision_features(image_paths)

        # ── Document processing ───────────────────────────────────────────────
        logger.info(f"[{session_id}] Processing documents...")
        bank_data = _process_bank_statement(bank_path) if bank_path else {"parsed": False, "income_proxy": None}
        bill_data = _process_supplier_bill(bill_path) if bill_path else {"parsed": False, "inventory_proxy": None}

        # OCR bill amount for fraud cross-check
        ocr_bill_amount: Optional[float] = None
        if OCR_AVAILABLE and _ocr_process_bill is not None and bill_path is not None:
            try:
                ocr_result = _ocr_process_bill(bill_path)
                raw_amt = ocr_result.get("total_amount")
                ocr_bill_amount = float(raw_amt) if raw_amt is not None else None
                logger.info(f"[{session_id}] OCR bill amount: {ocr_bill_amount}")
            except Exception as _oe:
                logger.warning(f"[{session_id}] OCR failed: {_oe}")

        # ── Geo intelligence ──────────────────────────────────────────────────
        logger.info(f"[{session_id}] Computing geo intelligence...")
        geo_data = _get_geo_data(lat, lon)
        geo_multiplier = float(geo_data.get("location_multiplier", geo_data.get("geo_multiplier", 1.0)))

        # ── Fraud checks ──────────────────────────────────────────────────────
        logger.info(f"[{session_id}] Running fraud checks...")
        fraud_flags = _get_fraud_flags(vision, bank_data["parsed"], bill_data["parsed"], inventory_days)

        # Merge EXIF fraud flags
        for _ef in exif_audit.get("flags", []):
            if _ef not in fraud_flags:
                fraud_flags.append(_ef)

        exif_trust = float(exif_audit.get("overall_confidence", 1.0))

        # ── CCC computation ───────────────────────────────────────────────────
        from logicengine import calculate_ccc
        ccc_value = calculate_ccc(inventory_days, receivable_days, payable_days)
        logger.info(f"[{session_id}] CCC={ccc_value:.1f} days (inv={inventory_days}, rec={receivable_days}, pay={payable_days})")

        # ── Duplicate image detection ─────────────────────────────────────────
        duplicate_detected = False
        if FRAUD_AVAILABLE and generate_image_fingerprint is not None and check_for_duplicates is not None:
            try:
                for ipath in image_paths:
                    fp = generate_image_fingerprint(ipath)
                    if fp:
                        dup_result = check_for_duplicates(fp)
                        if dup_result.get("is_duplicate"):
                            duplicate_detected = True
                            fraud_flags_pre = ["Duplicate evidence detected — possible re-submission"]
                            break
            except Exception as _de:
                logger.warning(f"[{session_id}] Duplicate check failed: {_de}")

        # ── Financial derivations (real ML model or heuristics) ───────────────
        financials = _derive_financials(
            vision, geo_data, bank_data["parsed"], bill_data["parsed"], ocr_bill_amount,
            inventory_days=inventory_days, receivable_days=receivable_days, payable_days=payable_days,
        )
        confidence = round(min(financials["confidence_score"] * exif_trust, 0.95), 3)

        # ── Interpretability ──────────────────────────────────────────────────
        shap = _build_shap_contributions(
            vision, geo_multiplier, bank_data["parsed"], bill_data["parsed"], fraud_flags
        )
        risk_flags = _build_risk_flags(fraud_flags, geo_data, vision, confidence)

        # ── Review routing ────────────────────────────────────────────────────
        high_risk_flags = [f for f in risk_flags if f["severity"] == "high"]
        if confidence >= 0.82 and not high_risk_flags:
            review_route = "Auto Approved"
            fraud_status = "No Flags Detected"
        elif high_risk_flags or confidence < 0.55:
            review_route = "Flagged"
            fraud_status = "Flags Detected — Investigation Required"
        else:
            review_route = "Manual Review"
            fraud_status = "No Critical Flags" if not high_risk_flags else "Review Recommended"

        # ── Build Ranges ──────────────────────────────────────────────────────
        margin = 1.0 - confidence
        rev = financials["monthly_revenue"]
        rev_min = int(rev * (1 - margin) / 1000) * 1000
        rev_max = int(rev * (1 + margin) / 1000) * 1000

        inc = financials["net_cash_flow"]
        inc_min = int(inc * (1 - margin) / 500) * 500
        inc_max = int(inc * (1 + margin) / 500) * 500

        # ── Build response ────────────────────────────────────────────────────
        response = PredictionResponse(
            session_id=session_id,
            inventory_days=inventory_days,
            receivable_days=receivable_days,
            payable_days=payable_days,
            monthly_revenue=financials["monthly_revenue"],
            net_cash_flow=financials["net_cash_flow"],
            daily_sales_range=[rev_min // 30, rev_max // 30],
            monthly_revenue_range=[rev_min, rev_max],
            monthly_income_range=[inc_min, inc_max],
            safe_loan_band=financials["safe_loan_band"],
            confidence_score=confidence,
            ccc_tier=str(financials.get("ccc_tier", "N/A")),
            ccc_value=float(ccc_value),
            location_tier=str(geo_data.get("location_tier", "medium")),
            geo_multiplier=geo_multiplier,
            fraud_status=fraud_status,
            review_route=review_route,
            fraud_flags=fraud_flags,
            exif_flags=list(exif_audit.get("flags", [])),
            duplicate_detected=duplicate_detected,
            vision_features=VisionFeatures(**vision),
            geo_features=GeoFeatures(
                location_tier=str(geo_data.get("location_tier", "medium")),
                geo_multiplier=geo_multiplier,
                area_type=str(geo_data.get("area_type", "unknown")),
                competition_density=float(geo_data.get("competition_density", 0.0)),
                latitude=lat,
                longitude=lon,
            ),
            shap_contributions=[ShapContribution(**s) for s in shap],
            risk_flags=[RiskFlag(**r) for r in risk_flags],
            raw_metadata=RawMetadata(
                mode="yolo" if not vision.get("demo_mode") else "demo",
                processed_images=vision.get("images_analyzed", len(image_paths)),
                yolo_model=vision.get("model_path", "unknown"),
                lat=lat,
                lon=lon,
            ),
        )

        logger.info(
            f"[{session_id}] ✅ Assessment complete | "
            f"revenue=₹{financials['monthly_revenue']:,} | "
            f"confidence={confidence:.0%} | "
            f"route={review_route}"
        )
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"[{session_id}] Unhandled error in /predict: {e}")
        raise HTTPException(status_code=500, detail=f"Underwriting pipeline error: {str(e)}")
    finally:
        # Clean up temp files to avoid disk accumulation
        try:
            shutil.rmtree(session_dir, ignore_errors=True)
        except Exception:
            pass


# ── Standalone utility endpoints ──────────────────────────────────────────────

@app.post("/vision/analyze")
async def analyze_single_image(file: UploadFile = File(...)):
    """
    Standalone YOLO inference endpoint for a single image.
    Useful for testing the vision pipeline independently.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image (JPG/PNG).")

    session_dir = TEMP_UPLOADS_DIR / uuid.uuid4().hex
    session_dir.mkdir(parents=True, exist_ok=True)

    try:
        ext = Path(file.filename or "img.jpg").suffix or ".jpg"
        img_path = session_dir / f"image{ext}"
        _save_upload(file, img_path)
        features = extract_vision_features([str(img_path)])
        return {"status": "success", "features": features}
    finally:
        shutil.rmtree(session_dir, ignore_errors=True)


@app.post("/bank/parse")
async def parse_bank_statement(file: UploadFile = File(...)):
    """Standalone bank statement parsing endpoint."""
    if not file.content_type or "pdf" not in file.content_type.lower():
        raise HTTPException(400, "File must be a PDF.")

    session_dir = TEMP_UPLOADS_DIR / uuid.uuid4().hex
    session_dir.mkdir(parents=True, exist_ok=True)

    try:
        dest = session_dir / "statement.pdf"
        _save_upload(file, dest)
        result = _process_bank_statement(str(dest))
        return {"status": "success", "data": result}
    finally:
        shutil.rmtree(session_dir, ignore_errors=True)


# ── Dev server entrypoint ─────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
