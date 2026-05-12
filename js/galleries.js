(function loadGalleries() {
  const grid   = document.getElementById('gallery-grid');
  const empty  = document.getElementById('gallery-empty');
  const status = document.getElementById('gallery-status');

  if (!grid) return;

  // FIX 2026-05-06: fetch ./images.json relative to this gallery page
  // Previous bug: fetched /galleries.json which did not exist at repo root
  fetch('./images.json')
    .then(function(r) {
      if (!r.ok) throw new Error('images.json not found (' + r.status + ')');
      return r.json();
    })
    .then(function(images) {
      if (!Array.isArray(images) || images.length === 0) {
        showEmpty('Photos coming soon — check back shortly.');
        return;
      }
      if (status) {
        status.textContent = images.length + ' photo' + (images.length !== 1 ? 's' : '');
      }
      var frag = document.createDocumentFragment();
      images.forEach(function(src) {
        var wrap = document.createElement('div');
        wrap.className = 'gallery-item';
        var img = document.createElement('img');
        img.src      = src;
        img.alt      = (grid.dataset.gallery || 'property') + ' property photo';
        img.loading  = 'lazy';
        img.decoding = 'async';
        img.onerror  = function() { wrap.style.display = 'none'; };
        wrap.appendChild(img);
        frag.appendChild(wrap);
      });
      grid.appendChild(frag);
    })
    .catch(function(err) {
      console.warn('[galleries.js]', err.message);
      showEmpty('Photos coming soon — check back shortly.');
    });

  function showEmpty(msg) {
    if (empty)  empty.style.display = 'block';
    if (status) status.textContent  = msg || 'No images uploaded yet.';
  }
})();
