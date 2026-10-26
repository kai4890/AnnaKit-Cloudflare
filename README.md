# Anna Kit portfolio

Static portfolio with Home, PR & Media, Social & Content, Video & Production, About Me and Contact pages.

## Local preview

Run `python3 scripts/serve.py --port 4174`, then open `http://127.0.0.1:4174`.
The preview scans `photography/` whenever the gallery requests its photo list. Add or remove photos, then refresh the page or return to Video & Production.

## Photography

Place images in `photography/`. JPG, JPEG, PNG, WebP, GIF, AVIF and SVG files are supported, including subfolders. Hidden files and unsupported formats are ignored. Images are sorted by filename. The carousel and full-size viewer use every image in the generated list; no HTML edits are needed. Empty and single-photo folders are supported.

`python3 scripts/photos.py` refreshes `photography.json` when using a plain static preview server.

## Build and deploy on Cloudflare Workers

Keep the Worker deploy command as `npx wrangler deploy`. The Wrangler config publishes the repository root directly, and `.assetsignore` limits uploads to the website and its public media. This avoids a separate build step in Cloudflare. The Worker name in `wrangler.jsonc` must match the name of the Worker connected to this repository in Cloudflare.

For a local build, run `python3 scripts/build.py`.

Run `python3 scripts/build.py` before committing changes to the photography folder. It scans the folder and refreshes `photography.json`; Cloudflare then deploys that manifest and the images with the site. A deployed static site updates when a new deployment is made; it cannot inspect a folder on your computer.

For a local `dist/` build, the output includes the photography folder, portrait, document previews, bilingual press-release PDFs and bundled PDF.js. Source scripts, the resume PDF and `.DS_Store` files are excluded. The build script does not deploy the site.

## Features

Press releases open in a modal with English/Russian PDFs, zoom and source links. Video projects use YouTube embeds. Social & Content displays selected Instagram embeds. Contact links are maintained in `index.html`. Hash navigation needs no server route rules.

Google Fonts supplies DM Sans and Manrope. PDF.js 5.6.205 is bundled under its included Apache-2.0 licence.
