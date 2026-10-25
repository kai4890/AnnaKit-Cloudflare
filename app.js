const pages = [...document.querySelectorAll('main > .page')];
const navigation = document.querySelector('#primary-nav');
const menuToggle = document.querySelector('.menu-toggle');
const titles = {
  home: 'PR & Content',
  'pr-media': 'PR & Media',
  'social-content': 'Social & Content',
  'video-production': 'Video & Production',
  about: 'About Me',
  contact: 'Contact',
};

function closeMenu() {
  navigation.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
}
function showPage({ focus = false } = {}) {
  const requested = location.hash.slice(1) || 'home';
  // The skip link targets the landmark, rather than a portfolio page.
  if (requested === 'main') {
    document.querySelector('#main').focus();
    return;
  }
  const id = Object.hasOwn(titles, requested) ? requested : 'home';
  for (const page of pages) page.hidden = page.id !== id;
  // Load the hosted player only on its page, and stop playback when leaving.
  for (const video of document.querySelectorAll('[data-video-src]')) {
    if (video.closest('.page').hidden) video.removeAttribute('src');
    else if (!video.hasAttribute('src')) video.src = video.dataset.videoSrc;
  }
  for (const link of navigation.querySelectorAll('a')) {
    if (link.hash === `#${id}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  document.title = `Anna Kit — ${titles[id]}`;
  closeMenu();
  if (focus) {
    const heading = document.querySelector(`#${id} h1`);
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}
menuToggle.addEventListener('click', () => {
  const isOpen = navigation.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});
navigation.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('open')) {
    closeMenu();
    menuToggle.focus();
  }
});
window.addEventListener('hashchange', () => showPage({ focus: true }));
showPage();
document.querySelector('#year').textContent = new Date().getFullYear();

// Native dialog supplies modal focus management and Escape-to-close.
const reader = document.querySelector('#release-reader');
const readerContent = document.querySelector('#reader-content');
const languageButtons = [...document.querySelectorAll('[data-reader-language]')];
let activeRelease = null;
let readerLanguage = 'en';
let readerTrigger = null;

function renderRelease() {
  const version = activeRelease.versions[readerLanguage];
  readerContent.lang = readerLanguage;
  document.querySelector('#reader-title').textContent = version.title;
  loadPdf(version);
  const pdf = document.querySelector('#reader-pdf');
  pdf.href = version.pdf;
  pdf.hreflang = readerLanguage;
  pdf.textContent = readerLanguage === 'en' ? 'Open English PDF in a new tab' : 'Открыть русский PDF в новой вкладке';
  for (const button of languageButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.readerLanguage === readerLanguage));
  }
  const status = document.querySelector('#reader-status');
  status.lang = readerLanguage;
  status.textContent = readerLanguage === 'en' ? 'Showing English translation.' : 'Показан оригинал на русском языке.';
}
for (const link of document.querySelectorAll('[data-release]')) {
  link.addEventListener('click', event => {
    // Keep modified clicks available as ordinary PDF links.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    activeRelease = pressReleases.find(release => release.id === link.dataset.release);
    readerTrigger = link;
    reader.showModal();
    renderRelease();
    document.body.classList.add('reader-open');
    document.querySelector('.reader-close').focus();
  });
}
for (const button of languageButtons) {
  button.addEventListener('click', () => {
    readerLanguage = button.dataset.readerLanguage;
    renderRelease();
  });
}
document.querySelector('.reader-close').addEventListener('click', () => reader.close());
reader.addEventListener('click', event => {
  const bounds = reader.getBoundingClientRect();
  if (event.target === reader && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) reader.close();
});
reader.addEventListener('close', () => {
  document.body.classList.remove('reader-open');
  pdfRequest++;
  pdfLoadingTask?.destroy();
  pdfLoadingTask = null;
  document.querySelector('#reader-document').replaceChildren();
  readerTrigger?.focus({ preventScroll: true });
});
window.addEventListener('hashchange', () => { if (reader.open) reader.close(); });

