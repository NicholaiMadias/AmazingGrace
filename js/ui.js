/**
 * ui.js — Shared UI helpers for Sovereign Matrix pages.
 *
 * Exports:
 *   toast(message, type?, duration?)  → void
 *   showLoading(message?)             → () => void  (returns hide function)
 *   hideLoading()                     → void
 *   confirm(message)                  → Promise<boolean>
 *   formatNumber(n)                   → string
 *   timeAgo(date)                     → string
 */

/* ── Toast notifications ─────────────────────────────────────────────────── */

const TOAST_COLORS = {
  success: { bg: '#00ff41', text: '#000' },
  error:   { bg: '#ff2244', text: '#fff' },
  info:    { bg: '#00e5ff', text: '#000' },
  warning: { bg: '#ffc800', text: '#000' },
};

let _toastContainer = null;

function getToastContainer() {
  if (_toastContainer && document.body.contains(_toastContainer)) {
    return _toastContainer;
  }
  _toastContainer = document.createElement('div');
  _toastContainer.setAttribute('aria-live', 'polite');
  _toastContainer.setAttribute('aria-atomic', 'false');
  Object.assign(_toastContainer.style, {
    position:      'fixed',
    top:           '20px',
    left:          '50%',
    transform:     'translateX(-50%)',
    zIndex:        '99999',
    display:       'flex',
    flexDirection: 'column',
    alignItems:    'center',
    gap:           '8px',
    pointerEvents: 'none',
  });
  document.body.appendChild(_toastContainer);
  return _toastContainer;
}

/**
 * Show a brief toast notification.
 *
 * @param {string} message
 * @param {'success'|'error'|'info'|'warning'} [type='info']
 * @param {number} [duration=2800] - Milliseconds before the toast auto-dismisses.
 */
export function toast(message, type = 'info', duration = 2800) {
  if (typeof document === 'undefined') return;

  const container = getToastContainer();
  const colors = TOAST_COLORS[type] || TOAST_COLORS.info;

  const el = document.createElement('div');
  el.textContent = message;
  el.setAttribute('role', 'status');
  Object.assign(el.style, {
    background:   colors.bg,
    color:        colors.text,
    padding:      '10px 20px',
    borderRadius: '4px',
    fontFamily:   "'Courier New', monospace",
    fontSize:     '0.85rem',
    fontWeight:   'bold',
    boxShadow:    `0 0 12px ${colors.bg}88`,
    opacity:      '1',
    transition:   'opacity 0.35s ease',
    pointerEvents: 'auto',
    cursor:        'pointer',
  });

  container.appendChild(el);

  const dismiss = () => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 380);
  };

  const timer = setTimeout(dismiss, duration);

  // Dismiss early on click and clear the auto-dismiss timer
  el.addEventListener('click', () => {
    clearTimeout(timer);
    dismiss();
  }, { once: true });
}

/* ── Loading overlay ─────────────────────────────────────────────────────── */

let _loadingOverlay = null;

/**
 * Show a full-screen loading overlay.
 *
 * @param {string} [message='Loading…']
 * @returns {() => void} A function to hide the overlay.
 */
