import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


NS = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL_NS = {"rel": "http://schemas.openxmlformats.org/package/2006/relationships"}


def col_to_index(ref):
    letters = "".join(ch for ch in ref if ch.isalpha()).upper()
    value = 0
    for ch in letters:
        value = value * 26 + (ord(ch) - 64)
    return value - 1


def normalize_name(value):
    if value is None:
        return ""
    return re.sub(r"[^a-z0-9]+", "", str(value).strip().lower())


def normalize_email(value):
    if value is None:
        return ""
    return str(value).strip().lower()


def text_or_none(value):
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def numeric_or_none(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    if not text:
        return None
    lowered = text.lower()
    if lowered in {"absent", "co"}:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def read_shared_strings(zf):
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    strings = []
    for si in root.findall("main:si", NS):
        pieces = [node.text or "" for node in si.findall(".//main:t", NS)]
        strings.append("".join(pieces))
    return strings


def first_sheet_path(zf):
    workbook = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rel_map = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in rels.findall("rel:Relationship", REL_NS)
    }
    first_sheet = workbook.find("main:sheets/main:sheet", NS)
    if first_sheet is None:
        raise RuntimeError("Workbook has no sheets")
    rel_id = first_sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
    target = rel_map[rel_id].lstrip("/")
    if not target.startswith("xl/"):
        target = f"xl/{target}"
    return target


def parse_sheet_rows(zf, sheet_path, shared_strings):
    sheet = ET.fromstring(zf.read(sheet_path))
    rows = []
    for row in sheet.findall(".//main:sheetData/main:row", NS):
        values = {}
        for cell in row.findall("main:c", NS):
            ref = cell.attrib.get("r", "")
            idx = col_to_index(ref)
            cell_type = cell.attrib.get("t")
            if cell_type == "inlineStr":
                value = "".join(node.text or "" for node in cell.findall(".//main:t", NS))
            else:
                v = cell.find("main:v", NS)
                if v is None:
                    value = None
                elif cell_type == "s":
                    value = shared_strings[int(v.text)]
                elif cell_type == "b":
                    value = v.text == "1"
                else:
                    raw = v.text
                    if raw is None:
                        value = None
                    else:
                        try:
                            number = float(raw)
                            value = int(number) if number.is_integer() else number
                        except ValueError:
                            value = raw
            values[idx] = value
        if values:
            max_idx = max(values)
            rows.append([values.get(i) for i in range(max_idx + 1)])
    return rows


def build_columns(header1, header2):
    width = max(len(header1), len(header2))
    columns = []
    current_block = None
    for idx in range(width):
        top = text_or_none(header1[idx] if idx < len(header1) else None)
        sub = text_or_none(header2[idx] if idx < len(header2) else None)
        if idx >= 2 and top and top.strip().lower() != "total":
            current_block = top
        columns.append(
            {
                "index": idx,
                "top": top,
                "sub": sub,
                "block": current_block,
            }
        )
    return columns


def score_summary(cells):
    latest = None
    superscore = None
    for cell in cells:
        sub = (cell["sub"] or "").lower()
        value = numeric_or_none(cell["value"])
        if value is None or value <= 0:
            continue
        if "en + ma" in sub or sub == "total":
            latest = {
                "label": cell["block"] or cell["top"] or "Test",
                "total": int(round(value)),
                "english": None,
                "math": None,
            }
            if superscore is None or value > superscore:
                superscore = int(round(value))
        elif sub == "en" and latest is not None:
            latest["english"] = int(round(value))
        elif sub == "ma" and latest is not None:
            latest["math"] = int(round(value))

    latest_by_block = {}
    for cell in cells:
        block = cell["block"] or cell["top"]
        if not block:
            continue
        latest_by_block.setdefault(block, {})[cell["sub"] or ""] = cell["value"]

    ordered_blocks = []
    for cell in cells:
        block = cell["block"] or cell["top"]
        if block and block not in ordered_blocks:
            ordered_blocks.append(block)

    latest = None
    for block in ordered_blocks:
        data = latest_by_block.get(block, {})
        total = numeric_or_none(data.get("EN + MA") or data.get("TOTAL"))
        if total is None or total <= 0:
            continue
        latest = {
            "label": block,
            "total": int(round(total)),
            "english": int(round(numeric_or_none(data.get("EN")) or 0)) or None,
            "math": int(round(numeric_or_none(data.get("MA")) or 0)) or None,
        }

    return {
        "latest_test_label": latest["label"] if latest else None,
        "latest_test_score": latest["total"] if latest else None,
        "latest_english_score": latest["english"] if latest else None,
        "latest_math_score": latest["math"] if latest else None,
        "super_score": superscore,
    }


def parse_workbook(path):
    with zipfile.ZipFile(path) as zf:
        shared_strings = read_shared_strings(zf)
        sheet_path = first_sheet_path(zf)
        rows = parse_sheet_rows(zf, sheet_path, shared_strings)

    if len(rows) < 3:
        return []

    columns = build_columns(rows[0], rows[1])
    records = []
    for row in rows[2:]:
        name = text_or_none(row[0] if len(row) > 0 else None)
        email = text_or_none(row[1] if len(row) > 1 else None)
        if not name and not email:
            continue

        cells = []
        for col in columns[2:]:
            idx = col["index"]
            value = row[idx] if idx < len(row) else None
            cells.append(
                {
                    "top": col["top"],
                    "sub": col["sub"],
                    "block": col["block"],
                    "value": value,
                }
            )

        summary = score_summary(cells)
        records.append(
            {
                "name": name,
                "email": email,
                "normalized_name": normalize_name(name),
                "normalized_email": normalize_email(email),
                **summary,
            }
        )
    return records


def main():
    if len(sys.argv) < 2:
        raise SystemExit("Usage: read_sat_scores.py <xlsx_path>")

    path = Path(sys.argv[1]).expanduser()
    if not path.exists():
        raise SystemExit(f"Workbook not found: {path}")

    records = parse_workbook(path)
    print(json.dumps({"records": records}))


if __name__ == "__main__":
    main()
