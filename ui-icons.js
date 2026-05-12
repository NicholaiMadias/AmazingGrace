/**
 * ui-icons.js — Short-name → atlas symbol-ID map for <nexus-icon>.
 *
 * Allows both canonical IDs ("icon-defense") and short aliases ("defense"):
 *   UI_ICONS["defense"]  → "icon-defense"
 *   UI_ICONS["icon-defense"] → undefined (falls back to raw, which is fine)
 *
 * Symbol IDs are defined in /assets/svg/master-atlas.svg.
 * Icon meanings documented in /icon-meanings.md.
 */

export const UI_ICONS = {

  // ── Navigation ──────────────────────────────────────────────────────────────
  home:           'icon-home',
  user:           'icon-user',
  settings:       'icon-settings',
  logout:         'icon-logout',
  search:         'icon-search',
  bell:           'icon-bell',
  menu:           'icon-menu',
  back:           'icon-back',
  forward:        'icon-forward',

  // ── Edit / action ────────────────────────────────────────────────────────────
  edit:           'icon-edit',
  trash:          'icon-trash',
  plus:           'icon-plus',
  minus:          'icon-minus',
  check:          'icon-check',
  close:          'icon-close',

  // ── Site sections ────────────────────────────────────────────────────────────
  arcade:         'icon-arcade',
  ministry:       'icon-ministry',
  'seven-stars':  'icon-seven-stars',
  earth:          'icon-earth',

  // ── Admin / system ───────────────────────────────────────────────────────────
  defense:        'icon-defense',
  key:            'icon-key',
  diag:           'icon-diag',

};
