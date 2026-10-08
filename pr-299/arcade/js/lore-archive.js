loadRebellionState();
const activeDecryptions = new Map();

function formatUnlockHint(requirements = {}) {
  const hints = [];

  if (requirements.stars) {
    for (const [game, needed] of Object.entries(requirements.stars)) {
      hints.push(`${game} ★${needed}`);
    }
  }

  if (requirements.items) {
    for (const [item, needed] of Object.entries(requirements.items)) {
      hints.push(`${item} x${needed}`);
    }
  }

  if (typeof requirements.threatBelow === 'number') {
    hints.push(`Threat < ${requirements.threatBelow}`);
  }

  return hints.join(' • ');
}

function checkLoreUnlock(requirements = {}) {
  const state = window.rebellionState || {};
  const certs = state.certifications || {};
  const inventory = state.inventory || {};

  if (requirements.stars) {
    for (const [game, needed] of Object.entries(requirements.stars)) {
      if ((certs[game] || 0) < needed) {
        return false;
      }
    }
  }

  if (requirements.items) {
    for (const [item, needed] of Object.entries(requirements.items)) {
      if ((inventory[item] || 0) < needed) {
        return false;
      }
    }
  }

  if (typeof requirements.threatBelow === 'number' && (state.threat || 0) >= requirements.threatBelow) {
    return false;
  }

  return true;
}

function decryptFile(fileId, element, text) {
  const existingInterval = activeDecryptions.get(fileId);
  if (existingInterval) {
    clearInterval(existingInterval);
  }

  element.style.display = 'block';
  element.textContent = '';

  let i = 0;
  const intervalId = setInterval(() => {
    element.textContent = text.slice(0, i);
    i += 1;

    if (i > text.length) {
      clearInterval(intervalId);
      activeDecryptions.delete(fileId);
    }
  }, 15);

  activeDecryptions.set(fileId, intervalId);
}

function renderLoreArchive() {
  const filesRoot = document.getElementById('la-files');
  if (!filesRoot) {
    return;
  }

  filesRoot.innerHTML = '';
  let unlockedCount = 0;

  LORE_FILES.forEach((file) => {
    const unlocked = checkLoreUnlock(file.unlock);
    if (unlocked) {
      unlockedCount += 1;
    }

    const fileEl = document.createElement('article');
    fileEl.className = `la-file${unlocked ? '' : ' la-locked'}`;

    const title = document.createElement('strong');
    title.textContent = file.title;

    const decryptLabel = document.createElement('div');
    decryptLabel.className = 'la-decrypt';
    decryptLabel.textContent = unlocked
      ? 'Click to decrypt transmission'
      : `LOCKED // ${formatUnlockHint(file.unlock)}`;

    const content = document.createElement('div');
    content.className = 'la-content';
    content.id = file.id;

    fileEl.append(title, decryptLabel, content);

    if (unlocked) {
      const runDecrypt = () => decryptFile(file.id, content, file.content);
      fileEl.setAttribute('role', 'button');
      fileEl.setAttribute('tabindex', '0');
      fileEl.addEventListener('click', runDecrypt);
      fileEl.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          runDecrypt();
        }
      });
    }

    filesRoot.appendChild(fileEl);
  });

  updateHUD();

  const status = document.getElementById('syndicate-ai');
  if (status) {
    status.textContent = '';
    const aiLine = document.createElement('div');
    aiLine.textContent = 'Syndicate AI: Tracking Archive breach attempts...';
    const unlockedLine = document.createElement('div');
    unlockedLine.textContent = `Unlocked files: ${unlockedCount}/${LORE_FILES.length}`;
    status.append(aiLine, unlockedLine);
  }
}

renderLoreArchive();
