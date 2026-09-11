"""External availability, HTTPS and debug-page checks; suitable for GitHub Actions."""
import json
import socket
import ssl
import time
import urllib.error
import urllib.request

API = "webapp415078.ip-45-79-2-160.cloudezapp.io"
HOSTS = ["guiacomararaquara.com.br", "m-espetinhos.guiacomararaquara.com.br", API]


def check():
    checks = []
    for host in HOSTS:
        with socket.create_connection((host, 443), timeout=20) as sock:
            with ssl.create_default_context().wrap_socket(sock, server_hostname=host) as secure:
                expiry = ssl.cert_time_to_seconds(secure.getpeercert()["notAfter"])
        days = int((expiry - time.time()) / 86400)
        if days < 14:
            raise RuntimeError(f"Certificado de {host} vence em {days} dias")
        path = "/api/health/" if host == API else "/"
        with urllib.request.urlopen(f"https://{host}{path}", timeout=20) as response:
            body = response.read().decode("utf-8", errors="replace")
            assert response.status == 200
            if host == API:
                assert json.loads(body)["status"] == "ok"
            else:
                assert "Guia Comercial Araraquara" in body
        checks.append({"host": host, "status": 200, "certificate_days": days})
    try:
        urllib.request.urlopen(f"https://{API}/api/__gca_monitor_missing__/", timeout=20)
    except urllib.error.HTTPError as response:
        body = response.read().decode(errors="replace")
        assert response.code == 404
        assert "Using the URLconf" not in body and "DEBUG = True" not in body
    else:
        raise RuntimeError("Expected a 404 for unknown routes")
    return checks


if __name__ == "__main__":
    print(json.dumps(check(), indent=2))
