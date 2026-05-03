"""
KiranaFlow AI — Vision Module
Uses trained YOLOv8 weights to extract interpretable shelf inventory signals
from Kirana store images for the underwriting pipeline.

Model: backend/models/best.pt
Author: KiranaFlow AI Engine
"""

import os
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

import numpy as np
from PIL import Image

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    logging.warning("cv2 not installed — video temporal extraction disabled")

# ── Ultralytics YOLO ──────────────────────────────────────────────────────────
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    logging.warning("ultralytics not installed — vision running in demo mode")

# ── Paths ─────────────────────────────────────────────────────────────────────
BACKEND_DIR = Path(__file__).resolve().parent
MODELS_DIR = BACKEND_DIR / "models"
MODEL_PATH = MODELS_DIR / "best.pt"
FALLBACK_MODEL_PATH = MODELS_DIR / "last.pt"

# ── Logger ────────────────────────────────────────────────────────────────────
logger = logging.getLogger("kiranaflow.vision")
logging.basicConfig(level=logging.INFO)

# ── Singleton model holder ────────────────────────────────────────────────────
_yolo_model: Optional[Any] = None


def _resolve_model_path() -> Optional[Path]:
    """Return the best available model file path."""
    if MODEL_PATH.exists():
        return MODEL_PATH
    if FALLBACK_MODEL_PATH.exists():
        logger.warning(f"best.pt not found — falling back to last.pt")
        return FALLBACK_MODEL_PATH
    logger.warning(f"No YOLO model found in {MODELS_DIR} — entering demo mode")
    return None


def load_model() -> Optional[Any]:
    """
    Load the YOLO model once and cache the singleton.
    Thread-safe for single-worker uvicorn.
    """
    global _yolo_model

    if _yolo_model is not None:
        return _yolo_model

    if not YOLO_AVAILABLE:
        logger.warning("ultralytics unavailable — returning None")
        return None

    path = _resolve_model_path()
    if path is None:
        return None

    try:
        logger.info(f"Loading YOLO model from {path} ...")
        _yolo_model = YOLO(str(path))
        # Warmup with a blank image so the first real request is fast
        _warmup_model(_yolo_model)
        logger.info("✅ YOLO model loaded and warmed up")
        return _yolo_model
    except Exception as e:
        logger.error(f"Failed to load YOLO model: {e}")
        return None


def _warmup_model(model: Any) -> None:
    """Run a silent warmup pass so first inference is not slow."""
    try:
        blank = np.zeros((640, 640, 3), dtype=np.uint8)
        model.predict(source=blank, verbose=False, conf=0.25)
    except Exception:
        pass  # Warmup failure is non-fatal


# ── Per-image inference ───────────────────────────────────────────────────────

def _run_inference_on_image(model: Any, image_path: str) -> Dict[str, Any]:
    """
    Run YOLO inference on one image.

    Returns:
        {
            "detections": int,
            "bbox_area_px": int,
            "image_width": int,
            "image_height": int,
            "image_area_px": int,
            "shelf_density": float,   # bbox_area / image_area
            "confidence_mean": float,
            "class_ids": list[int],
        }
    """
    try:
        with Image.open(image_path) as img:
            img_w, img_h = img.size
            img = img.convert("RGB")
    except Exception as e:
        logger.warning(f"PIL failed to open {image_path}: {e}")
        img_w, img_h = 1920, 1080

    image_area = img_w * img_h

    if model is None:
        # Demo mode: estimate plausible values from image size
        demo_detections = max(20, int(image_area * 0.00012))
        demo_bbox = int(image_area * 0.22)
        return {
            "detections": demo_detections,
            "bbox_area_px": demo_bbox,
            "image_width": img_w,
            "image_height": img_h,
            "image_area_px": image_area,
            "shelf_density": round(demo_bbox / image_area, 4),
            "confidence_mean": 0.0,
            "class_ids": [],
            "demo_mode": True,
        }

    try:
        results = model.predict(
            source=image_path,
            verbose=False,
            conf=0.25,
            iou=0.45,
            imgsz=640,
        )

        result = results[0]
        boxes = result.boxes

        if boxes is None or len(boxes) == 0:
            return {
                "detections": 0,
                "bbox_area_px": 0,
                "image_width": img_w,
                "image_height": img_h,
                "image_area_px": image_area,
                "shelf_density": 0.0,
                "confidence_mean": 0.0,
                "class_ids": [],
                "demo_mode": False,
            }

        # Sum bounding box areas (in original image space)
        scale_x = img_w / (result.orig_shape[1] if result.orig_shape else img_w)
        scale_y = img_h / (result.orig_shape[0] if result.orig_shape else img_h)

        total_bbox_area = 0
        confidences = []
        class_ids = []

        for box in boxes:
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            w = (x2 - x1) * scale_x
            h = (y2 - y1) * scale_y
            total_bbox_area += int(w * h)
            confidences.append(float(box.conf[0].cpu().numpy()))
            if box.cls is not None:
                class_ids.append(int(box.cls[0].cpu().numpy()))

        shelf_density = total_bbox_area / image_area if image_area > 0 else 0.0

        return {
            "detections": len(boxes),
            "bbox_area_px": total_bbox_area,
            "image_width": img_w,
            "image_height": img_h,
            "image_area_px": image_area,
            "shelf_density": round(shelf_density, 4),
            "confidence_mean": round(float(np.mean(confidences)), 4) if confidences else 0.0,
            "class_ids": class_ids,
            "demo_mode": False,
        }

    except Exception as e:
        logger.error(f"YOLO inference failed on {image_path}: {e}")
        # Return safe fallback instead of crashing the endpoint
        return {
            "detections": 30,
            "bbox_area_px": int(image_area * 0.2),
            "image_width": img_w,
            "image_height": img_h,
            "image_area_px": image_area,
            "shelf_density": 0.20,
            "confidence_mean": 0.0,
            "class_ids": [],
            "demo_mode": True,
        }

