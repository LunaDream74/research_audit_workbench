import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[3]
api_root = root / "apps" / "api"
sys.path.insert(0, str(api_root))

from app import app

target = root / "packages" / "contracts" / "openapi.json"
target.write_text(json.dumps(app.openapi(), indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"Wrote {target.relative_to(root)}")
