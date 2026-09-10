"""Package the tested build without credentials, databases or server configuration."""
import hashlib
import json
import shutil
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
version = json.loads((root / "frontend/package.json").read_text())["version"]
dist = root / "frontend/dist"
if not (dist / "index.html").is_file():
    raise SystemExit("Execute npm run build no frontend antes de empacotar.")
output = root / "output/backoffice-v2"
output.mkdir(parents=True, exist_ok=True)
files = {}
for name in ("management.py", "management_rules.py", "serializers.py", "urls.py", "views.py"):
    files[f"api/core/{name}"] = root / "backend/core" / name
for source in dist.rglob("*"):
    if source.is_file():
        relative = source.relative_to(dist)
        destination = root / "backend/backoffice_frontend" / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        files[f"api/backoffice_frontend/{relative.as_posix()}"] = source
        files[f"public/{relative.as_posix()}"] = source
manifest = {"version": version, "files": {name: hashlib.sha256(path.read_bytes()).hexdigest() for name, path in files.items()}}
archive = output / f"gca-backoffice-{version}.zip"
with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as package:
    for name, source in files.items():
        package.write(source, name)
    package.writestr("manifest.json", json.dumps(manifest, indent=2))
    package.write(root / "deployment/install_backoffice_release.py", "install.py")
    package.write(root / "deployment/BACKOFFICE-2.0.md", "LEIA-ME.md")
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
archive.with_suffix(".sha256").write_text(f"{digest}  {archive.name}\n", encoding="utf-8")
print(f"Pacote: {archive}")
print(f"Arquivos de aplicação: {len(files)}; SHA256: {digest}")
