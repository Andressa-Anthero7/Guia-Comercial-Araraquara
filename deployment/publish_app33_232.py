"""Publish verified static files as app33, with index last and atomic rollback.

Managed hosting files can belong to a group the SSH user cannot assign.
Static files use the deploying user's ownership and public read permission.
"""
import hashlib
import json
import os
from pathlib import Path
import shutil
import tempfile
import time

home = Path.home()
assert home.name == 'app33'
root = Path('/srv/app33.2d4f02a0.configr.cloud/www')
stage = home / 'releases/2.3.2-e530ed5c'
package = stage / 'package'
manifest = json.loads((package / 'manifest.json').read_text())
assert manifest['version'] == '2.3.2'
files = []
for name, digest in manifest['files'].items():
    if not name.startswith('public/'):
        continue
    relative = Path(name).relative_to('public')
    target = (root / relative).resolve()
    assert root in target.parents
    source = package / name
    assert hashlib.sha256(source.read_bytes()).hexdigest() == digest
    files.append((relative, source, target, digest))
assert any(str(item[0]) == 'index.html' for item in files)
backup = Path(tempfile.mkdtemp(prefix='gca-public-2.3.2-atomic-', dir=root.parent))
previous = {}
for relative, source, target, digest in files:
    previous[str(relative)] = target.exists()
    if target.exists():
        saved = backup / relative
        saved.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(target, saved)
(backup / 'manifest.json').write_text(json.dumps(previous))

def replace(target, content):
    target.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix='.gca-static-', dir=target.parent)
    temporary = Path(name)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(content)
        temporary.chmod(0o644)
        temporary.replace(target)
    finally:
        temporary.unlink(missing_ok=True)

changed = []
try:
    for relative, source, target, digest in sorted(files, key=lambda item: str(item[0]) == 'index.html'):
        if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest() == digest:
            continue
        replace(target, source.read_bytes())
        changed.append((relative, target))
    for relative, source, target, digest in files:
        assert hashlib.sha256(target.read_bytes()).hexdigest() == digest
except Exception:
    for relative, target in reversed(changed):
        if previous[str(relative)]:
            replace(target, (backup / relative).read_bytes())
        else:
            target.unlink()
    raise
record = {'version': '2.3.2', 'installed_at': time.time(), 'verified_files': len(files), 'changed_files': len(changed), 'backup': str(backup)}
(stage / 'installation.json').write_text(json.dumps(record, indent=2))
print(json.dumps(record))
