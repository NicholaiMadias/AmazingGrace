const closeBtn = document.getElementById('sm-cert-close');
const overlay = document.getElementById('sm-cert-overlay');
if (closeBtn && overlay) {
  closeBtn.addEventListener('click', () => overlay.classList.add('hidden'));
}
