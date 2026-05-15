/**
 * router.js — Role-based routing for Sovereign Matrix pages.
 *
 * Exports:
 *   getCurrentUser()           → session object or null
 *   setCurrentUser(user)       → void
 *   logout([loginPath])        → void
 *   routeByRole(user, routes)  → void  (redirect based on role)
 *   guardPage(allowedRoles)    → user | null
 *   ROLES                      → common role-set constants
 */

const SESSION_KEY = 'matrixUser';

/* ── Session helpers ─────────────────────────────────────────────────────── */

/**
 * Return the currently authenticated user from localStorage.
 * @returns {{ uid: string, email: string, role: string }|null}
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Persist a user session to localStorage.
 * @param {{ uid: string, email: string, role: string }} user
 */
export function setCurrentUser(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

/**
 * Clear the current session and redirect to the login page.
 * @param {string} [loginPath='/admin/login.html']
 */
export function logout(loginPath = '/admin/login.html') {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = loginPath;
}

/* ── Routing helpers ─────────────────────────────────────────────────────── */

/**
 * Role precedence order (highest first).
 * @type {string[]}
 */
const ROLE_ORDER = ['owner', 'superAdmin', 'admin', 'user'];

/**
 * Redirect the user to the first route whose `roles` array contains their role.
 * Falls back to `routes.default` if no match is found.
 *
 * @param {{ uid: string, email: string, role: string }|null} user
 * @param {Array<{ roles: string[], path: string }>} routes
 * @param {string} [fallbackPath='/admin/login.html']
 */
export function routeByRole(user, routes, fallbackPath = '/admin/login.html') {
  if (!user) {
    window.location.href = fallbackPath;
    return;
  }

  for (const route of routes) {
    if (route.roles && route.roles.includes(user.role)) {
      window.location.href = route.path;
      return;
    }
  }

  window.location.href = fallbackPath;
}

/**
 * Guard the current page by required roles.
 * Firebase Auth has been removed — returns a non-blocking admin session
 * instead of redirecting to login. Re-enable gating when auth is restored.
 *
 * @param {string[]} _allowedRoles  (ignored while auth is disabled)
 * @param {object}  [_options]      (ignored while auth is disabled)
 * @returns {{ uid: string, email: string, role: string }} Current or guest user.
 */
export function guardPage(_allowedRoles, _options = {}) {
  const user = getCurrentUser();
  if (user) return user;
  // Default guest admin session — non-blocking.
  return { uid: 'guest', email: 'guest@local', role: 'admin' };
}

/**
 * Returns true when the current user has at least one of the given roles.
 * Does not redirect — useful for conditional UI rendering.
 *
 * @param {string[]} roles
 * @returns {boolean}
 */
export function hasRole(roles) {
  const user = getCurrentUser();
  return !!user && roles.includes(user.role);
}

/**
 * Returns the numeric rank of a role (lower = higher privilege).
 * @param {string} role
 * @returns {number}
 */
export function roleRank(role) {
  const idx = ROLE_ORDER.indexOf(role);
  return idx === -1 ? ROLE_ORDER.length : idx;
}

/* ── Role-set constants ───────────────────────────────────────────────────── */

export const ROLES = {
  /** Any admin-level account */
  ALL_ADMIN:  ['admin', 'superAdmin', 'owner'],
  /** superAdmin and owner only */
  SUPER_PLUS: ['superAdmin', 'owner'],
  /** Owner only */
  OWNER_ONLY: ['owner'],
  /** All authenticated users */
  ANY:        ['user', 'admin', 'superAdmin', 'owner'],
};
