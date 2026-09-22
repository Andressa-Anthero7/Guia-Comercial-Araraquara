"""Read existing backup metadata and integrity without changing any database."""
import json
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path

directory = Path.home() / "deploy-backups" / "periodic"
files = sorted(directory.glob("gca-*.sqlite3"))
result = {"checked_at": datetime.now(timezone.utc).isoformat(), "backups_count": len(files)}
if files:
    latest = files[-1]
    result["latest_name"] = latest.name
    result["age_hours"] = round((datetime.now(timezone.utc).timestamp() - latest.stat().st_mtime) / 3600, 2)
    with closing(sqlite3.connect(latest.as_uri() + "?mode=ro", uri=True)) as connection:
        result["integrity"] = connection.execute("PRAGMA integrity_check").fetchone()[0]
    metadata = latest.with_suffix(".json")
    if metadata.exists():
        result["recorded_restore_drill"] = json.loads(metadata.read_text()).get("restore_drill")
print(json.dumps(result, indent=2))
