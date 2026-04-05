from __future__ import annotations
from io import BytesIO
from typing import Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
class ExportService:
    def build_pdf_report(
        self,
        dataset_name: str,
        dashboard: dict[str, Any],
        model_summary: dict[str, Any] | None = None,
    ) -> bytes:
        buffer = BytesIO()
        document = SimpleDocTemplate(buffer, pagesize=A4, title=f"{dataset_name} Analytics Report")
        styles = getSampleStyleSheet()
        story = [
            Paragraph(f"{dataset_name} Analytics Report", styles["Title"]),
            Spacer(1, 12),
            Paragraph("Executive Summary", styles["Heading2"]),
        ]
        for insight in dashboard.get("insights", [])[:5]:
            story.append(Paragraph(f"• {insight.get('title')}: {insight.get('detail')}", styles["BodyText"]))
            story.append(Spacer(1, 6))
        story.append(Spacer(1, 10))
        story.append(Paragraph("KPI Snapshot", styles["Heading2"]))
        kpis = dashboard.get("kpis", {})
        kpi_table = Table(
            [["Total Sales", "Orders", "Avg Order Value", "Quantity"], [
                kpis.get("total_sales", "-"),
                kpis.get("orders", "-"),
                kpis.get("avg_order_value", "-"),
                kpis.get("quantity", "-"),
            ]]
        )
        kpi_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#13233A")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                    ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#F8FAFC")),
                ]
            )
        )
        story.append(kpi_table)
        if model_summary:
            story.append(Spacer(1, 18))
            story.append(Paragraph("Model Summary", styles["Heading2"]))
            rows = [["Best Model", model_summary.get("best_model", "-")]]
            for key, value in model_summary.get("metrics", {}).items():
                rows.append([key.upper(), str(value)])
            model_table = Table(rows)
            model_table.setStyle(
                TableStyle(
                    [
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
                    ]
                )
            )
            story.append(model_table)
        document.build(story)
        buffer.seek(0)
        return buffer.getvalue()
