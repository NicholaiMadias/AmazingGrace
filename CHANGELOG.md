# Changelog

All notable changes to Amazing Grace Home Living are documented here.

## [2.0.0] — 2026-05-04

### Added — Sovereign Matrix application layer

- **`js/firebase.js`** — Firebase init + Auth/Realtime-Database helpers with
  automatic localStorage fallback for demo/local use.
- **`js/router.js`** — Role-based routing (`routeByRole`, `guardPage`) and
  session helpers (`getCurrentUser`, `setCurrentUser`, `logout`).
- **`js/unlocks.js`** — Unlock-condition engine (`computeUnlocks`,
  `unlockHint`, `mergeToolUnlocks`) that gates Matrix tools behind gameplay
  milestones.
- **`js/matchmaker.js`** — 7 × 7 Match-3 engine (pure functions): grid
  creation, swap validation, match detection, gravity, and special-tile
  logic.
- **`js/visionforge.js`** — Vision Forge image-generation module (unlock-
  gated; requires 50 gem clears + a daily challenge completion).
- **`js/nations.js`** — Sovereign Nations simulation module (unlock-gated;
  requires 1 000 match-maker points).
- **`js/diagnostics.js`** — Diagnostics Console: browser environment, DNS
  reachability, and performance checks (unlock-gated at level 3).
- **`js/ui.js`** — Shared UI helpers: toast notifications and loading overlay.
- **`public/admin/css/matrix.css`** — Dark neon Sovereign Matrix theme with
  CSS custom-property tokens used across all matrix/admin pages.
- **`matrix.html`** — Sovereign Matrix portal: Vision Forge, Sovereign
  Nations, and Diagnostics Console tool cards, each unlock-gated via
  `js/unlocks.js`.
- **`arcade.html`** — Root-level redirect shim pointing to `/arcade/`; included
  as a Vite entry-point so it is emitted to `dist/arcade.html` on every build.
- **`public/admin/`** — Complete admin console: login, user management, role
  assignment, toolbox, diagnostics, network-defense, and key-management pages.

### Changed

- `index.html` — Main portal updated with direct links into the Arcade, Matrix,
  and Ministry sections.
- Vite multi-page build now processes all HTML entry-points (arcade, matrix,
  ministry, galleries, stories) into a single `dist/`; admin sub-pages under
  `public/admin/` are included in the build output as static files (copied by
  Vite's `public/` directory handling, not processed as Rollup inputs).
- Deployment workflow (`deploy.yml`) copies root `js/`, `assets/`, `galleries/`,
  and `images/` alongside the Vite `dist/` output so runtime scripts and static
  assets remain available after every GitHub Pages deploy.

### Infrastructure

- GitHub Actions workflows: `deploy.yml` (Pages deploy), `domain-monitor.yml`
  (scheduled uptime check for `amazinggracehl.org`),
  `github-pages-preview.yml` (PR preview URLs on GitHub Pages), `ci.yml` (build +
  test validation on every push).
- Vitest test suite covers gallery-manifest generation and GitHub Pages preview
  workflow validation.

---

## [1.0.0] — 2026-04-26

Initial public release of the Amazing Grace Home Living site:

- Property listing galleries (1142 7th St, 1144 7th St, 926 E Poinsettia Ave / Tampa property).
- Ministry section with Bible Journey and Seven-Star Canon pages.
- Nexus Arcade with Match Maker game, Seven Stars progression, and Matrix of
  Conscience modules.
- GitHub Pages deployment to `amazinggracehl.org`.

## [0.1.0] — 2026-04-24

Pre-release: initial repo structure and logo.
