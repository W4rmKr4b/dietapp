from __future__ import annotations

import json
import sqlite3
from datetime import datetime
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs

from services.goal_targets import build_prompt, derive_targets

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "goal_targets.sqlite"


def init_db() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                goal_text TEXT NOT NULL,
                gpt_prompt TEXT NOT NULL,
                targets_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


def store_goal(goal_text: str, prompt: str, targets: dict) -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO goals (goal_text, gpt_prompt, targets_json, created_at) VALUES (?, ?, ?, ?)",
            (goal_text, prompt, json.dumps(targets), datetime.utcnow().isoformat()),
        )
        conn.commit()


def fetch_latest_goal() -> dict | None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT goal_text, targets_json, created_at FROM goals ORDER BY id DESC LIMIT 1"
        ).fetchone()
    if not row:
        return None
    return {
        "goal_text": row["goal_text"],
        "targets": json.loads(row["targets_json"]),
        "created_at": row["created_at"],
    }


class GoalHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path == "/":
            self._render_home()
        elif self.path == "/report":
            self._render_report()
        else:
            self.send_error(HTTPStatus.NOT_FOUND, "Not Found")

    def do_POST(self) -> None:
        if self.path != "/goal":
            self.send_error(HTTPStatus.NOT_FOUND, "Not Found")
            return
        length = int(self.headers.get("Content-Length", 0))
        payload = self.rfile.read(length).decode("utf-8")
        data = parse_qs(payload)
        goal_text = (data.get("goal", [""])[0] or "").strip()
        if not goal_text:
            self.send_error(HTTPStatus.BAD_REQUEST, "Goal text is required")
            return
        prompt = build_prompt(goal_text)
        targets = derive_targets(goal_text)
        store_goal(goal_text, prompt, targets)
        self.send_response(HTTPStatus.SEE_OTHER)
        self.send_header("Location", "/report")
        self.end_headers()

    def _render_home(self) -> None:
        html = """
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="utf-8" />
            <title>Diet Goals</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 720px; margin: 40px auto; }
                textarea { width: 100%; min-height: 140px; padding: 12px; }
                button { margin-top: 12px; padding: 10px 18px; }
                .hint { color: #666; font-size: 0.9rem; }
            </style>
        </head>
        <body>
            <h1>Nutrition Goal</h1>
            <p class="hint">Describe your goal (e.g., build muscle, lose weight, run a marathon).</p>
            <form method="post" action="/goal">
                <label for="goal">Goal</label>
                <textarea id="goal" name="goal" placeholder="Type your goal here..."></textarea>
                <button type="submit">Save Goal</button>
            </form>
        </body>
        </html>
        """
        self._send_html(html)

    def _render_report(self) -> None:
        latest = fetch_latest_goal()
        if not latest:
            body = "<p>No goals saved yet. <a href=\"/\">Add one</a>.</p>"
        else:
            targets = latest["targets"]
            body = f"""
            <h2>Latest Goal</h2>
            <p><strong>Goal:</strong> {latest["goal_text"]}</p>
            <p><strong>Saved:</strong> {latest["created_at"]}</p>
            <h3>Target Nutrient Ranges</h3>
            <ul>
                <li>Calories: {targets["calories"]["min"]} - {targets["calories"]["max"]}</li>
                <li>Protein (g): {targets["protein_g"]["min"]} - {targets["protein_g"]["max"]}</li>
                <li>Carbs (g): {targets["carbs_g"]["min"]} - {targets["carbs_g"]["max"]}</li>
                <li>Fat (g): {targets["fat_g"]["min"]} - {targets["fat_g"]["max"]}</li>
            </ul>
            <p><a href="/">Update goal</a></p>
            """
        html = f"""
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="utf-8" />
            <title>Goal Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; max-width: 720px; margin: 40px auto; }}
            </style>
        </head>
        <body>
            <h1>Goal Report</h1>
            {body}
        </body>
        </html>
        """
        self._send_html(html)

    def _send_html(self, html: str) -> None:
        encoded = html.encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


if __name__ == "__main__":
    init_db()
    server = HTTPServer(("0.0.0.0", 8000), GoalHandler)
    print("Serving on http://0.0.0.0:8000")
    server.serve_forever()
