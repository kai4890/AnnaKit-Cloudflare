# Anna Kit portfolio

Static portfolio with Home, PR & Media, Social & Content, Video & Production, About Me and Contact pages.

## Local preview

Run `python3 scripts/serve.py --port 4174`, then open `http://127.0.0.1:4174`.
The preview scans `photography/` whenever the gallery requests its photo list. Add or remove photos, then refresh the page or return to Video & Production.

## Photography

Place images in `photography/`. JPG, JPEG, PNG, WebP, GIF, AVIF and SVG files are supported, including subfolders. Hidden files and unsupported formats are ignored. Images are sorted by filename. The carousel and full-size viewer use every image in the generated list; no HTML edits are needed. Empty and single-photo folders are supported.

`python3 scripts/photos.py` refreshes `photography.json` when using a plain static preview server.

## Build and Cloudflare Pages

- Build command: `python3 scripts/build.py`
- Build output directory: `dist`

Each build scans the photo folder and creates a fresh manifest, then copies the website and its assets to `dist/`. For manual uploads, run the build and upload `dist/`. For Git-connected deployment, use the build command above so photo additions and removals are picked up on every deployment. A deployed static site updates when a new build is deployed; it cannot inspect a folder on your computer.

The output includes the photography folder, portrait, document previews, bilingual press-release PDFs and bundled PDF.js. Source scripts, the resume PDF and `.DS_Store` files are excluded. No deployment is performed by the build.

## Features

Press releases open in a modal with English/Russian PDFs, zoom and source links. Video projects use YouTube embeds. Social & Content displays selected Instagram embeds. Contact links are maintained in `index.html`. Hash navigation needs no server route rules.

Google Fonts supplies DM Sans and Manrope. PDF.js 5.6.205 is bundled under its included Apache-2.0 licence.
