# Security review: website and admin panel

| | |
|---|---|
| Date | 2026-10-16 |
| Scope | Admin panel (`/admin`), public site, APIs (`/api/*`), uploads, backups, deployment (Docker/Caddy) |
| Method | Independent adversarial code review and probing of a running server, then fixes with regression tests and browser checks |

## Findings and status

| # | Severity | Finding | Status |
|---|---|---|---|
| H1 | High | **Stored XSS**: announcement Markdown allowed raw HTML and `javascript:` links, and JSON-LD could be broken out of with `</script>`. An editor account could have run script for every visitor and, through an owner's browser, changed the IBAN or invited new owners. | **Fixed.** `src/lib/markdown.ts`: raw HTML is shown as text, links/images only `https`/`mailto`/`tel`/relative, and all `<script>` JSON is escaped. Used for the public site *and* the admin preview. Tests: `tests/markdown.test.ts`. Verified in the browser. |
| M1 | Medium | 2FA codes could be guessed endlessly by logging in again with a stolen password (the limit was per session). | **Fixed.** Per-account counter in the database, reset only by a correct code. Lock after 10 wrong codes (15 min, doubling, max. 24 h), owners alerted by e-mail. Counts toward the IP limit. Test in `tests/auth.test.ts`. |
| M2 | Medium | `/_image` could be made to render and cache unlimited image variants (memory/CPU). | **Fixed.** Only parameters Astro uses are accepted, sizes ≤ 2400 px, only variants that the site's own pages reference are cached, everything else is served uncached at max. 60/min per IP. Cache capped at 200 MB. |
| M3 | Medium | Whoever opened `/admin/setup` first after deployment would become owner. | **Fixed.** In production the setup needs a one-time link from the server log (`docker compose logs web \| grep setup`) or a `SETUP_TOKEN` from `.env`. |
| L1 | Low | Unlimited password guessing on the re-confirmation page. | **Fixed.** Counts like failed logins (lock after 5). |
| L2 | Low | "Account locked" message revealed which e-mails exist. | **Fixed.** Same message for wrong and locked. |
| L3 | Low | Client IP taken from a raw `X-Forwarded-For` header. | **Fixed.** Uses Astro's `clientAddress`, which trusts the header only behind the validated domain. |
| L4 | Low | Editors could see owners' login IPs in the log. | **Fixed.** Logins are logged as security entries (owners only). |
| L5 | Low | SMTP password could go over an unencrypted connection, or to a new server without re-entry. | **Fixed.** TLS required when logging in. Changing server or user requires the password again. |
| L6 | Low | `javascript:` links ran in the admin preview. | **Fixed** with H1. |
| L7 | Low | Without `APP_SECRET` a generated key was stored next to the data it protects. | **Fixed.** Production refuses to encrypt without `APP_SECRET` and logs an error at start. |
| L8 | Low | Very large images ("decompression bombs") could use a lot of memory. | **Fixed.** Max. 70 megapixels. |
| L9 | Low | No limits on the contact form, checkout or AI translation. | **Fixed.** Contact 5 per 10 min per IP, checkout 20 per 10 min per IP, translation 60 per hour per person. |
| L10 | Low | Hardening: same session token before and after 2FA, loose path patterns. | **Fixed:** new token after 2FA, exact public admin paths. |

## Open (accepted for now)

| Topic | Why it is acceptable | Recommendation |
|---|---|---|
| CSP allows `'unsafe-inline'` scripts | All known injection points are closed (H1). Astro inlines small scripts, so removing it needs hash-based CSP. | Phase B: switch on Astro's `security.csp` (hashes) and drop `'unsafe-inline'`. |
| Cookie without `__Host-` prefix | Cookie is already `HttpOnly`, `Secure`, `SameSite=Strict`, path `/admin`. | Optional later. |
| An attacker can keep a known account locked (5 wrong passwords per 15 min) | Needs the exact e-mail. Owners can still log in from another account, and the IP limit applies. | Keep at least two owners. |
| Real e-mail, Stripe and Anthropic calls | Not testable without the real keys. | Test once on the server with test keys (see DEPLOYMENT.md). |

## Checked and fine (summary)

Every `/admin` route needs login and completed 2FA. Owner-only areas need owner role and re-confirmation. Forms are protected against cross-site requests (origin check + `SameSite=Strict`). There are no open redirects. Paths for uploads and backups cannot be manipulated. Uploads are re-encoded. The Stripe webhook is signed and idempotent, and amounts are checked. Tokens and recovery codes are stored hashed and work only once. Credentials are never shown, logged or put in backups unencrypted. The container runs without root rights.
