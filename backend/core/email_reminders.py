"""Daily reminders, once per invoice/due date/stage; never generate payment links."""
from datetime import timedelta
from django.utils import timezone
from .email_queue import enqueue
from .email_service import portal_url
from .models import Invoice


def queue_reminders(today=None):
    today = today or timezone.localdate()
    count = 0
    for offset, label in [(3, 'Sua fatura vence em três dias'), (0, 'Sua fatura vence hoje'), (-3, 'Lembrete de fatura em atraso')]:
        due = today + timedelta(days=offset)
        for invoice in Invoice.objects.filter(status__in=['open', 'overdue'], due_date=due).select_related('subscription__advertiser'):
            advertiser = invoice.subscription.advertiser
            message = enqueue('invoice_reminder', advertiser.billing_email or advertiser.email, label, [
                f'Fatura #{invoice.pk}. Valor: R$ {invoice.total:.2f}. Vencimento: {due:%d/%m/%Y}.',
                'Consulte os detalhes na área financeira. Se já pagou, confira o registro com o atendimento.',
            ], url=portal_url('/area-do-anunciante/financeiro'),
                key=f'invoice-reminder:{invoice.pk}:{due}:{offset}',
                guard={'model': 'Invoice', 'filters': {'pk': invoice.pk, 'status__in': ['open', 'overdue'],
                    'due_date': due.isoformat(), 'amount': str(invoice.amount),
                    'discount': str(invoice.discount), 'late_fee': str(invoice.late_fee)}})
            if message:
                # A reminder queued yesterday should not claim "today" after a long outage.
                deadline = timezone.now() + timedelta(hours=12)
                if message.expires_at > deadline:
                    message.expires_at = deadline
                    message.save(update_fields=['expires_at'])
                count += 1
    return count
