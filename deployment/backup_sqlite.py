"""Consistent SQLite backup with an isolated restore drill and bounded retention.

Run from cron with --database and --destination outside the public web root.
No live database is overwritten during the restore test.
"""
import argparse
import hashlib
import json
import os
import sqlite3
import tempfile
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path


def backup(database, destination, keep=30):
    database, destination = Path(database).resolve(), Path(destination).resolve()
    if not database.is_file() or keep < 2:
        raise ValueError("Existing database and retention >= 2 are required")
    destination.mkdir(parents=True, exist_ok=True)
    os.chmod(destination, 0o700)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    target = destination / f"gca-{stamp}.sqlite3"
    connection = sqlite3.connect(database.as_uri() + "?mode=ro", uri=True, timeout=30)
    try:
        with closing(sqlite3.connect(target)) as copy:
            connection.backup(copy)
            if copy.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                raise RuntimeError("Backup integrity check failed")
        os.chmod(target, 0o600)
        # Restore into a temporary, separate database and compare table counts.
        with tempfile.TemporaryDirectory(prefix="gca-restore-", dir=destination) as temp:
            with closing(sqlite3.connect(target)) as source, closing(sqlite3.connect(Path(temp)/"restored.sqlite3")) as restored:
                source.backup(restored)
                if restored.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                    raise RuntimeError("Restore integrity check failed")
                counts = {}
                for (name,) in source.execute("SELECT name FROM sqlite_master WHERE type='table'"):
                    quoted = '"' + name.replace('"', '""') + '"'
                    count = source.execute(f"SELECT count(*) FROM {quoted}").fetchone()[0]
                    if count != restored.execute(f"SELECT count(*) FROM {quoted}").fetchone()[0]:
                        raise RuntimeError("Restore table count mismatch")
                    counts[name] = count
        record = {"backup": str(target), "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
                  "created_at": stamp, "integrity": "ok", "restore_drill": "passed", "tables": counts}
        target.with_suffix(".json").write_text(json.dumps(record, indent=2))
        os.chmod(target.with_suffix(".json"), 0o600)
        # Remove only backups created by this script, after successful verification.
        for expired in sorted(destination.glob("gca-*.sqlite3"), reverse=True)[keep:]:
            if expired.resolve().parent != destination or expired.is_symlink():
                raise RuntimeError("Unexpected backup path")
            expired.unlink()
            expired.with_suffix(".json").unlink(missing_ok=True)
        return record
    finally:
        connection.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--database", required=True)
    parser.add_argument("--destination", required=True)
    parser.add_argument("--keep", type=int, default=30)
    args = parser.parse_args()
    print(json.dumps(backup(args.database, args.destination, args.keep)))
