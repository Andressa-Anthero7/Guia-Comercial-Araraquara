"""Read-only continuation checks. Never emits credentials or customer records."""
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

home = Path.home()
root = Path('/srv/gca-backend.2d4f02a0.configr.cloud/www')
cron = subprocess.run(['crontab', '-l'], capture_output=True, text=True)
log = home / 'operations/billing.log'
runs = []
if log.exists():
    for line in log.read_text().splitlines():
        try:
            item = json.loads(line)
            if 'at' in item and 'result' in item:
                runs.append(item)
        except ValueError:
            pass
state_path = home / 'deploy-backups/readiness-20260923-accounts.json'
state = json.loads(state_path.read_text()) if state_path.exists() else None
print(json.dumps({
    'checked_at': datetime.now(timezone.utc).isoformat(),
    'billing_scheduled': '# gca-daily-invoice-renewal' in cron.stdout,
    'billing_runs': runs[-3:],
    'temporary_audit_accounts_pending': bool(state),
    'audit_prefix': state['prefix'] if state else None,
    'email_migration_present': (root / 'core/migrations/0018_transactionalemail.py').exists(),
    'email_worker_present': (root / 'run_email.py').exists(),
}, indent=2))