export function showLoading(message = 'Loading…') {
  if (typeof document === 'undefined') return () => {};

  if (_loadingOverlay && document.body.contains(_loadingOverlay)) {
    const span = _loadingOverlay.querySelector('.ui-loading-msg');
    if (span) span.textContent = message;
    _loadingOverlay.style.display = 'flex';
    return () => hideLoading();
  }

  _loadingOverlay = document.createElement('div');
  _loadingOverlay.setAttribute('role', 'status');
  _loadingOverlay.setAttribute('aria-label', message);
  Object.assign(_loadingOverlay.style, {
    position:       'fixed',
    inset:          '0',
    background:     'rgba(0, 10, 0, 0.82)',
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '1rem',
    zIndex:         '99998',
    backdropFilter: 'blur(4px)',
  });

  const spinner = document.createElement('div');
  Object.assign(spinner.style, {
    width:       '40px',
    height:      '40px',
    border:      '3px solid #003b00',
    borderTop:   '3px solid #00ff41',
    borderRadius:'50%',
    animation:   'ui-spin 0.8s linear infinite',
  });

  // Inject keyframes once
  if (!document.getElementById('ui-spin-style')) {
    const style = document.createElement('style');
    style.id = 'ui-spin-style';
    style.textContent = '@keyframes ui-spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }

  const label = document.createElement('span');
  label.className = 'ui-loading-msg';
  label.textContent = message;
  Object.assign(label.style, {
    color:      '#00ff41',
    fontFamily: "'Courier New', monospace",
    fontSize:   '0.85rem',
    letterSpacing: '0.05em',
  });

  _loadingOverlay.appendChild(spinner);
  _loadingOverlay.appendChild(label);
  document.body.appendChild(_loadingOverlay);

  return () => hideLoading();
}

/**
 * Hide the loading overlay (if visible).
 */
export function hideLoading() {
  if (_loadingOverlay) {
    _loadingOverlay.style.display = 'none';
  }
}

/* ── Confirm dialog ──────────────────────────────────────────────────────── */

/**
 * Show a styled confirmation dialog (returns a Promise).
 * Falls back to `window.confirm` if the document is unavailable.
 *
 * @param {string} message
 * @returns {Promise<boolean>}
 */
export function confirm(message) {
  if (typeof document === 'undefined') {
    return Promise.resolve(window.confirm(message));
  }

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position:       'fixed',
      inset:          '0',
      background:     'rgba(0, 10, 0, 0.85)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      zIndex:         '100000',
      backdropFilter: 'blur(4px)',
    });

    const box = document.createElement('div');
    Object.assign(box.style, {
      background:   '#0d1a0d',
      border:       '1px solid #00ff41',
      borderRadius: '4px',
      padding:      '2rem',
      maxWidth:     '380px',
      width:        '90%',
      color:        '#b0ffb0',
      fontFamily:   "'Courier New', monospace",
      fontSize:     '0.9rem',
      boxShadow:    '0 0 30px rgba(0,255,65,0.2)',
    });

    const msg = document.createElement('p');
    msg.textContent = message;
    msg.style.marginBottom = '1.5rem';
    msg.style.lineHeight = '1.5';

    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '1rem';
    btnRow.style.justifyContent = 'flex-end';

    const mkBtn = (label, primary) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      Object.assign(btn.style, {
        padding:     '0.45rem 1.2rem',
        border:      primary ? 'none' : '1px solid #00ff41',
        borderRadius:'3px',
        background:  primary ? '#00ff41' : 'transparent',
        color:       primary ? '#000'    : '#00ff41',
        fontFamily:  "'Courier New', monospace",
        fontSize:    '0.82rem',
        cursor:      'pointer',
        fontWeight:  primary ? 'bold' : 'normal',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      });
      return btn;
    };

    const cancelBtn  = mkBtn('Cancel', false);
    const confirmBtn = mkBtn('Confirm', true);

    const cleanup = (result) => {
      overlay.remove();
      resolve(result);
    };

    cancelBtn.addEventListener('click',  () => cleanup(false));
    confirmBtn.addEventListener('click', () => cleanup(true));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(false); });

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(confirmBtn);
    box.appendChild(msg);
    box.appendChild(btnRow);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // Focus the confirm button for keyboard users
    confirmBtn.focus();
  });
}

/* ── Utility formatters ──────────────────────────────────────────────────── */

/**
 * Format a number with compact suffixes (e.g. 1200 → "1.2K").
 * @param {number} n
 * @returns {string}
 */
export function formatNumber(n) {
  if (!Number.isFinite(n)) return String(n);
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return sign + (abs / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (abs >= 1_000)     return sign + (abs / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return sign + String(Math.round(abs));
}

/**
 * Return a relative time string (e.g. "2 minutes ago").
 * @param {Date|string|number} date
 * @returns {string}
 */
export function timeAgo(date) {
  const now   = Date.now();
  const then  = new Date(date).getTime();
  const diff  = Math.max(0, now - then);
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins  <  1) return 'just now';
  if (mins  < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}
