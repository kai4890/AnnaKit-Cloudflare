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

// Photos are discovered during the build, or on demand by the local preview.
let photoLinks = [];
const photoTrack = document.querySelector('#photo-track');
const galleryMessage = document.querySelector('#gallery-message');
const carouselControls = document.querySelector('.carousel-controls');
const carouselPrevious = document.querySelector('#carousel-previous');
const carouselNext = document.querySelector('#carousel-next');
const photoViewer = document.querySelector('#photo-viewer');
const fullPhoto = document.querySelector('#photo-viewer-image');
let photoIndex = 0;
let photoTrigger = null;
let gallerySignature = '';
let galleryLoading = false;

function updateCarousel() {
  if (!photoLinks.length || !photoTrack.clientWidth) return;
  const bounds = photoTrack.getBoundingClientRect();
  const visible = photoLinks.map((link, index) => ({index, bounds: link.getBoundingClientRect()}))
    .filter(item => item.bounds.right > bounds.left + 2 && item.bounds.left < bounds.right - 2);
  if (visible.length) {
    const first = visible[0].index + 1;
    const last = visible[visible.length - 1].index + 1;
    document.querySelector('#carousel-position').textContent = `${first === last ? first : `${first}–${last}`} of ${photoLinks.length}`;
  }
  const visibleFraction = Math.min(1, photoTrack.clientWidth / photoTrack.scrollWidth);
  const progress = document.querySelector('.carousel-progress span');
  progress.style.width = `${visibleFraction * 100}%`;
  progress.style.left = `${photoTrack.scrollLeft / photoTrack.scrollWidth * 100}%`;
}
function moveCarousel(direction) {
  if (photoLinks.length < 2) return;
  const maxScroll = photoTrack.scrollWidth - photoTrack.clientWidth;
  const atStart = photoTrack.scrollLeft <= 2;
  const atEnd = photoTrack.scrollLeft >= maxScroll - 2;
  const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
  if (direction < 0 && atStart) {
    photoTrack.scrollTo({left: maxScroll, behavior});
    return;
  }
  if (direction > 0 && atEnd) {
    photoTrack.scrollTo({left: 0, behavior});
    return;
  }
  const distance = photoLinks[0].getBoundingClientRect().width || photoTrack.clientWidth;
  photoTrack.scrollBy({left: direction * (distance + 20), behavior});
}
carouselPrevious.addEventListener('click', () => moveCarousel(-1));
carouselNext.addEventListener('click', () => moveCarousel(1));
photoTrack.addEventListener('scroll', updateCarousel, {passive: true});
new ResizeObserver(updateCarousel).observe(photoTrack);
photoTrack.addEventListener('keydown', event => {
  if (event.target !== photoTrack) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    moveCarousel(event.key === 'ArrowLeft' ? -1 : 1);
  }
});
async function loadPhotography() {
  if (galleryLoading) return;
  galleryLoading = true;
  try {
    const response = await fetch('photography.json', {cache: 'no-store'});
    if (!response.ok) throw new Error('Photo list unavailable');
    const photos = await response.json();
    if (!Array.isArray(photos) || !photos.every(photo => typeof photo.src === 'string' && photo.src.startsWith('photography/') && typeof photo.alt === 'string')) throw new Error('Invalid photo list');
    const signature = JSON.stringify(photos);
    if (signature === gallerySignature) { updateCarousel(); return; }
    if (photoViewer.open) photoViewer.close();
    photoLinks = photos.map((photo, index) => {
      const link = document.createElement('a');
      link.className = 'photo-link';
      link.href = photo.src;
      link.setAttribute('aria-label', `View photograph ${index + 1} of ${photos.length}: ${photo.alt}`);
      const img = document.createElement('img');
      img.src = photo.src;
      img.alt = photo.alt;
      img.loading = 'lazy';
      img.decoding = 'async';
      link.append(img);
      link.addEventListener('click', event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        photoTrigger = link;
        showPhoto(index);
        photoViewer.showModal();
        document.body.classList.add('gallery-open');
        photoViewer.querySelector('.photo-close').focus();
      });
      return link;
    });
    photoTrack.replaceChildren(...photoLinks);
    photoTrack.scrollLeft = 0;
    gallerySignature = signature;
    carouselControls.hidden = photos.length === 0;
    galleryMessage.hidden = photos.length > 0;
    galleryMessage.textContent = 'No photographs to display yet.';
    photoViewer.querySelector('.photo-previous').disabled = photos.length < 2;
    photoViewer.querySelector('.photo-next').disabled = photos.length < 2;
    updateCarousel();
  } catch (error) {
    if (!photoLinks.length) {
      galleryMessage.hidden = false;
      galleryMessage.textContent = 'The gallery could not be loaded. Please refresh the page to try again.';
    }
  } finally { galleryLoading = false; }
}
function showPhoto(index) {
  if (!photoLinks.length) return;
  photoIndex = (index + photoLinks.length) % photoLinks.length;
  const link = photoLinks[photoIndex];
  fullPhoto.src = link.href;
  fullPhoto.alt = link.querySelector('img').alt;
  document.querySelector('#photo-position').textContent = `${photoIndex + 1} / ${photoLinks.length}`;
}
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
window.addEventListener('hashchange', () => {
  if (photoViewer.open) photoViewer.close();
  if (location.hash === '#video-production') loadPhotography();
});
window.addEventListener('focus', () => { if (location.hash === '#video-production') loadPhotography(); });
loadPhotography();
