# Amazing Grace Home Living — Site Governance

**Production domain:** amazinggracehl.org
**Repo:** NicholaiMadias/Amazing-Grace
**Pages:** https://nicholaimadias.github.io/Amazing-Grace/

---

## Site Sections

- 🏠 **Listings** — `amazinggracehl.org/`
- 🎮 **Arcade** — `amazinggracehl.org/arcade/`
- ✝️ **Ministry** — `amazinggracehl.org/ministry/`

---

## ✅ Governance Enhancements

### 1️⃣ 🔐 Signed Content Validation
Ensure site content and agent instructions are authentic and untampered.
- Sign ministry artifacts (sermon updates, governance rules) with GPG or Ed25519.
- CI step example: `gpg --detach-sign --armor Agent.Instructions.pdf`
- Reject unsigned or invalid signatures; log results.

### 2️⃣ 📣 Uptime & Outreach Alerts
Treat site downtime as a mission disruption.
- Outages for `amazinggracehl.org` trigger email and dashboard alerts.
- Example payload:
  ```json
  {
    "domain": "amazinggracehl.org",
    "severity": "critical",
    "category": "outreach",
    "status": "down"
  }
  ```

### 3️⃣ 🌐 Public Site Health Badge
Provide public transparency via a status badge.
- ✅ Green: Site UP
- ❌ Red: Site DOWN
- 🟡 Yellow: Degraded
- Badge URL: `https://amazinggracehl.org/health/badge.svg` *(planned future enhancement)*

### 4️⃣ 🧠 AI‑Generated Incident Summaries
Turn incidents into learning artifacts.
- On outage: collect logs → AI generates root cause, timeline, and remediation steps.
- Store summaries in an audit log or `/reports/` folder.

### 5️⃣ 🛡️ Metadata Integrity
Ensure that new assets or scripts do not inadvertently leak sensitive environment metadata or user-identifiable behavioral patterns.
- Review all new assets and scripts for embedded environment variables, API keys, or build-time metadata before merging.
- Do not expose runtime config (e.g. `window.__FIREBASE_CONFIG`, user locale, device fingerprints) to unauthenticated endpoints or analytics payloads.
- Validate third-party script inclusions against a known-good allowlist to prevent supply-chain leakage.

---

## ✅ Deployment Checklist

### Phase 1 — Domain & DNS
- [ ] `amazinggracehl.org` resolves and returns HTTPS 200
- [ ] `www.amazinggracehl.org` redirects to apex
- [ ] GitHub Pages CNAME file contains `amazinggracehl.org`

### Phase 2 — Secrets & Credentials
- [ ] (Optional) `GEMINI_API_KEY` configured in repo secrets

### Phase 3 — GitHub Actions
- [ ] `deploy.yml` triggers on push to `main`
- [ ] `github-pages-preview.yml` posts preview URLs to PRs
- [ ] `domain-monitor.yml` scheduled check passes for `amazinggracehl.org`

### Phase 4 — Data Flow
- [ ] GitHub Actions build succeeds (`npm run build`)
- [ ] Dist artifacts deployed to GitHub Pages
- [ ] GitHub Pages preview URLs posted automatically on PRs
