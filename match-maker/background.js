chrome.runtime.onInstalled.addListener(async () => {
  try {
    await chrome.storage.local.set({
      nexusMatchMakerInstalledAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to persist installation timestamp', error);
  }
});
