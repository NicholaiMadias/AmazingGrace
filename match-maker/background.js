import { loadSession, saveSession } from "./session.js";

function readSession() {
  return new Promise((resolve) => {
    loadSession(resolve);
  });
}

function writeSession(session) {
  return saveSession(session);
}

async function primeSession() {
  await writeSession(await readSession());
}

if (globalThis.chrome?.runtime?.onInstalled) {
  chrome.runtime.onInstalled.addListener(() => {
    void primeSession();
  });
}

if (globalThis.chrome?.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "match-maker:get-session") {
      return false;
    }

    void readSession().then((session) => {
      sendResponse({ session });
    });

    return true;
  });
}
