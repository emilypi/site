# Deploying

The site is a folder of static files (`dist/`), so it can be hosted anywhere. Two targets are wired up:

- **Cloudflare Workers (static assets)** — `npm run deploy` builds and uploads from your machine. Configured in `wrangler.jsonc`.
- **GitHub Pages** — builds and deploys automatically on every push to `main` via `.github/workflows/deploy.yml`.

Use one; pointing DNS at both is not meaningful. The rest of this document covers each in turn, then troubleshooting.

## Cloudflare Workers

The site deploys as a Worker that serves only static assets: there is no server code, so no adapter and no `_worker.js`. `wrangler.jsonc` names the Worker `cohomolo-gy` (Worker names allow only lowercase letters, digits, and dashes, so the dot in the domain cannot appear), points `assets.directory` at `./dist`, keeps the trailing-slash URLs the site is built with (`html_handling: "auto-trailing-slash"`), and serves `dist/404.html` for unknown paths (`not_found_handling: "404-page"`).

One-time setup:

1. `npx wrangler login` and follow the browser prompt.
2. `npm run deploy` — this runs `astro build` and then `wrangler deploy`, and prints a `*.workers.dev` URL. Check the site there.
3. Add the domain: in the Cloudflare dashboard open the Worker → **Settings → Domains & Routes → Add → Custom domain** and enter `cohomolo.gy`. The zone must be on your Cloudflare account; Cloudflare then creates the DNS records and certificate itself, so no manual `A`/`AAAA` records are needed.

Every later release is just `npm run deploy`. There is no `wrangler build` command: `astro build` produces the site and `wrangler deploy` uploads it. To validate the configuration without uploading, run `npx wrangler deploy --dry-run`. To preview the built site exactly as the Worker will serve it, `npm run build && npx wrangler dev`.

## GitHub Pages

### One-time setup

1. Create the repository on GitHub (suggested name: `site`).
2. Push `main`.
3. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
4. Push (or re-run) the workflow and confirm it completes under the **Actions** tab.
5. Back in **Settings → Pages**, set **Custom domain** to `cohomolo.gy`. GitHub checks this against `public/CNAME`, which already contains `cohomolo.gy`.
6. Once GitHub issues a certificate for the custom domain (can take a few minutes to a few hours), tick **Enforce HTTPS**.

### DNS

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

Point the apex (`cohomolo.gy`) at all four `A` records and all four `AAAA` records. (Skip this section if you deploy to Cloudflare Workers; Cloudflare manages the records for a custom domain itself.) Optionally add a `www` `CNAME` record pointing at `<user>.github.io`.

**Current state:** the apex currently points at `104.37.178.1` and must be changed to the addresses above before the custom domain will work.

Verify propagation with:

```bash
dig cohomolo.gy +short
```

It should print all four `A` record IPs once DNS has propagated.

### Response headers

GitHub Pages serves the site over HTTPS and redirects HTTP to HTTPS once **Enforce HTTPS** is ticked, but it offers no way to set custom response headers (Cloudflare Workers can add them via a `public/_headers` file if ever wanted), so responses carry no `Content-Security-Policy`, `Referrer-Policy`, or `Permissions-Policy`.

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
