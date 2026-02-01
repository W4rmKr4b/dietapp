from __future__ import annotations

import json
import mimetypes
import uuid
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, List, Tuple

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
INTAKE_FILE = DATA_DIR / "intakes.json"
REPORT_FILE = DATA_DIR / "reports.json"
TEMPLATE_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"

DEFAULT_TARGETS = {
    "calories": 2000,
    "protein_g": 120,
    "carbs_g": 250,
    "fat_g": 70,
    "fiber_g": 25,
    "water_l": 2.5,
}


@dataclass
class IntakeEntry:
    entry_date: date
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    water_l: float

    @classmethod
    def from_payload(cls, payload: Dict[str, Any]) -> "IntakeEntry":
        entry_date = datetime.strptime(payload["date"], "%Y-%m-%d").date()
        return cls(
            entry_date=entry_date,
            calories=float(payload.get("calories", 0)),
            protein_g=float(payload.get("protein_g", 0)),
            carbs_g=float(payload.get("carbs_g", 0)),
            fat_g=float(payload.get("fat_g", 0)),
            fiber_g=float(payload.get("fiber_g", 0)),
            water_l=float(payload.get("water_l", 0)),
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "date": self.entry_date.isoformat(),
            "calories": self.calories,
            "protein_g": self.protein_g,
            "carbs_g": self.carbs_g,
            "fat_g": self.fat_g,
            "fiber_g": self.fiber_g,
            "water_l": self.water_l,
        }


def _load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _save_json(path: Path, payload: Any) -> None:
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)


def _load_intakes() -> List[Dict[str, Any]]:
    return _load_json(INTAKE_FILE, [])


def _save_intakes(intakes: List[Dict[str, Any]]) -> None:
    _save_json(INTAKE_FILE, intakes)


def _load_reports() -> List[Dict[str, Any]]:
    return _load_json(REPORT_FILE, [])


def _save_reports(reports: List[Dict[str, Any]]) -> None:
    _save_json(REPORT_FILE, reports)


def _aggregate_intakes(start_date: date, end_date: date) -> Dict[str, float]:
    totals = {key: 0.0 for key in DEFAULT_TARGETS}
    for entry in _load_intakes():
        entry_date = datetime.strptime(entry["date"], "%Y-%m-%d").date()
        if start_date <= entry_date <= end_date:
            for key in totals:
                totals[key] += float(entry.get(key, 0))
    return totals


def _compare_to_targets(totals: Dict[str, float], days: int) -> Dict[str, Dict[str, float]]:
    comparisons: Dict[str, Dict[str, float]] = {}
    for key, target in DEFAULT_TARGETS.items():
        weekly_target = target * days
        actual = totals.get(key, 0.0)
        delta = actual - weekly_target
        comparisons[key] = {
            "weekly_target": weekly_target,
            "actual": actual,
            "delta": delta,
            "percent": (actual / weekly_target * 100) if weekly_target else 0,
        }
    return comparisons


def _build_narrative(comparisons: Dict[str, Dict[str, float]]) -> Dict[str, List[str]]:
    deficiencies = []
    excesses = []
    callouts = []

    for key, stats in comparisons.items():
        delta = stats["delta"]
        percent = stats["percent"]
        label = key.replace("_", " ")
        if delta < 0:
            deficiencies.append(f"{label} ran {abs(delta):.1f} below target ({percent:.0f}%).")
        elif delta > 0:
            excesses.append(f"{label} exceeded target by {delta:.1f} ({percent:.0f}%).")

    if comparisons["fiber_g"]["delta"] < 0:
        callouts.append("Add a fiber-forward snack (berries, chia, or legumes) daily.")
    if comparisons["water_l"]["delta"] < 0:
        callouts.append("Schedule two 16oz water reminders (mid-morning and mid-afternoon).")
    if comparisons["protein_g"]["delta"] < 0:
        callouts.append("Add a protein anchor at breakfast (Greek yogurt or eggs).")
    if comparisons["calories"]["delta"] > 0:
        callouts.append("Swap one high-calorie item with a vegetable-forward option.")
    if not callouts:
        callouts.append("Maintain the current plan and review trends next week.")

    summary = []
    if deficiencies:
        summary.append("Deficiencies: " + " ".join(deficiencies))
    if excesses:
        summary.append("Excesses: " + " ".join(excesses))
    if not summary:
        summary.append("All tracked nutrients landed within target ranges.")

    return {"summary": summary, "deficiencies": deficiencies, "excesses": excesses, "callouts": callouts}


