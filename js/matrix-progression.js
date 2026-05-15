(function () {
  const STORAGE_KEY = "matrix-progression-v1";
  const REPAIR_THRESHOLD = 100;

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function saveState(state) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("MatrixProgression: could not persist progression.", error);
    }
  }

  const persisted = loadState() || {};
  const progression = {
    points: Number.isFinite(persisted.points) ? persisted.points : 0,
    data: Number.isFinite(persisted.data) ? persisted.data : 0,
    completedClassic: Boolean(persisted.completedClassic),
    repaired: Boolean(persisted.repaired),
    unlockedNexus: Boolean(persisted.unlockedNexus),

    addPoints(n) {
      const value = Number(n) || 0;
      this.points += value;
      this.check();
    },

    addData(n) {
      const value = Number(n) || 0;
      this.data += value;
      this.check();
    },

    markCompleted() {
      this.completedClassic = true;
      this.check();
    },

    check() {
      const shouldRepair = this.points >= REPAIR_THRESHOLD || this.data >= REPAIR_THRESHOLD;

      if (!this.repaired && shouldRepair) {
        this.repaired = true;
        window.SubRoutinesShell?.repairComplete?.();
      }

      if (!this.unlockedNexus && this.repaired && this.completedClassic) {
        this.unlockedNexus = true;
        window.SubRoutinesShell?.unlockNexus?.();
      }

      saveState(this.snapshot());
    },

    snapshot() {
      return {
        points: this.points,
        data: this.data,
        completedClassic: this.completedClassic,
        repaired: this.repaired,
        unlockedNexus: this.unlockedNexus
      };
    }
  };

  window.MatrixProgression = progression;
  progression.check();
})();
