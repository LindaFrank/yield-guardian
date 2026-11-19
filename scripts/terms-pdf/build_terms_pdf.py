"""Rebuilds public/Yield_Guardian_Terms_Privacy_Disclosures.pdf from src/content/termsContent.ts.

The Terms pages are drawn from the same wording the website shows; the Privacy Policy
pages are carried over unchanged from the current PDF. Run from the project root:
    python3 scripts/terms-pdf/build_terms_pdf.py
"""
import io
import json
import subprocess
from pathlib import Path
from xml.sax.saxutils import escape

from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (HRFlowable, KeepTogether, ListFlowable, ListItem,
                                Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle)

ROOT = Path(__file__).resolve().parents[2]
PDF_PATH = ROOT / "public" / "Yield_Guardian_Terms_Privacy_Disclosures.pdf"

content = json.loads(subprocess.check_output(
    ["bun", "-e", "import * as t from './src/content/termsContent.ts'; console.log(JSON.stringify(t))"],
    cwd=ROOT, text=True))

NAVY = colors.HexColor("#1a1f36")
BODY = colors.HexColor("#333333")
GRAY = colors.HexColor("#666666")

title = ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=17, leading=22, alignment=TA_CENTER, textColor=NAVY, spaceAfter=14)
heading = ParagraphStyle("heading", fontName="Helvetica-Bold", fontSize=12.5, leading=16, textColor=NAVY, spaceBefore=12, spaceAfter=6)
body = ParagraphStyle("body", fontName="Helvetica", fontSize=9.5, leading=13, textColor=BODY, spaceAfter=6)
box = ParagraphStyle("box", parent=body, textColor=NAVY, spaceAfter=0)
foot = ParagraphStyle("foot", fontName="Helvetica", fontSize=7.5, leading=11, alignment=TA_CENTER, textColor=GRAY, spaceAfter=4)


def p(text, style=body):
    return Paragraph(escape(text), style)


story = [p(content["termsTitle"], title), p(content["acceptanceHeading"], heading), p(content["acceptanceIntro"])]
story.append(ListFlowable(
    [ListItem(p(item, ParagraphStyle("li", parent=body, spaceAfter=3)), leftIndent=14) for item in content["acknowledgments"]],
    bulletType="bullet", start="\u2022", bulletFontSize=8, leftIndent=14, bulletOffsetY=-1))
statement = Table([[p(content["acceptanceStatement"], box)]], colWidths=[6.5 * inch])
statement.setStyle(TableStyle([
    ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#999999")),
    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f2f2f2")),
    ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
]))
story += [Spacer(1, 4), statement, Spacer(1, 6), p(content["acceptanceRetention"])]

for section in content["sections"]:
    paras = section["paragraphs"]
    story.append(KeepTogether([p(section["title"], heading), p(paras[0])]))
    story += [p(text) for text in paras[1:]]

story.append(KeepTogether([p(content["disclosuresTitle"], heading)] + [
    Paragraph(f"<font name='Helvetica-Bold' color='#1a1f36'>{escape(d['label'])}</font> {escape(d['text'])}", body)
    for d in content["disclosures"][:1]]))
story += [Paragraph(f"<font name='Helvetica-Bold' color='#1a1f36'>{escape(d['label'])}</font> {escape(d['text'])}", body)
          for d in content["disclosures"][1:]]
story += [Spacer(1, 4), HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#999999"), spaceAfter=8)]
story += [p(line, foot) for line in content["footerLines"]]

terms_buf = io.BytesIO()
SimpleDocTemplate(terms_buf, pagesize=letter, leftMargin=inch, rightMargin=inch, topMargin=0.85 * inch,
                  bottomMargin=0.85 * inch, title="Yield Guardian — " + content["termsTitle"]).build(story)

# Carry the Privacy Policy pages over from the current PDF unchanged.
old = PdfReader(str(PDF_PATH))
privacy_start = next(i for i, page in enumerate(old.pages)
                     if (page.extract_text() or "").lstrip().startswith("Privacy Policy"))
writer = PdfWriter()
for page in PdfReader(terms_buf).pages:
    writer.add_page(page)
for page in old.pages[privacy_start:]:
    writer.add_page(page)
writer.add_metadata({"/Title": "Yield Guardian — " + content["termsTitle"], "/Producer": "ReportLab PDF Library"})
out = io.BytesIO()
writer.write(out)
PDF_PATH.write_bytes(out.getvalue())
print(f"wrote {PDF_PATH} ({len(writer.pages)} pages; privacy pages carried over from page {privacy_start + 1})")
