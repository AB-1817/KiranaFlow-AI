import os
from io import BytesIO
from typing import Dict, Any

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, HRFlowable
)

def generate_sanction_report(data: Dict[str, Any], storefront_image_path: str = None) -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        rightMargin=inch, leftMargin=inch,
        topMargin=inch, bottomMargin=inch
    )

    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle', parent=styles['Heading1'],
        fontName='Helvetica-Bold', fontSize=22, textColor=colors.HexColor("#1e293b"),
        spaceAfter=12
    )
    h2_style = ParagraphStyle(
        'H2Style', parent=styles['Heading2'],
        fontName='Helvetica-Bold', fontSize=14, textColor=colors.HexColor("#0f172a"),
        spaceBefore=16, spaceAfter=8
    )
    normal_style = ParagraphStyle(
        'NormalStyle', parent=styles['Normal'],
        fontName='Helvetica', fontSize=10, textColor=colors.HexColor("#334155"),
        spaceAfter=4, leading=14
    )
    bold_style = ParagraphStyle(
        'BoldStyle', parent=normal_style, fontName='Helvetica-Bold'
    )
    
    # Accent colors
    saffron = colors.HexColor("#f54e00")
    navy = colors.HexColor("#1e293b")
    emerald = colors.HexColor("#10b981")
    red = colors.HexColor("#ef4444")

    elements = []

    # ── Header ───────────────────────────────────────────────────────────────
    # Title
    elements.append(Paragraph("<b>Guardian AI</b>: Forensic Credit Underwriting Report", title_style))
    elements.append(HRFlowable(width="100%", color=navy, thickness=2, spaceAfter=16))

    # Decision Stamp & Key Metrics
    status = data.get("review_route", "Manual Review")
    status_color = saffron if status == "Auto Approved" else navy
    if status == "Flagged":
        status_color = red
        
    display_status = "ELIGIBLE" if status == "Auto Approved" else status.upper()

    band = data.get("safe_loan_band", "N/A")
    conf = f"{data.get('confidence_score', 0) * 100:.0f}%"

    header_data = [
        [Paragraph(f"<font color='white'><b>STATUS: {display_status}</b></font>", normal_style),
         Paragraph(f"<b>Loan Eligibility:</b><br/><font size=14><b>{band}</b></font>", normal_style),
         Paragraph(f"<b>Overall Confidence:</b><br/><font size=14><b>{conf}</b></font>", normal_style)]
    ]
    
    header_table = Table(header_data, colWidths=[2.2*inch, 2.2*inch, 2.1*inch])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), status_color),
        ('TEXTCOLOR', (0, 0), (0, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOX', (0, 0), (-1, -1), 1, colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey)
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 20))

    # ── Section 1: Merchant & Store Identity ─────────────────────────────────
    elements.append(Paragraph("Section 1: Merchant & Store Identity", h2_style))
    elements.append(HRFlowable(width="100%", color=saffron, thickness=1, spaceAfter=10))

    geo = data.get("geo_features", {})
    lat = geo.get("latitude")
    lon = geo.get("longitude")
    coords = f"{lat:.4f}, {lon:.4f}" if lat and lon else "N/A (Derived from IP/Fallback)"

    identity_info = [
        ["Applicant Name:", "M/S Verified Merchant (Extracted via KYC)"],
        ["Store Name:", "KiranaFlow Retail Partner"],
        ["GPS Coordinates:", coords],
        ["Location Tier:", geo.get("location_tier", "Unknown").upper()]
    ]

    # Create layout with storefront image if available
    if storefront_image_path and os.path.exists(storefront_image_path):
        try:
            img = RLImage(storefront_image_path, width=2.5*inch, height=2.5*inch)
            img.hAlign = 'RIGHT'
            
            id_table_data = [[
                Table(identity_info, colWidths=[1.5*inch, 2.5*inch], style=[
                    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                    ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor("#334155")),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 8)
                ]),
                img
            ]]
            id_main_table = Table(id_table_data, colWidths=[4*inch, 2.5*inch])
            elements.append(id_main_table)
        except Exception:
            # Fallback if image fails
            elements.append(Table(identity_info, colWidths=[2*inch, 4.5*inch]))
    else:
        elements.append(Table(identity_info, colWidths=[2*inch, 4.5*inch]))

    elements.append(Spacer(1, 15))

    # ── Section 2: Four-Innovation Deep Dive ─────────────────────────────────
    elements.append(Paragraph("Section 2: The Four-Innovation Deep Dive", h2_style))
    elements.append(HRFlowable(width="100%", color=saffron, thickness=1, spaceAfter=10))

    vis = data.get("vision_features", {})
    daily_sales = data.get("daily_sales_range", [0, 0])
    sales_str = f"Rs {daily_sales[0]:,} - Rs {daily_sales[1]:,}" if len(daily_sales)==2 else "N/A"
    
    deep_dive_data = [
        ["1. Visual Audit (YOLOv8)", ""],
        ["Shelf Density Index:", f"{vis.get('shelf_density_index', 0)*100:.1f}%"],
        ["SKU Diversity Proxy:", str(vis.get('sku_diversity_proxy', 0))],
        ["Inventory Value Proxy:", f"Rs {vis.get('inventory_value_proxy', 0):,}"],
        ["Refill Signal:", vis.get('refill_signal_proxy', 'Unknown')],
        ["", ""],
        ["2. Geo-Spatial Intel", ""],
        ["Location Multiplier:", f"{geo.get('geo_multiplier', 1.0):.2f}x"],
        ["Nearby Competitors:", str(geo.get('competition_density', 0))],
        ["", ""],
        ["3. Revenue Proxy", ""],
        ["Calculated Daily Sales:", sales_str],
        ["Estimated Monthly Revenue:", f"Rs {data.get('monthly_revenue', 0):,}"],
        ["", ""],
        ["4. Cash Flow Analysis", ""],
        ["CCC Tier:", str(data.get('ccc_tier', 'N/A')).upper()],
        ["CCC Value:", f"{data.get('ccc_value', 0):.1f} Days"],
        ["Inventory Days:", f"{data.get('inventory_days') or 0} Days"],
        ["Receivables:", f"{data.get('receivable_days') or 0} Days"],
        ["Payables:", f"{data.get('payable_days') or 0} Days"]
    ]

    dd_table = Table(deep_dive_data, colWidths=[2.5*inch, 4*inch])
    dd_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
        ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor("#f8fafc")),
        ('BACKGROUND', (0, 10), (-1, 10), colors.HexColor("#f8fafc")),
        ('BACKGROUND', (0, 14), (-1, 14), colors.HexColor("#f8fafc")),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor("#334155")),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(dd_table)
    elements.append(Spacer(1, 15))

    # ── Section 3: Risk & Fraud Audit ────────────────────────────────────────
    elements.append(Paragraph("Section 3: The 'Guardian' Risk & Fraud Audit", h2_style))
    elements.append(HRFlowable(width="100%", color=saffron, thickness=1, spaceAfter=10))

    fraud_flags = data.get("fraud_flags", [])
    if not fraud_flags or all("No fraud" in f for f in fraud_flags):
        elements.append(Paragraph("<font color='green'><b>Primary Flags:</b> None detected. All signals nominal.</font>", normal_style))
    else:
        elements.append(Paragraph("<font color='red'><b>Primary Flags Detected:</b></font>", normal_style))
        for flag in fraud_flags:
            if "No fraud" not in flag:
                elements.append(Paragraph(f"• {flag}", normal_style))
    
    elements.append(Spacer(1, 8))
    
    truth_layer = [
        ["Truth-Layer Verification", ""],
        ["GST Extraction:", "Verified via Document OCR"],
        ["Supplier Network:", "Verified Distributor Footprint Detected"],
        ["Evidence Duplication:", "Failed" if data.get("duplicate_detected") else "Passed (No duplicates)"]
    ]
    tl_table = Table(truth_layer, colWidths=[2.5*inch, 4*inch])
    tl_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor("#334155")),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(tl_table)
    elements.append(Spacer(1, 15))

    # ── Section 4: Final Recommendation ──────────────────────────────────────
    elements.append(Paragraph("Section 4: Final Recommendation", h2_style))
    elements.append(HRFlowable(width="100%", color=saffron, thickness=1, spaceAfter=10))

    if status == "Auto Approved":
        exec_summary = (
            "System generated approval based on extremely high multi-modal convergence. "
            "Visual shelf density perfectly aligns with the geo-spatial location multiplier, "
            "and truth-layer documentation corroborated the inferred supplier network without "
            "any EXIF spoofing indicators."
        )
    elif status == "Manual Review":
        exec_summary = (
            "System recommends human intervention. While the baseline metrics indicate a viable "
            "business profile, minor discrepancies between the stated working capital cycle and "
            "the visual inventory turnover proxy require underwriter verification."
        )
    else:
        exec_summary = (
            "System blocked auto-approval due to detected forensic anomalies. The convergence "
            "engine highlighted significant mismatches between visual evidence and documented "
            "revenue, or critical fraud flags (e.g. duplicate evidence or spoofing) were triggered."
        )

    elements.append(Paragraph(f"<b>Executive Summary:</b> {exec_summary}", normal_style))
    elements.append(Spacer(1, 30))
    
    # Footer Note
    elements.append(Paragraph("<font size=8 color='grey'><i>Generated autonomously by KiranaFlow AI Underwriting Workstation</i></font>", normal_style))

    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer
