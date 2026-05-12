# Rulesets, Bots, and Workflows

This repo uses several automation workflows (GitHub Pages deploy/preview, branch
sync/cleanup, and “agent” maintainers). If you enable repository **rulesets**
that block bot writes, you can see errors like:

> “This may be caused by a repository ruleset violation… granting bypass permissions…”

This document is the “known-good” configuration for keeping automation useful
without weakening `main`.

## Recommended Ruleset Strategy

### 1) Protect `main` (strict)
- Require PRs for changes to `main` (no direct pushes).
- Require status checks (at minimum: `CI`).
- Optional: require reviews / CODEOWNERS.

This keeps production safe while still allowing feature branches to be created
and updated by tools.

### 2) Allow automation branches (looser)
If you use automated agents/bots, consider explicitly allowing branch patterns
like:
- `codex/*`
- `copilot/*`
- `devops/*`

These branches should still flow into `main` via PRs.

### 3) GitHub Pages branch (`gh-pages`)
This repository currently deploys previews and production to the `gh-pages`
branch by pushing commits from workflows.

If you protect `gh-pages` with a ruleset, you must either:
- Grant bypass to the actors that deploy (typically `github-actions[bot]`), or
- Switch GitHub Pages **Source** to “GitHub Actions” and migrate the workflows
  to `actions/deploy-pages` (not currently used here).

## Bypass Actors to Consider

In GitHub rulesets, add bypass for the exact automation you want to function:
- **GitHub Actions** (`github-actions[bot]`) for Pages deploy/preview and cleanup
- **OpenAI Codex** (the `openai-code-agent` GitHub App) if you want issue-driven
  coding agents to open PRs automatically
- Any other repo apps that create commits/branches on your behalf

Keep bypass scope as narrow as possible (e.g., only for `gh-pages`, or only for
non-`main` branches).

## Why This Exists

The “agent couldn’t start” error is a platform-level block: the automation is
attempting an operation that the repository ruleset forbids (branch update,
ref deletion, or direct push). Since rulesets are configured in the GitHub UI,
the fix is primarily **settings**, but the repository workflows are written to
assume certain write permissions.

