"""Read-only public release checks; keep checking after individual failures."""
import json
import ssl
import urllib.error
import urllib.request
from datetime import datetime, timezone


def check_url(url):
    result = {"url": url}
    try:
        with urllib.request.urlopen(url, timeout=25) as response:
            body = response.read().decode("utf-8", errors="replace")
            result.update(status=response.status, content_type=response.headers.get("Content-Type"))
            if "application/json" in result["content_type"]:
                data = json.loads(body)
                if isinstance(data, list):
                    result["count"] = len(data)
                    result["subdomains"] = [item["public_subdomain"] for item in data if isinstance(item, dict) and item.get("public_subdomain")]
                elif url.endswith("/health/"):
                    result["health"] = data
            else:
                result["portal_html"] = "Guia Comercial Araraquara" in body
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        result.update(status=error.code, debug_page="Using the URLconf" in body or "DEBUG = True" in body)
    except (urllib.error.URLError, OSError, ssl.SSLError) as error:
        result["error"] = str(error)
    return result


def main():
    public = "https://guiacomararaquara.com.br"
    api = "https://webapp415078.ip-45-79-2-160.cloudezapp.io"
    paths = ["/", "/anunciante/login", "/area-do-anunciante", "/backoffice", "/api/health/",
             "/api/categories/", "/api/businesses/", "/api/reviews/", "/api/coupons/",
             "/api/events/", "/api/useful-numbers/", "/api/auth/session/", "/api/backoffice/businesses/",
             "/api/advertiser/portal/", "/api/__gca_audit_missing__/"]
    checks = [check_url(public + path) for path in paths]
    checks.extend(check_url(api + path) for path in ["/api/health/", "/api/__gca_audit_missing__/"])
    subdomains = {"m-espetinhos"}
    for result in checks:
        subdomains.update(result.get("subdomains", []))
    checks.extend(check_url(f"https://{name}.guiacomararaquara.com.br/") for name in sorted(subdomains))
    print(json.dumps({"checked_at": datetime.now(timezone.utc).isoformat(), "checks": checks}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
