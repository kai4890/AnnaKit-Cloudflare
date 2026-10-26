"""Build the gallery list from browser-compatible images in photography/."""
import json
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg'}
DESCRIPTIONS = {
    'IMG_1067.JPG': 'Black-and-white photograph of a bride walking with her shoes in hand',
    'IMG_1068.JPG': 'Outdoor portrait in a grey jumper and white skirt at sunset',
    'IMG_1069.JPG': 'Black-and-white portrait beside a wooden fence',
    'IMG_1070.JPG': 'Black-and-white close-up of an eye beside a flower',
}

def photo_manifest(folder=None):
    folder = Path(folder) if folder is not None else ROOT / 'photography'
    files = sorted((p for p in folder.rglob('*') if p.is_file()
                    and not p.is_symlink() and p.suffix.lower() in EXTENSIONS
                    and not any(part.startswith('.') for part in p.relative_to(folder).parts)),
                   key=lambda p: p.relative_to(folder).as_posix().casefold())
    return [{'src': 'photography/' + quote(p.relative_to(folder).as_posix(), safe='/'),
             'alt': DESCRIPTIONS.get(p.name, f'Photograph {i + 1} from Anna Kit’s portfolio')}
            for i, p in enumerate(files)]

if __name__ == '__main__':
    (ROOT / 'photography.json').write_text(json.dumps(photo_manifest(), ensure_ascii=False, indent=2) + '\n')
