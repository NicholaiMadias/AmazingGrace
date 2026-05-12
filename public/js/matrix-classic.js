(function () {
  window.MatrixVersion = "classic";
  // Short pause so completion feedback can be seen before routing to Nexus.
  const NEXUS_TRANSITION_DELAY_MS = 900;
  const NEXUS_URL = "./matrix-of-conscience/";

  function domReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
      return fn();
    }
    document.addEventListener("DOMContentLoaded", fn);
  }

  function dbgEngine(label) {
    if (window.MatrixDebug && typeof window.MatrixDebug.setEngine === "function") {
      window.MatrixDebug.setEngine(label);
    }
  }

  function dbgState(state) {
    if (window.MatrixDebug && typeof window.MatrixDebug.setState === "function") {
      window.MatrixDebug.setState(state);
    }
  }

  function advanceToNexusIfUnlocked() {
    // unlockedNexus is set by MatrixProgression.check() after classic completion + repair state.
    if (!window.MatrixProgression?.unlockedNexus) return;
    const mount = document.getElementById("matrix-classic-game");
    if (mount) {
      const notice = document.createElement("div");
      notice.textContent = "Classic complete. Launching Nexus upgrade…";
      notice.style.cssText = "position:absolute;inset:auto 1rem 1rem 1rem;z-index:30;padding:.6rem .8rem;border:1px solid rgba(0,191,255,.55);background:rgba(0,0,0,.85);color:#7dd3fc;border-radius:8px;font:600 .9rem/1.3 system-ui,sans-serif;";
      mount.appendChild(notice);
    }
    window.setTimeout(() => {
      window.location.assign(NEXUS_URL);
    }, NEXUS_TRANSITION_DELAY_MS);
  }

  domReady(() => {
    const mount = document.getElementById("matrix-classic-game");
    if (!mount) {
      console.warn("MatrixClassic: mount #matrix-classic-game not found.");
      return;
    }

    if (window.MatrixProgression) {
      window.MatrixProgression.check();
    }

    document.addEventListener("matrix:points", (event) => {
      window.MatrixProgression?.addPoints?.(event?.detail?.amount ?? 0);
    });

    document.addEventListener("matrix:data", (event) => {
      window.MatrixProgression?.addData?.(event?.detail?.amount ?? 0);
    });

    document.addEventListener("matrix:classic-complete", () => {
      window.MatrixProgression?.markCompleted?.();
      advanceToNexusIfUnlocked();
    });

    // CASE A — Sub-Routines engine present (preferred)
    if (window.SubRoutines && typeof window.SubRoutines.boot === "function") {
      console.log("MatrixClassic: using SubRoutines.boot() entry");
      dbgEngine("SubRoutines.boot()");
      dbgState("running");
      window.SubRoutines.boot({
        target: mount,
        mode: "classic"
      });
      return;
    }

    // CASE B — Classic engine exposes MatrixClassic.init()
    if (window.MatrixClassic && typeof window.MatrixClassic.init === "function") {
      console.log("MatrixClassic: using MatrixClassic.init()");
      dbgEngine("MatrixClassic.init()");
      dbgState("running");
      window.MatrixClassic.init(mount);
      return;
    }

    // CASE C — Classic engine exposes MatrixClassic.start()
    if (window.MatrixClassic && typeof window.MatrixClassic.start === "function") {
      console.log("MatrixClassic: using MatrixClassic.start()");
      dbgEngine("MatrixClassic.start()");
      dbgState("running");
      window.MatrixClassic.start("matrix-classic-game");
      return;
    }

    // CASE D — Engine auto-renders (canvas or board)
    const autoCanvas = document.querySelector("#game, .board, canvas.matrix-classic, canvas[data-matrix-classic]");
    if (autoCanvas) {
      console.log("MatrixClassic: relocating auto-rendered element");
      dbgEngine("auto-render");
      dbgState("running");
      mount.appendChild(autoCanvas);
      return;
    }

    // CASE E — No engine detected
    console.warn("MatrixClassic: No entry point found.");
    dbgEngine("none");
    dbgState("error");
    mount.textContent = "Classic Matrix engine not detected.";
  });
})();
