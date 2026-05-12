async function getSession() {
  const res = await chrome.runtime.sendMessage({ type: "mm:getSession" });
  if (!res || res.ok !== true) throw new Error("Failed to read session");
  return res.session;
}

async function resetSession() {
  const res = await chrome.runtime.sendMessage({ type: "mm:resetSession" });
  if (!res || res.ok !== true) throw new Error("Failed to reset session");
}

function formatSession(session) {
  if (!session) return "none";
  if (typeof session.createdAt !== "number") return "invalid";
  return new Date(session.createdAt).toISOString();
}

async function refresh() {
  const sessionEl = document.getElementById("mm-session");
  if (!sessionEl) return;

  sessionEl.textContent = "…";
  try {
    const session = await getSession();
    sessionEl.textContent = formatSession(session);
  } catch (err) {
    sessionEl.textContent = "error";
  }
}

document.getElementById("mm-refresh")?.addEventListener("click", refresh);
document.getElementById("mm-reset")?.addEventListener("click", async () => {
  await resetSession();
  await refresh();
});

await refresh();

