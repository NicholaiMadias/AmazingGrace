export function createSession() {
  return {
    version: 1,
    createdAt: Date.now(),
    status: "ready",
  };
}

/** Alias for createSession — used by the popup entry point. */
export const createEngine = createSession;