# ── Video Processing ──────────────────────────────────────────────────────────

def process_video_frames(video_path: str, temp_dir: Path) -> List[str]:
    """Extract 3 evenly spaced frames from a video for temporal checks."""
    if not CV2_AVAILABLE:
        logger.warning("CV2 unavailable: skipping real video extraction.")
        return []

    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return []
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames < 3:
            return []
            
        target_frames = [0, total_frames // 2, total_frames - 2]
        extracted_paths = []
        
        for i, frame_idx in enumerate(target_frames):
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if ret:
                # Convert BGR to RGB
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                img = Image.fromarray(rgb_frame)
                out_path = temp_dir / f"video_frame_{i}.jpg"
                img.save(out_path)
                extracted_paths.append(str(out_path))
                
        cap.release()
        return extracted_paths
    except Exception as e:
        logger.warning(f"Video extraction failed: {e}")
        return []


# ── Public API ────────────────────────────────────────────────────────────────

def extract_vision_features(image_paths: List[str]) -> Dict[str, Any]:
    """
    Main entry point for the underwriting vision pipeline.

    Accepts a list of local image file paths, runs YOLO inference on each,
    and returns aggregated interpretable signals for the credit engine.

    Returns
    -------
    {
        "total_product_detections": int,
        "shelf_density_index": float,       # 0–1, proportion of shelf area covered
        "inventory_value_proxy": int,        # ₹ estimate (detections × ₹120)
        "sku_diversity_proxy": int,          # unique SKU estimate (25% of detections)
        "images_analyzed": int,
        "demo_mode": bool,
        "model_path": str,
        "per_image": [
            {
                "file": str,
                "detections": int,
                "shelf_density": float,
                "confidence_mean": float,
                "image_width": int,
                "image_height": int,
            },
            ...
        ],

        # Legacy-compatible fields (used by existing frontend schema)
        "total_products_detected": int,
        "total_bbox_area": int,
        "total_image_area": int,
        "overall_shelf_density_index": float,
        "avg_detections_per_image": float,
        "image_count": int,
    }
    """
    model = load_model()

    if not image_paths:
        logger.warning("extract_vision_features called with empty image list")
        return _empty_features()

    per_image_results = []
    total_detections = 0
    total_bbox_area = 0
    total_image_area = 0
    any_demo = False

    for path in image_paths:
        logger.info(f"  → Analyzing {Path(path).name}")
        result = _run_inference_on_image(model, path)
        per_image_results.append({
            "file": Path(path).name,
            "detections": result["detections"],
            "shelf_density": result["shelf_density"],
            "confidence_mean": result["confidence_mean"],
            "image_width": result["image_width"],
            "image_height": result["image_height"],
        })
        total_detections += result["detections"]
        total_bbox_area += result["bbox_area_px"]
        total_image_area += result["image_area_px"]
        if result.get("demo_mode"):
            any_demo = True

    images_analyzed = len(image_paths)
    shelf_density_index = (
        round(total_bbox_area / total_image_area, 4) if total_image_area > 0 else 0.0
    )
    avg_detections = round(total_detections / images_analyzed, 2) if images_analyzed > 0 else 0.0

    # ── Underwriting-specific proxies ─────────────────────────────────────────
    # These are domain heuristics — replace with trained model outputs later.
    inventory_value_proxy = total_detections * 120          # ₹120 avg per detected unit
    sku_diversity_proxy = max(1, int(total_detections * 0.25))  # 25% unique SKU estimate

    # Refill Signal heuristic
    if shelf_density_index < 0.45:
        refill_signal = "High Depletion (Restock needed)"
    elif shelf_density_index > 0.85:
        refill_signal = "Overstocked (Slow turnover / Staged)"
    else:
        refill_signal = "Healthy Turnover"

    logger.info(
        f"Vision summary: {total_detections} detections across {images_analyzed} images "
        f"| density={shelf_density_index:.3f} "
        f"| demo_mode={any_demo}"
    )

    return {
        # Primary underwriting signals
        "total_product_detections": total_detections,
        "shelf_density_index": shelf_density_index,
        "inventory_value_proxy": inventory_value_proxy,
        "sku_diversity_proxy": sku_diversity_proxy,
        "refill_signal_proxy": refill_signal,
        "images_analyzed": images_analyzed,
        "demo_mode": any_demo,
        "model_path": str(_resolve_model_path() or "demo"),
        "per_image": per_image_results,

        # Legacy-compatible fields — keep for backward compat with existing API schema
        "total_products_detected": total_detections,
        "total_bbox_area": total_bbox_area,
        "total_image_area": total_image_area,
        "overall_shelf_density_index": shelf_density_index,
        "avg_detections_per_image": avg_detections,
        "image_count": images_analyzed,
    }


def _empty_features() -> Dict[str, Any]:
    return {
        "total_product_detections": 0,
        "shelf_density_index": 0.0,
        "inventory_value_proxy": 0,
        "sku_diversity_proxy": 0,
        "refill_signal_proxy": "Unknown",
        "images_analyzed": 0,
        "demo_mode": True,
        "model_path": "no_images",
        "per_image": [],
        # Legacy
        "total_products_detected": 0,
        "total_bbox_area": 0,
        "total_image_area": 0,
        "overall_shelf_density_index": 0.0,
        "avg_detections_per_image": 0.0,
        "image_count": 0,
    }
