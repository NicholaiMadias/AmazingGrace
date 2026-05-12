(function () {
  const SHELL_BACKGROUND = "linear-gradient(180deg,rgba(0,0,0,0) 35%, rgba(0,0,0,.55) 100%)";
  const PANEL_STYLE = [
    "pointer-events:auto",
    "border:1px solid rgba(0,255,102,.35)",
    "background:rgba(0,0,0,.85)",
    "padding:.65rem .75rem",
    "border-radius:8px",
    "font-size:.8rem",
    "line-height:1.4",
    "color:#00ff66",
    "font-family:monospace"
  ].join(";");

  function getMount() {
    return document.getElementById("matrix-classic-game");
  }

  function ensureShell() {
    const mount = getMount();
    if (!mount) return null;

    let shell = mount.querySelector("[data-subroutines-shell]");
    if (shell) return shell;

    shell = document.createElement("div");
    shell.setAttribute("data-subroutines-shell", "true");
    shell.style.cssText = [
      "position:absolute",
      "inset:0",
      "z-index:25",
      "display:flex",
      "flex-direction:column",
      "justify-content:flex-end",
      "padding:1rem",
      "gap:.5rem",
      "pointer-events:none",
      `background:${SHELL_BACKGROUND}`
    ].join(";");

    const panel = document.createElement("div");
    panel.style.cssText = PANEL_STYLE;
    panel.innerHTML = "<strong>SYSTEM REPAIR SHELL</strong><div id='subroutines-shell-status'>Running diagnostics...</div>";
    shell.appendChild(panel);

    mount.style.position = "relative";
    mount.appendChild(shell);
    return shell;
  }

  function setStatus(message, accent) {
    const shell = ensureShell();
    if (!shell) return;
    const el = shell.querySelector("#subroutines-shell-status");
    if (!el) return;
    el.textContent = message;
    if (accent) {
      el.style.color = accent;
    }
  }

  window.SubRoutinesShell = {
    init() {
      setStatus("Repair modules online. Earn points/data to restore system.", "#7dffb3");
    },
    repairComplete() {
      setStatus("Repair complete. Classic matrix stabilized.", "#00ff66");
    },
    unlockNexus() {
      setStatus("NEXUS UPGRADE UNLOCKED. Launch sequence available.", "#00bfff");
      const shell = ensureShell();
      if (shell) {
        shell.animate(
          [
            { boxShadow: "0 0 0 rgba(0,191,255,0)" },
            { boxShadow: "0 0 28px rgba(0,191,255,.45)" },
            { boxShadow: "0 0 0 rgba(0,191,255,0)" }
          ],
          { duration: 900, iterations: 2 }
        );
      }
    }
  };

  if (document.readyState === "complete" || document.readyState === "interactive") {
    window.SubRoutinesShell.init();
  } else {
    document.addEventListener("DOMContentLoaded", () => window.SubRoutinesShell.init());
  }
})();
