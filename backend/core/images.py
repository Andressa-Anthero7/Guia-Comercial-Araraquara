"""Public raster images are delivered separately from the catalog JSON."""
import base64
import binascii
import hashlib

from django.conf import settings
from django.core.validators import URLValidator
from django.http import Http404, HttpResponse
from django.shortcuts import redirect
from rest_framework import serializers


def decode_image(value):
    try:
        header, encoded = value.split(",", 1)
        content_type = header.removeprefix("data:").removesuffix(";base64")
        if header != f"data:{content_type};base64":
            raise ValueError
        limit = settings.FILE_UPLOAD_MAX_MEMORY_SIZE
        if len(encoded) > (limit + 2) // 3 * 4:
            raise ValueError
        data = base64.b64decode(encoded, validate=True)
        signatures = {
            "image/png": data.startswith(b"\x89PNG\r\n\x1a\n"),
            "image/jpeg": data.startswith(b"\xff\xd8\xff"),
            "image/gif": data.startswith((b"GIF87a", b"GIF89a")),
            "image/webp": data.startswith(b"RIFF") and data[8:12] == b"WEBP",
        }
        if not signatures.get(content_type) or len(data) > limit:
            raise ValueError
        return content_type, data
    except (ValueError, binascii.Error) as error:
        raise ValueError("Envie uma imagem PNG, JPEG, GIF ou WebP válida, de até 10 MB.") from error


class PublicImageField(serializers.CharField):
    def to_internal_value(self, value):
        value = super().to_internal_value(value)
        if value.startswith("data:"):
            try:
                decode_image(value)
            except ValueError as error:
                raise serializers.ValidationError(str(error)) from error
        elif value:
            # External images are returned as URLs, never fetched by the API.
            from django.core.exceptions import ValidationError
            try:
                URLValidator(schemes=["http", "https"])(value)
            except ValidationError as error:
                raise serializers.ValidationError("Informe uma URL HTTP/HTTPS válida ou envie uma imagem.") from error
        return value


def public_image_url(value, path, request=None):
    if not value.startswith("data:"):
        return value
    # A replaced image must not reuse a browser's cached copy of the old file.
    path = f"{path}?v={hashlib.sha256(value.encode()).hexdigest()[:16]}"
    return request.build_absolute_uri(path) if request else path


def image_response(value):
    if not value:
        raise Http404("Imagem não encontrada.")
    if not value.startswith("data:"):
        return redirect(value)
    try:
        content_type, data = decode_image(value)
    except ValueError as error:
        raise Http404("Imagem inválida.") from error
    response = HttpResponse(data, content_type=content_type)
    response["Cache-Control"] = "public, max-age=3600"
    response["X-Content-Type-Options"] = "nosniff"
    return response
