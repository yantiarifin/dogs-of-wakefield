/* Dogs of Wakefield — grid + modal.
   Data comes from portraits.json, the single source of truth. */

(function () {
  'use strict'

  const gallery = document.getElementById('gallery')
  const countEl = document.getElementById('count')
  const emptyEl = document.getElementById('empty')

  const lightbox = document.getElementById('lightbox')
  const lightboxImage = document.getElementById('lightbox-image')
  const lightboxName = document.getElementById('lightbox-name')
  const lightboxMemorial = document.getElementById('lightbox-memorial')
  const lightboxMemorialText = document.getElementById('lightbox-memorial-text')
  const prevButton = document.getElementById('prev')
  const nextButton = document.getElementById('next')

  let portraits = []
  let index = -1
  let lastFocused = null

  /* ---------- Data ---------- */

  // portraits.json is the only source of truth — edit it and reload, no build
  // step. It is fetched, so the page has to be served rather than opened as a
  // bare file; browsers block fetch() on file:// URLs.
  function load() {
    return fetch('portraits.json')
      .then(res => {
        if (!res.ok) throw new Error(`portraits.json responded ${res.status}`)
        return res.json()
      })
      .then(data => data.portraits || [])
  }

  /* ---------- Rendering ---------- */

  // The status is carried by the button's aria-label instead, since an
  // aria-label on the button would override this image's alt text anyway.
  const RAINBOW = '<img class="rainbow" src="rainbow.svg" alt="" width="24" height="18">'
  const RAINBOW_KEY = '<img class="rainbow-key" src="rainbow.svg" alt="" width="24" height="18">'

  function render() {
    const html = portraits.map((dog, i) => `
      <li>
        <button class="card" type="button" data-index="${i}"
                aria-label="${escapeAttr(dog.name)}${dog.passed ? ', crossed the rainbow bridge' : ''} — open larger portrait">
          <span class="card__frame">
            <img src="${escapeAttr(dog.thumb)}" alt="Portrait of ${escapeAttr(dog.name)}"
                 loading="lazy" decoding="async" width="700" height="700">
          </span>
          <span class="card__caption">
            <span class="card__name">${escapeHtml(dog.name)}</span>
            <span class="card__rainbow">${dog.passed ? RAINBOW : ''}</span>
          </span>
        </button>
      </li>`).join('')

    gallery.innerHTML = html

    // innerHTML rather than textContent so the rainbow can sit inline. Only
    // counts are interpolated here, never portrait data.
    const passed = portraits.filter(dog => dog.passed).length
    countEl.innerHTML = passed
      ? `${portraits.length} portraits · <span class="masthead__remembered">${passed} remembered&nbsp;&nbsp;${RAINBOW_KEY}</span>`
      : `${portraits.length} portraits`
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]))
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/"/g, '&quot;')
  }

  /* ---------- Modal ---------- */

  function open(i) {
    index = (i + portraits.length) % portraits.length
    const dog = portraits[index]

    lightboxImage.src = dog.display
    lightboxImage.alt = `Portrait of ${dog.name}`
    lightboxName.textContent = dog.name
    lightboxMemorialText.textContent = `Forever loved and always remembered`
    lightboxMemorial.hidden = !dog.passed

    if (lightbox.hidden) {
      lastFocused = document.activeElement
      lightbox.hidden = false
      document.body.classList.add('is-locked')
      // Single-portrait galleries have nowhere to page to.
      const solo = portraits.length < 2
      prevButton.hidden = solo
      nextButton.hidden = solo
      ;(solo ? lightbox.querySelector('.lightbox__close') : nextButton).focus()
    }

    preload(index + 1)
    preload(index - 1)
  }

  function preload(i) {
    if (portraits.length < 2) return
    const dog = portraits[(i + portraits.length) % portraits.length]
    new Image().src = dog.display
  }

  function close() {
    if (lightbox.hidden) return
    lightbox.hidden = true
    document.body.classList.remove('is-locked')
    // Release the full-size image so it isn't held in memory.
    lightboxImage.removeAttribute('src')

    const card = gallery.querySelector(`.card[data-index="${index}"]`)
    ;(card || lastFocused)?.focus()
    index = -1
  }

  /* ---------- Events ---------- */

  gallery.addEventListener('click', event => {
    const card = event.target.closest('.card')
    if (card) open(Number(card.dataset.index))
  })

  prevButton.addEventListener('click', () => open(index - 1))
  nextButton.addEventListener('click', () => open(index + 1))

  lightbox.addEventListener('click', event => {
    if (event.target.closest('[data-close]')) close()
  })

  document.addEventListener('keydown', event => {
    if (lightbox.hidden) return
    if (event.key === 'Escape') { close(); return }
    if (portraits.length < 2) return
    if (event.key === 'ArrowRight') { event.preventDefault(); open(index + 1) }
    if (event.key === 'ArrowLeft') { event.preventDefault(); open(index - 1) }
  })

  // Keep focus inside the dialog while it is open.
  document.addEventListener('focusin', event => {
    if (!lightbox.hidden && !lightbox.contains(event.target)) {
      lightbox.querySelector('.lightbox__close').focus()
    }
  })

  /* ---------- Boot ---------- */

  load()
    .then(data => {
      portraits = data
      if (!portraits.length) {
        emptyEl.textContent = 'No portraits yet. Add images to portraits/ and run: node scripts/build-gallery.mjs'
        emptyEl.hidden = false
        return
      }
      render()
    })
    .catch(err => {
      console.error(err)
      emptyEl.innerHTML = location.protocol === 'file:'
        ? 'This page reads <code>portraits.json</code>, which browsers block over <code>file://</code>. Serve the folder instead: <code>python3 -m http.server 8899</code>'
        : 'Could not load <code>portraits.json</code>. Check that it is valid JSON, then reload.'
      emptyEl.hidden = false
    })
})()
