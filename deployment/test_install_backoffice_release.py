import hashlib
import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import call, patch

spec = importlib.util.spec_from_file_location("installer", Path(__file__).with_name("install_backoffice_release.py"))
installer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(installer)


class InstallerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        base = Path(self.temp.name)
        self.package = base / "package"
        self.root = base / "api"
        (self.root / "core").mkdir(parents=True)
        (self.root / "manage.py").write_text("original manage")
        (self.root / "core/views.py").write_text("Guia Comercial Araraquara API original", encoding="utf-8")
        (self.package / "api/core").mkdir(parents=True)
        files = {}
        for name, contents in (("views.py", "Guia Comercial Araraquara API updated"), ("management.py", "new management")):
            path = f"api/core/{name}"
            (self.package / path).write_text(contents, encoding="utf-8")
            files[path] = hashlib.sha256(contents.encode()).hexdigest()
        (self.package / "manifest.json").write_text(json.dumps({"version": "test", "files": files}))

    def test_check_only_does_not_mutate_target(self):
        installer.apply(self.package, "api", self.root, "python", True)
        self.assertTrue((self.root / "core/views.py").read_text().endswith("original"))
        self.assertFalse((self.root / "core/management.py").exists())

    def test_failed_application_check_restores_all_original_files(self):
        with patch.object(installer.subprocess, "run", side_effect=subprocess.CalledProcessError(1, ["check"])):
            with self.assertRaises(subprocess.CalledProcessError):
                installer.apply(self.package, "api", self.root, "python")
        self.assertTrue((self.root / "core/views.py").read_text().endswith("original"))
        self.assertFalse((self.root / "core/management.py").exists())
        self.assertEqual((self.root / "manage.py").read_text(), "original manage")

    def test_applies_only_listed_files_after_checksum_and_identity_checks(self):
        with patch.object(installer.subprocess, "run") as check:
            installer.apply(self.package, "api", self.root, "python")
        check.assert_called_once_with(["python", "manage.py", "check"], cwd=self.root, check=True)
        self.assertTrue((self.root / "core/views.py").read_text().endswith("updated"))
        self.assertEqual((self.root / "manage.py").read_text(), "original manage")
        self.assertEqual((self.root / "core/management.py").read_text(), "new management")

    def test_rejects_checksum_failure_wrong_project_and_path_escape(self):
        (self.package / "api/core/management.py").write_text("tampered")
        with self.assertRaises(ValueError):
            installer.apply(self.package, "api", self.root, "python")
        (self.root / "core/views.py").write_text("other project")
        with self.assertRaises(ValueError):
            installer.apply(self.package, "api", self.root, "python")
        with self.assertRaises(ValueError):
            installer.inside(self.root, self.root / "../other-project/file")

    def test_package_with_schema_change_checks_then_migrates_forward(self):
        path = self.package / "manifest.json"
        manifest = json.loads(path.read_text())
        manifest["migrate_core"] = True
        path.write_text(json.dumps(manifest))
        with patch.object(installer.subprocess, "run") as run:
            installer.apply(self.package, "api", self.root, "python")
        self.assertEqual(run.call_args_list, [
            call(["python", "manage.py", "check"], cwd=self.root, check=True),
            call(["python", "manage.py", "migrate", "core", "--noinput"], cwd=self.root, check=True),
        ])

    def test_failed_migration_restores_code(self):
        path = self.package / "manifest.json"
        manifest = json.loads(path.read_text())
        manifest["migrate_core"] = True
        path.write_text(json.dumps(manifest))
        with patch.object(installer.subprocess, "run", side_effect=[None, subprocess.CalledProcessError(1, ["migrate"])]):
            with self.assertRaises(subprocess.CalledProcessError):
                installer.apply(self.package, "api", self.root, "python")
        self.assertTrue((self.root / "core/views.py").read_text().endswith("original"))
        self.assertFalse((self.root / "core/management.py").exists())


if __name__ == "__main__":
    unittest.main()
