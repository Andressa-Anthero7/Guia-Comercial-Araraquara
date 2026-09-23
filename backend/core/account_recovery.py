"""Advertiser password recovery with expiring, single-use Django tokens."""
from smtplib import SMTPException

from django.conf import settings
from django.contrib.auth import get_user_model, password_validation
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle

from .email_service import email_connection, deliver, portal_url


class RecoveryThrottle(SimpleRateThrottle):
    scope = "account_recovery"
    rate = "10/hour"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


def send_access_link(user, connection):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    url = portal_url(f"/anunciante/login?uid={uid}&token={token}")
    deliver(user.email, "Redefina sua senha", [
        "Olá! Recebemos uma solicitação para redefinir a senha da sua conta.",
        f"O link é de uso único e expira em {settings.PASSWORD_RESET_TIMEOUT // 60} minutos. Se não solicitou, ignore esta mensagem; sua senha permanece a mesma.",
    ], url=url, action="Definir nova senha", connection=connection)



@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([RecoveryThrottle])
def request_password_reset(request):
    connection = email_connection()
    if connection is None:
        return Response({"detail": "Recuperação temporariamente indisponível. Entre em contato com o Guia."}, status=503)
    email = request.data.get("email", "")
    if not isinstance(email, str) or len(email) > 254:
        return Response({"email": "Informe um e-mail válido."}, status=400)
    users = get_user_model().objects.filter(email__iexact=email.strip(), is_active=True,
        advertiser_profile__status="active", is_staff=False)
    try:
        for user in users:
            send_access_link(user, connection)
    except (SMTPException, OSError, ValueError):
        return Response({"detail": "Não foi possível enviar a mensagem agora. Tente novamente mais tarde."}, status=503)
    return Response({"detail": "Se o e-mail estiver vinculado a uma conta ativa, você receberá um link para redefinir a senha."})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([RecoveryThrottle])
def confirm_password_reset(request):
    try:
        uid = urlsafe_base64_decode(request.data.get("uid", "")).decode()
        user = get_user_model().objects.get(pk=uid, is_active=True, is_staff=False, advertiser_profile__status="active")
        token = request.data.get("token", "")
        if not isinstance(token, str) or not default_token_generator.check_token(user, token):
            raise ValueError
    except (ValueError, TypeError, OverflowError, UnicodeError, get_user_model().DoesNotExist):
        return Response({"detail": "Link inválido ou expirado. Solicite um novo link."}, status=400)
    password = request.data.get("password", "")
    if not isinstance(password, str) or len(password) > 256:
        return Response({"password": "Senha inválida."}, status=400)
    try:
        password_validation.validate_password(password, user)
    except ValidationError as error:
        return Response({"password": error.messages}, status=400)
    user.set_password(password)
    user.save(update_fields=["password"])
    return Response({"detail": "Senha redefinida. Entre com sua nova senha."})
