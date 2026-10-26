"""Prepare the static site and a fresh photo list for deployment."""
import json
import shutil
from photos import ROOT, photo_manifest

output = ROOT / 'dist'
output.mkdir(exist_ok=True)
for name in ('index.html', 'styles.css', 'app.js', 'press-releases.js', 'favicon.svg', 'professionalHeadshot.jpg'):
    shutil.copy2(ROOT / name, output / name)
for name in ('assets', 'vendor', 'press releases', 'photography'):
    destination = output / name
    if destination.exists():
        shutil.rmtree(destination)
    shutil.copytree(ROOT / name, destination, ignore=shutil.ignore_patterns('.DS_Store', '.*'))
photos = photo_manifest()
manifest = json.dumps(photos, ensure_ascii=False, indent=2) + '\n'
(output / 'photography.json').write_text(manifest)
(ROOT / 'photography.json').write_text(manifest)
print(f'Built dist/ with {len(photos)} photographs.')
