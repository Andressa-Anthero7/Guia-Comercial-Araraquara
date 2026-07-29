import importlib
import os
from unittest import TestCase, mock

from django.conf import settings


class UploadSettingsTests(TestCase):
    def test_json_upload_limit_matches_hosting_limit(self):
        self.assertEqual(settings.DATA_UPLOAD_MAX_MEMORY_SIZE, 50 * 1024 * 1024)

    def test_file_memory_limit_is_ten_megabytes(self):
        self.assertEqual(settings.FILE_UPLOAD_MAX_MEMORY_SIZE, 10 * 1024 * 1024)


class DatabaseSettingsTests(TestCase):
    def test_database_url_configures_postgresql(self):
        with mock.patch.dict(
            os.environ,
            {"DATABASE_URL": "postgresql://user:password@db.example.com:5432/guia"},
        ):
            from project import settings as project_settings

            reloaded = importlib.reload(project_settings)

        database = reloaded.DATABASES["default"]
        self.assertEqual(database["ENGINE"], "django.db.backends.postgresql")
        self.assertEqual(database["NAME"], "guia")
        self.assertEqual(database["HOST"], "db.example.com")
        self.assertEqual(database["PORT"], 5432)

        importlib.reload(project_settings)
