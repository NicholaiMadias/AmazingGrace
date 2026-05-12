import { createSession } from "../engine/index.js";

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.set({
    mm_session: createSession(),
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== "object") return;

  if (message.type === "mm:getSession") {
    chrome.storage.local.get(["mm_session"]).then((res) => {
      sendResponse({ ok: true, session: res.mm_session ?? null });
    });
    return true;
  }

  if (message.type === "mm:resetSession") {
    chrome.storage.local
      .set({ mm_session: createSession() })
      .then(() => sendResponse({ ok: true }));
    return true;
  }
});

