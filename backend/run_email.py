"""Outbox worker: inspect by default; --send explicitly enables processing.

Load the same environment as the API before invoking. Never prints recipients,
message contents, tokens or SMTP credentials.
"""
import argparse
import json
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
import django
django.setup()
from django.db.models import Count
from core.models import TransactionalEmail
from core.email_queue import process_outbox


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--send', action='store_true')
    parser.add_argument('--queue-reminders', action='store_true')
    parser.add_argument('--limit', type=int, default=100)
    args = parser.parse_args()
    if not 1 <= args.limit <= 1000:
        parser.error('--limit must be between 1 and 1000')
    if args.queue_reminders:
        from core.email_reminders import queue_reminders
        print(json.dumps({'reminders_considered': queue_reminders()}))
    if args.send:
        try:
            print(json.dumps(process_outbox(args.limit)))
        except ValueError as error:
            parser.error(str(error))
    else:
        print(json.dumps(list(TransactionalEmail.objects.values('status').annotate(count=Count('id')).order_by('status'))))
