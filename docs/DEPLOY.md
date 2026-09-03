# Deploying

The site builds and deploys automatically on every push to `main` via `.github/workflows/deploy.yml`. This document covers the one-time GitHub Pages setup and how to diagnose it when it's not working.

## One-time setup

1. Create the repository on GitHub (suggested name: `site`).
2. Push `main`.
3. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
4. Push (or re-run) the workflow and confirm it completes under the **Actions** tab.
5. Back in **Settings → Pages**, set **Custom domain** to `cohomolo.gy`. GitHub checks this against `public/CNAME`, which already contains `cohomolo.gy`.
6. Once GitHub issues a certificate for the custom domain (can take a few minutes to a few hours), tick **Enforce HTTPS**.

## DNS

GitHub Pages is served from a fixed set of IP addresses (checked 2026-09-03 against GitHub's [custom domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)):

| Record | Value                 |
| ------ | --------------------- |
| A      | `185.199.108.153`     |
| A      | `185.199.109.153`     |
| A      | `185.199.110.153`     |
| A      | `185.199.111.153`     |
| AAAA   | `2606:50c0:8000::153` |
| AAAA   | `2606:50c0:8001::153` |
| AAAA   | `2606:50c0:8002::153` |
| AAAA   | `2606:50c0:8003::153` |

Point the apex (`cohomolo.gy`) at all four `A` records and all four `AAAA` records. Optionally add a `www` `CNAME` record pointing at `<user>.github.io`.

**Current state:** the apex currently points at `104.37.178.1` and must be changed to the addresses above before the custom domain will work.

Verify propagation with:

```bash
dig cohomolo.gy +short
```

It should print all four `A` record IPs once DNS has propagated.

## Response headers

GitHub Pages serves the site over HTTPS and redirects HTTP to HTTPS once **Enforce HTTPS** is ticked, but it offers no way to set custom response headers, so responses carry no `Content-Security-Policy`, `Referrer-Policy`, or `Permissions-Policy`.

That costs little here — the site is static, requests no third-party host, sets no cookies, and takes no user input — but putting a CDN or proxy in front of Pages is the only way to add those headers if they are ever wanted.

## Troubleshooting

- **404 after deploy** — usually a CNAME mismatch (check `public/CNAME` matches the domain set in Settings → Pages) or the Pages source isn't set to **GitHub Actions**.
- **Certificate pending** — normal for a while after first pointing DNS at GitHub; re-check **Settings → Pages** after DNS has propagated. **Enforce HTTPS** can't be ticked until the certificate issues.
- **Workflow permission errors** — the workflow needs `pages: write` and `id-token: write` (already set in `deploy.yml`); if a repo-level Actions permissions setting overrides this, check **Settings → Actions → General → Workflow permissions**.

## Rollback

```bash
git revert <bad-commit>
git push
```

Reverting and pushing to `main` triggers a fresh build and deploy from the reverted state.
