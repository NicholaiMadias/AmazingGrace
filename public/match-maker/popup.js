import {
  ATLAS_IDS,
  createDefaultSession,
  cycleAtlas,
  loadSession,
  markPopupOpened,
  saveSession,
} from "./session.js";

function readSession() {
  return new Promise((resolve) => {
    loadSession(resolve);
  });
}

function writeSession(session) {
  return saveSession(session);
}

function formatAtlasName(id) {
  return id.replace("gem-", "").replace(/^\w/, (char) => char.toUpperCase());
}

function formatAlignment(alignment) {
  return alignment.charAt(0).toUpperCase() + alignment.slice(1);
}

function render(session) {
  document.getElementById("launch-count").textContent = String(session.launches);
  document.getElementById("atlas-name").textContent = formatAtlasName(session.selectedAtlas);
  document.getElementById("last-opened").textContent = session.lastOpenedAt
    ? new Date(session.lastOpenedAt).toLocaleString()
    : "Not yet saved";
  document.getElementById("storage-note").textContent = globalThis.chrome?.storage?.local
    ? `Using chrome.storage.local to keep extension state between launches. Alignment: ${formatAlignment(session.alignment)} · Resonance ${session.resonanceStability} · Loop ${session.loopPressure}.`
    : "Preview mode: chrome.storage is unavailable outside the browser extension runtime.";
}

async function initializePopup() {
  const openedSession = markPopupOpened(await readSession());
  await writeSession(openedSession);
  render(openedSession);

  document.querySelector("[data-cycle-atlas]")?.addEventListener("click", async () => {
    const nextSession = cycleAtlas(await readSession(), ATLAS_IDS);
    await writeSession(nextSession);
    render(nextSession);
  });

  document.querySelector("[data-reset-session]")?.addEventListener("click", async () => {
    const nextSession = createDefaultSession();
    await writeSession(nextSession);
    render(nextSession);
  });
}

initializePopup().catch((error) => {
  console.error("[match-maker popup] Failed to initialize:", error);
});
