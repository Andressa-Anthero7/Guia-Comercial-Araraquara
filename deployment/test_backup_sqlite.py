import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from deployment.backup_sqlite import backup


class BackupTests(unittest.TestCase):
    def test_backup_restore_and_retention_preserve_live_database(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            database = root / "live.sqlite3"
            with closing(sqlite3.connect(database)) as connection, connection:
                connection.execute("CREATE TABLE records (id INTEGER PRIMARY KEY, value TEXT)")
                connection.execute("INSERT INTO records (value) VALUES ('preserved')")
            before = database.read_bytes()
            for _ in range(3):
                result = backup(database, root / "backups", keep=2)
                self.assertEqual(result["restore_drill"], "passed")
                self.assertEqual(result["tables"]["records"], 1)
            self.assertEqual(len(list((root/"backups").glob("*.sqlite3"))), 2)
            self.assertEqual(database.read_bytes(), before)


if __name__ == "__main__":
    unittest.main()
