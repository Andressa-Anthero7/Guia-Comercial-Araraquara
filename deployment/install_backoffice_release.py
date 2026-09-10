"""Apply only the selected application's release, with backup and rollback on failure."""
import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def inside(root, path):
    resolved = path.resolve()
    if resolved == root or root not in resolved.parents:
        raise ValueError(f"Caminho fora da aplicação: {path}")
    return resolved


def discover_api():
    """Report matching applications without reading credentials or changing files."""
    found = []
    for directory, folders, files in os.walk("/srv"):
        folders[:] = [name for name in folders if not name.startswith(".") and name not in {"node_modules", "venv", "gca_venv", "__pycache__", "media", "logs"}]
        folder = Path(directory)
        if len(folder.parts) > 10:
            folders.clear()
        if "manage.py" not in files:
            continue
        views = folder / "core/views.py"
        if not views.is_file():
            continue
        if "Guia Comercial Araraquara API" not in views.read_text(encoding="utf-8", errors="replace"):
            continue
        candidates = []
        for parent in [folder, *list(folder.parents)[:3]]:
            for name in (".venv", "venv", "gca_venv", "env"):
                executable = parent / name / "bin/python"
                if executable.is_file():
                    candidates.append(str(executable))
        found.append({"api_root": str(folder), "python_candidates": candidates})
    print(json.dumps(found, indent=2))


def apply(package, target, root, python=None, check_only=False):
    root = root.resolve(strict=True)
    if not root.is_dir() or root == root.parent:
        raise ValueError("Informe a pasta da aplicação.")
    if target == "api":
        if not (root / "manage.py").is_file() or not (root / "core/views.py").is_file():
            raise ValueError("A pasta informada não contém o backend da API.")
        if "Guia Comercial Araraquara API" not in (root / "core/views.py").read_text(encoding="utf-8"):
            raise ValueError("Este backend não foi identificado como a API do Guia.")
        if not python:
            raise ValueError("Informe --python com o Python utilizado pela aplicação da API.")
    elif not (root / "index.html").is_file():
        raise ValueError("A pasta pública deve conter o index.html atual do Guia.")
    elif "Guia Comercial Araraquara" not in (root / "index.html").read_text(encoding="utf-8"):
        raise ValueError("O index.html não foi identificado como o Guia Comercial Araraquara.")
    manifest = json.loads((package / "manifest.json").read_text())
    selected = []
    prefix = f"{target}/"
    for name, digest in manifest["files"].items():
        if not name.startswith(prefix):
            continue
        source = inside(package.resolve(), package / name)
        destination = inside(root, root / name[len(prefix):])
        if hashlib.sha256(source.read_bytes()).hexdigest() != digest:
            raise ValueError(f"Arquivo do pacote inválido: {name}")
        if destination.exists() and not destination.is_file():
            raise ValueError(f"Destino não é arquivo: {destination}")
        selected.append((source, destination))
    if not selected:
        raise ValueError("Pacote sem arquivos para esta aplicação.")
    print(f"Aplicação: {root}; versão: {manifest['version']}; arquivos: {len(selected)}")
    if check_only:
        print("Conferência concluída. Nenhum arquivo alterado.")
        return
    backup = Path(tempfile.mkdtemp(prefix=f"gca-{target}-{manifest['version']}-", dir=root.parent))
    saved = []
    for _, destination in selected:
        existed = destination.exists()
        relative = destination.relative_to(root)
        if existed:
            old = backup / relative
            old.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(destination, old)
        saved.append({"path": relative.as_posix(), "existed": existed})
    (backup / "backup-manifest.json").write_text(json.dumps({"root": str(root), "files": saved}, indent=2))
    print(f"Backup: {backup}")
    modified = []
    try:
        for source, destination in selected:
            metadata = destination.stat() if destination.exists() else destination.parent.stat() if destination.parent.exists() else root.stat()
            destination.parent.mkdir(parents=True, exist_ok=True)
            modified.append(destination)
            # The destination was resolved and checked before opening it.
            descriptor, name = tempfile.mkstemp(prefix=".gca-write-", dir=destination.parent)
            temporary = Path(name)
            try:
                with os.fdopen(descriptor, "wb") as stream:
                    stream.write(source.read_bytes())
                temporary.chmod(metadata.st_mode & 0o777 if destination.exists() else 0o644)
                if hasattr(os, "chown"):
                    os.chown(temporary, metadata.st_uid, metadata.st_gid)
                os.replace(temporary, destination)
            finally:
                temporary.unlink(missing_ok=True)
        if target == "api":
            subprocess.run([python, "manage.py", "check"], cwd=root, check=True)
    except Exception:
        for destination in reversed(modified):
            old = backup / destination.relative_to(root)
            if old.is_file():
                shutil.copy2(old, destination)
            else:
                destination.unlink(missing_ok=True)
        print("Falha na aplicação; arquivos anteriores restaurados.", file=sys.stderr)
        raise
    print("Arquivos aplicados. Para a API, reinicie somente sua aplicação pelo painel e confira a versão pública.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--discover", action="store_true")
    parser.add_argument("--target", choices=["api", "public"])
    parser.add_argument("--root", type=Path)
    parser.add_argument("--python")
    parser.add_argument("--check-only", action="store_true")
    args = parser.parse_args()
    if args.discover:
        discover_api()
    elif not args.target or not args.root:
        parser.error("Informe --target e --root, ou use --discover para localizar a API.")
    else:
        apply(Path(__file__).resolve().parent, args.target, args.root, args.python, args.check_only)