// Render the actual source PDF locally rather than depending on a browser PDF plugin.
let pdfModule;
let pdfLoadingTask = null;
let pdfRequest = 0;
let resizeTimer;
let lastPdfWidth = 0;
const zoomSelect = document.querySelector('#pdf-zoom');
async function loadPdf(version) {
  const request = ++pdfRequest;
  const pagesContainer = document.querySelector('#reader-document');
  const message = document.querySelector('#pdf-message');
  pdfLoadingTask?.destroy();
  pdfLoadingTask = null;
  pagesContainer.replaceChildren();
  message.hidden = false;
  message.textContent = readerLanguage === 'en' ? 'Loading PDF…' : 'Загрузка PDF…';
  readerContent.scrollTop = 0;
  readerContent.scrollLeft = 0;
  try {
    pdfModule ||= await import('./vendor/pdfjs/pdf.min.mjs');
    if (request !== pdfRequest || !reader.open) return;
    pdfModule.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdfjs/pdf.worker.min.mjs', document.baseURI).href;
    const task = pdfModule.getDocument({url: version.pdf, standardFontDataUrl: new URL('./vendor/pdfjs/standard_fonts/', document.baseURI).href});
    pdfLoadingTask = task;
    const documentPdf = await task.promise;
    if (request !== pdfRequest || !reader.open) return;
    lastPdfWidth = readerContent.clientWidth;
    const width = Math.max(200, readerContent.clientWidth - 32) * Number(zoomSelect.value);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    for (let number = 1; number <= documentPdf.numPages; number++) {
      const page = await documentPdf.getPage(number);
      if (request !== pdfRequest || !reader.open) return;
      const base = page.getViewport({scale:1});
      const viewport = page.getViewport({scale:width/base.width});
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width * pixelRatio);
      canvas.height = Math.ceil(viewport.height * pixelRatio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      canvas.setAttribute('role','img');
      canvas.setAttribute('aria-label', `${version.title} — ${readerLanguage === 'en' ? 'page' : 'страница'} ${number}`);
      await page.render({canvasContext:canvas.getContext('2d'),viewport,transform:pixelRatio === 1 ? null : [pixelRatio,0,0,pixelRatio,0,0]}).promise;
      if (request !== pdfRequest || !reader.open) return;
      pagesContainer.append(canvas);
    }
    // The source wording is also available to assistive technology.
    const accessibleText = document.createElement('div');
    accessibleText.className = 'sr-only';
    accessibleText.textContent = version.paragraphs.join('\n\n');
    pagesContainer.append(accessibleText);
    message.hidden = true;
  } catch (error) {
    if (request !== pdfRequest || !reader.open) return;
    message.textContent = 'The PDF could not be displayed. Use the link below to open the original document.';
  }
}
zoomSelect.addEventListener('change', () => { if (reader.open) loadPdf(activeRelease.versions[readerLanguage]); });
new ResizeObserver(() => {
  if (!reader.open || Math.abs(readerContent.clientWidth-lastPdfWidth)<2) return;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { if (reader.open) loadPdf(activeRelease.versions[readerLanguage]); }, 150);
}).observe(readerContent);

// Native dialog keeps the full photographs accessible by mouse and keyboard.
const photoLinks = [...document.querySelectorAll('.photo-link')];
const photoViewer = document.querySelector('#photo-viewer');
const fullPhoto = document.querySelector('#photo-viewer-image');
let photoIndex = 0;
let photoTrigger = null;
function showPhoto(index) {
  photoIndex = (index + photoLinks.length) % photoLinks.length;
  const link = photoLinks[photoIndex];
  fullPhoto.src = link.href;
  fullPhoto.alt = link.querySelector('img').alt;
  document.querySelector('#photo-position').textContent = `${photoIndex + 1} / ${photoLinks.length}`;
}
photoLinks.forEach((link, index) => {
  link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    photoTrigger = link;
    showPhoto(index);
    photoViewer.showModal();
    document.body.classList.add('gallery-open');
    photoViewer.querySelector('.photo-close').focus();
  });
});
photoViewer.querySelector('.photo-close').addEventListener('click', () => photoViewer.close());
photoViewer.querySelector('.photo-previous').addEventListener('click', () => showPhoto(photoIndex - 1));
photoViewer.querySelector('.photo-next').addEventListener('click', () => showPhoto(photoIndex + 1));
photoViewer.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    showPhoto(photoIndex + (event.key === 'ArrowLeft' ? -1 : 1));
  }
});
photoViewer.addEventListener('click', event => {
  const bounds = photoViewer.getBoundingClientRect();
  if (event.target === photoViewer && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) photoViewer.close();
});
photoViewer.addEventListener('close', () => {
  document.body.classList.remove('gallery-open');
  photoTrigger?.focus({preventScroll: true});
});
window.addEventListener('hashchange', () => { if (photoViewer.open) photoViewer.close(); });
