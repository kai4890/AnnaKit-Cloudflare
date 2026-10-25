# Anna Kit portfolio

Responsive static HTML/CSS/JavaScript portfolio with seven sections. Anna is now based in Australia; Russian locations describe her professional background.

## Preview

Run `python3 -m http.server 4173` from this directory, then visit `http://localhost:4173`. No build step is needed.

## Content

- `professionalHeadshot.jpg` is the supplied professional portrait.
- LinkedIn is linked directly in `index.html`.
- The PR & Media page has four paired press samples. Clicking a document preview opens a centred modal pop-up displaying the actual PDF and an English/Russian switch. Source PDFs remain available inside the reader. The unmatched buffalo-horn release and its generated translation are no longer displayed; the supplied source file is preserved.
- The duplicate English drug-precursor PDF is retained in the source folder but not linked twice.
- The contact form has been removed. The contact email is `iam@annakit.com.au`, linked directly in `index.html`. LinkedIn uses an accessible icon button.

## Before publishing

Complete other work samples, case-study details and language proficiency. Confirm employment and education dates. The PR employment entry records the supplied start year without asserting current employment after the move.

## Cloudflare static hosting

Deploy `index.html`, `styles.css`, `app.js`, `favicon.svg`, `professionalHeadshot.jpg`, `press-releases.js`, the `assets/` and `vendor/` directories and the linked PDF files in `press releases/`, preserving paths. No framework or build command is required. Keep the resume PDF and `.DS_Store` files out of public uploads. No deployment has been performed.

Google Fonts supplies DM Sans and Manrope; system fonts are used if unavailable. Hash navigation needs no server route rules. Without JavaScript, all sections remain visible and the press cards open their English source PDFs. The bilingual PDF pop-up needs JavaScript. The actual PDF is rendered using the bundled Mozilla PDF.js library, with zoom and a direct source link. Vendor version: 5.6.205; Apache-2.0 license included.

## Visual direction

The user’s reference PDF informed the lilac/pink palette, subtle iridescent background and layered paper treatment. Document thumbnails in `assets/` are rendered from the supplied English PDFs. `press-releases.js` contains text extracted from the eight supplied PDFs, preserving the source wording. No additional translation is generated.
