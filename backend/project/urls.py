import mimetypes
from pathlib import Path

from django.conf import settings
from django.contrib import admin
from django.http import FileResponse, Http404
from django.urls import include, path, re_path


def backoffice_index(request):
    index_path = Path(settings.BACKOFFICE_DIST_ROOT) / "index.html"
    if not index_path.is_file():
        raise Http404("Backoffice ainda nao foi publicado.")
    return FileResponse(index_path.open("rb"), content_type="text/html")


def backoffice_asset(request, asset_path):
    root = Path(settings.BACKOFFICE_DIST_ROOT).resolve()
    file_path = (root / "assets" / asset_path).resolve()
    if root not in file_path.parents or not file_path.is_file():
        raise Http404("Arquivo nao encontrado.")
    content_type, _ = mimetypes.guess_type(file_path.name)
    return FileResponse(file_path.open("rb"), content_type=content_type)


def service_worker(request):
    file_path = Path(settings.BACKOFFICE_DIST_ROOT) / "sw.js"
    if not file_path.is_file():
        raise Http404("Service worker ainda nao foi publicado.")
    response = FileResponse(file_path.open("rb"), content_type="text/javascript")
    response["Service-Worker-Allowed"] = "/"
    response["Cache-Control"] = "no-cache"
    return response

urlpatterns = [
    path("sw.js", service_worker),
    re_path(r"^assets/(?P<asset_path>.+)$", backoffice_asset),
    re_path(r"^backoffice(?:/.*)?$", backoffice_index),
    re_path(r"^anunciante(?:/.*)?$", backoffice_index),
    re_path(r"^area-do-anunciante(?:/.*)?$", backoffice_index),
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
]
