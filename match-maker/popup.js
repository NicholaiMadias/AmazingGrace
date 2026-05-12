const statusEl = document.getElementById('status');

async function renderStatus() {
  if (!statusEl) return;

  try {
    const result = await chrome.storage.local.get(['nexusMatchMakerInstalledAt']);

    if (!result.nexusMatchMakerInstalledAt) {
      statusEl.textContent = 'Extension ready. No stored installation timestamp found yet.';
      return;
    }

    const installedAt = new Date(result.nexusMatchMakerInstalledAt);
    statusEl.textContent = `Extension ready. Installed ${installedAt.toLocaleString()}.`;
  } catch (error) {
    console.error('Unable to read Match-Maker status', error);
    statusEl.textContent = 'Extension ready. Storage status unavailable.';
  }
}

renderStatus();
