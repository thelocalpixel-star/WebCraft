"""Run Google Lighthouse on WebCraft pages without creating Analytics visits."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--output", type=Path, required=True)
parser.add_argument("--base-url", default="https://localwebcraft.com")
parser.add_argument("--workers", type=int, default=2)
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
locations = json.loads((ROOT / "scripts/city-content-map.json").read_text())
pages = ["index.html", "web-design.html", "web-hosting.html", "local-seo.html", "google-ads.html", "analytics.html"]
pages.extend(row["service"] for row in locations)

def audit(task):
    page, device = task
    url = args.base_url.rstrip("/") + "/" + ("" if page == "index.html" else page)
    target = args.output.resolve() / (Path(page).stem + "-" + device)
    command = ["npx", "--yes", "lighthouse@13.6.0", url + "?webcraft_test=1",
               "--chrome-flags=--headless=new", "--output=html", "--output=json",
               "--output-path=" + str(target), "--quiet"]
    if device == "desktop":
        command.append("--preset=desktop")
    try:
        subprocess.run(command, check=True, capture_output=True, text=True, timeout=180)
        report = json.loads(target.with_suffix(".report.json").read_text())
        if report.get("runtimeError"):
            raise RuntimeError(str(report["runtimeError"]))
        scores = {name: category["score"] for name, category in report["categories"].items()}
        failures = [{"id": key, "title": value["title"]} for key, value in report["audits"].items()
                    if value.get("score") is not None and value["score"] < 1
                    and value.get("scoreDisplayMode") not in ("informative", "manual", "notApplicable")]
        result = {"page": page, "device": device, "scores": scores, "findings": failures}
    except Exception as error:
        result = {"page": page, "device": device, "error": str(error)}
    print(json.dumps(result), flush=True)
    return result

with ThreadPoolExecutor(max_workers=args.workers) as executor:
    results = list(executor.map(audit, ((page, device) for page in pages for device in ("mobile", "desktop"))))
(args.output / "summary.json").write_text(json.dumps(results, indent=2))
raise SystemExit(1 if any("error" in result for result in results) else 0)
