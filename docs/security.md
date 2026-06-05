# Security

Operational overview of the security features enabled on this repository, where alerts surface, and how to triage them. For vulnerability disclosure (reporting a CVE), see [SECURITY.md](../SECURITY.md).

## Enabled Features

| Feature | Layer | Configured Via | Scope |
|---|---|---|---|
| Dependabot version updates | GitHub | `.github/dependabot.yml` | pnpm + github-actions, weekly (Monday) |
| Dependabot vulnerability alerts | GitHub | Repo setting (Security & analysis) | All dependency manifests |
| Dependabot security updates | GitHub | Repo setting (Security & analysis) | Auto-opens patch PRs for CVE-flagged deps |
| Secret scanning + push protection | GitHub | Repo setting (Security & analysis) | Blocks commits containing detected secrets |
| CodeQL code scanning | GitHub | Default setup (`state: configured`, `query_suite: default`) | Auto-detects JS/TS + actions; runs on push to `develop` + weekly |
| `pnpm audit` gate | CI | `.github/workflows/ci.yml` | `--audit-level=high` — blocks merge on high/critical dep vulns |

## Where Alerts Appear

| Feature | UI Path |
|---|---|
| Dependabot alerts | Security → Dependabot alerts |
| CodeQL findings | Security → Code scanning |
| Secret scanning | Security → Secret scanning alerts |
| Auto-patch PRs | Pull requests (labeled `dependencies`) |

## Triage Workflow

1. **Review SLA**
   - Critical: 24h
   - High: 7 days
   - Medium: 30 days
   - Low: next sprint

2. **First-pass review.** Confirm the vulnerability applies to an actual code path. Many transitive-dep CVEs are not exploitable in our usage. For CodeQL findings, open the alert and inspect the flagged source location.

3. **Dismiss false positives** with one of:
   - `false-positive` — not exploitable in this context
   - `used-in-tests` — only reachable from test code
   - `wont-fix` — accepted risk (document why in the dismissal note)

4. **Escalation.** Unresolved critical findings after 24h → ping repo owner.

## CI Complementary Checks

`pnpm audit --audit-level=high` runs on every PR (`.github/workflows/ci.yml`). It blocks merge on any high/critical dependency vulnerability.

This complements — not duplicates — Dependabot alerts: `pnpm audit` is a one-shot gate at PR time; Dependabot is continuous and opens automated patch PRs.

## Disabling / Rollback

Repo-setting toggles can be flipped off via `gh api`:

```bash
gh api -X PATCH repos/chrisph124/nfd-blog/code-scanning/default-setup -f state=not-configured
gh api -X DELETE repos/chrisph124/nfd-blog/automated-security-fixes
gh api -X DELETE repos/chrisph124/nfd-blog/vulnerability-alerts
```