def _parse_json(request_body: bytes) -> Dict[str, Any]:
    if not request_body:
        return {}
    return json.loads(request_body.decode("utf-8"))


def _json_response(payload: Any, status: int = HTTPStatus.OK) -> Tuple[int, bytes, str]:
    body = json.dumps(payload).encode("utf-8")
    return status, body, "application/json"


def _static_response(path: Path) -> Tuple[int, bytes, str]:
    if not path.exists() or not path.is_file():
        return HTTPStatus.NOT_FOUND, b"Not found", "text/plain"
    content_type, _ = mimetypes.guess_type(path.name)
    return HTTPStatus.OK, path.read_bytes(), content_type or "application/octet-stream"


def _html_response(path: Path) -> Tuple[int, bytes, str]:
    if not path.exists():
        return HTTPStatus.NOT_FOUND, b"Not found", "text/plain"
    return HTTPStatus.OK, path.read_bytes(), "text/html; charset=utf-8"


def _create_weekly_report() -> Dict[str, Any]:
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=6)
    totals = _aggregate_intakes(start_date, today)
    comparisons = _compare_to_targets(totals, 7)
    narrative = _build_narrative(comparisons)

    report = {
        "id": str(uuid.uuid4()),
        "created_at": datetime.utcnow().isoformat() + "Z",
        "period": {"start": start_date.isoformat(), "end": today.isoformat()},
        "totals": totals,
        "comparisons": comparisons,
        "narrative": narrative,
    }

    reports = _load_reports()
    reports.insert(0, report)
    _save_reports(reports)
    return report


class DietAppHandler(BaseHTTPRequestHandler):
    def _send(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _route_get(self) -> None:
        if self.path == "/":
            status, body, content_type = _html_response(TEMPLATE_DIR / "index.html")
            self._send(status, body, content_type)
            return

        if self.path.startswith("/static/"):
            relative = self.path.replace("/static/", "", 1)
            status, body, content_type = _static_response(STATIC_DIR / relative)
            self._send(status, body, content_type)
            return

        if self.path == "/reports":
            status, body, content_type = _json_response(_load_reports())
            self._send(status, body, content_type)
            return

        if self.path.startswith("/reports/"):
            report_id = self.path.replace("/reports/", "", 1)
            reports = _load_reports()
            report = next((item for item in reports if item["id"] == report_id), None)
            if report is None:
                status, body, content_type = _json_response({"error": "report not found"}, HTTPStatus.NOT_FOUND)
            else:
                status, body, content_type = _json_response(report)
            self._send(status, body, content_type)
            return

        self._send(HTTPStatus.NOT_FOUND, b"Not found", "text/plain")

    def _route_post(self) -> None:
        length = int(self.headers.get("Content-Length", "0"))
        payload = _parse_json(self.rfile.read(length))

        if self.path == "/intake":
            entry = IntakeEntry.from_payload(payload)
            intakes = _load_intakes()
            intakes.append(entry.to_dict())
            _save_intakes(intakes)
            status, body, content_type = _json_response({"status": "ok", "entry": entry.to_dict()})
            self._send(status, body, content_type)
            return

        if self.path == "/reports/weekly":
            report = _create_weekly_report()
            status, body, content_type = _json_response(report, HTTPStatus.CREATED)
            self._send(status, body, content_type)
            return

        self._send(HTTPStatus.NOT_FOUND, b"Not found", "text/plain")

    def do_GET(self) -> None:  # noqa: N802 - required by BaseHTTPRequestHandler
        self._route_get()

    def do_POST(self) -> None:  # noqa: N802 - required by BaseHTTPRequestHandler
        self._route_post()


def run() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    server = ThreadingHTTPServer(("0.0.0.0", 5000), DietAppHandler)
    print("Server running on http://0.0.0.0:5000")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    run()
