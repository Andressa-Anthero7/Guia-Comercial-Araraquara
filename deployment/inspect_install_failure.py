import json
import os
import hashlib
from pathlib import Path

root=Path('/srv/gca-backend.2d4f02a0.configr.cloud/www')
stage=Path.home()/'releases/2.3.1-cb8a1a81'
manifest=json.loads((stage/'package/manifest.json').read_text())
backup=root.parent/'gca-api-2.3.1-y_0amzu7'
saved=json.loads((backup/'backup-manifest.json').read_text())
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
restored=[]
for entry in saved['files']:
    path=root/entry['path']
    if entry['existed']:
        restored.append(path.exists() and sha(path)==sha(backup/entry['path']))
    else:
        restored.append(not path.exists())
owners=[]
for name in manifest['files']:
    if not name.startswith('api/'):
        continue
    path=root/name[4:]
    meta=path.stat() if path.exists() else path.parent.stat() if path.parent.exists() else root.stat()
    if meta.st_uid != os.getuid() or meta.st_gid not in os.getgroups():
        owners.append({'path':str(path.relative_to(root)),'uid':meta.st_uid,'gid':meta.st_gid,'writable':os.access(path if path.exists() else path.parent,os.W_OK)})
print(json.dumps({'all_application_files_restored':all(restored),'checked_files':len(restored),'uid':os.getuid(),'groups':os.getgroups(),'ownership_mismatches':owners},indent=2))
