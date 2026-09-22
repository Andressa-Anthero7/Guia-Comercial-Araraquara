"""Cron entrypoint; load the production environment before invoking this file."""
import json
import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")
import django
django.setup()
from core.billing import renew_subscriptions

if __name__ == "__main__":
    print(json.dumps(renew_subscriptions()))
