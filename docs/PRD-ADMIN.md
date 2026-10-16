# PRD: Verwaltung (Admin-Panel) für die Website

| | |
|---|---|
| Status | **Approved 2026-10-16** (both admin languages, owner 2FA mandatory, 4 designs, automatic online total, AI translation) – built |
| Date | 2026-10-16 |
| Related | [PRD.md](PRD.md) (website), [CONTENT-TODO.md](CONTENT-TODO.md) |

---

## 1. Problem

The volunteers are used to WordPress: log in, click, change, done. The current setup (Sveltia CMS) needs a GitHub account and a personal access token, saves into Git and only shows changes 2–3 minutes later after a rebuild. That is too technical, and it cannot manage things like payment credentials, users, 2FA or the design.

## 2. Goals and success criteria

| # | Goal | Criterion |
|---|---|---|
| A1 | As easy as WordPress, but simpler | A first-time volunteer posts an announcement in **< 2 minutes** without training. No GitHub account, no tokens. |
| A2 | Changes are live immediately | Saving makes the change visible on the website **within 1 second** (no rebuild). |
| A3 | Compact | One screen per task. The dashboard fits on a laptop screen without scrolling. Works on a phone. |
| A4 | Secure | Password login, rate limiting and lockout, optional **TOTP 2FA** (any authenticator app) that can be made mandatory later, roles, audit log. |
| A5 | Safe with money | Payment credentials and bank details are protected more strongly than everything else (see §6). |
| A6 | Designs switchable | The owner switches the site design (Weinrot, Grün, …) with a live preview. |
| A7 | Premium | Same quality and visual language as the website. Fast, calm and consistent. |

## 3. Users and roles

| Role | Who | Can |
|---|---|---|
| **Inhaber** (Owner) | 1–2 board members / tech person | Everything, including users, payment credentials, bank details, design and 2FA policy |
| **Redaktion** (Editor) | Volunteers | Announcements, programme, videos, prayer settings (Iqama/Jumu'ah), campaign total, texts |

## 4. Scope (Phase A)

### 4.1 Screens

| Screen | Content |
|---|---|
| **Login** | E-mail + password, then a 6-digit 2FA code (if enabled). "Passwort vergessen" by e-mail (needs SMTP). |
| **Dashboard** | Campaign thermometer with a **"Spendenstand aktualisieren"** quick field; today's prayer times; next lessons; latest changes ("Wer hat was geändert"); **go-live checklist** (from CONTENT-TODO: register number, Stripe, SMTP, 2FA …, ticking off automatically when fulfilled). |
| **Ankündigungen** | List with status chips (Live / Geplant / Entwurf / Abgelaufen). Editor with DE + AR side by side, image upload, "anheften", **publish from / until** (auto-expire, e.g. Eid announcement), optional **site-wide notice bar** ("Eid-Gebet am …"). Live preview. |
| **Programm** | Weekly lessons as a compact week board. Add / edit / duplicate / delete / pause. Drag & drop order. |
| **Mediathek** | Add a video by **pasting a YouTube link** (title and thumbnail fetched automatically), series, language, "featured". |
| **Gebetszeiten** | Iqama offsets, Jumu'ah time(s) and notes, special notice. Upload next year's table (CSV in Phase A, PDF import in Phase B). |
| **Kampagne** | Goal, raised amount, donors, deadline, price per m², milestones (add / reorder / mark done). Shows online donations from Stripe separately (see §4.2). |
| **Verein & Kontakt** | Name, address, phone, e-mail, board members, register number, tax details, directions, social links (Telegram, YouTube, WhatsApp, Instagram). |
| **Zahlungen** *(Owner)* | Stripe keys (test/live), PayPal note, bank account (IBAN, BIC, holder, reference), SMTP for e-mails. **"Verbindung testen"** buttons. Secrets are shown masked. |
| **Design** *(Owner)* | Theme cards with live preview thumbnails. One click to activate. See §5. |
| **Benutzer & Sicherheit** | Users (invite, role, deactivate, reset 2FA); own profile (password, 2FA setup via QR code, 10 recovery codes); policy "2FA für alle Pflicht" on/off; active sessions with "überall abmelden". |
| **Protokoll** | Audit log: who changed what, when (before/after for sensitive fields). |

### 4.2 Extras ("surprise")

- **⌘K / Strg+K command palette**: type "spenden" → jump to Spendenstand, "neue ankündigung" → editor. WordPress has nothing like it.
- **Live total**: optionally adds Stripe online donations automatically to the manually entered bank total, so the thermometer is always up to date.
- **Seasonal design**: "Ramadan" theme that switches itself on automatically during Ramadan and off after Eid (optional).
- **Site-wide notice bar**: a one-line banner with an expiry date (Eid prayer, closures, Jumu'ah time change).
- **Mobile-first admin**: update the donation total or post a short notice from your phone after Jumu'ah.

### 4.3 Out of scope (Phase A)

- Editing the long page texts (project letter, About, legal pages) with a rich page builder. These change rarely. Phase B: simple text blocks for the most-edited paragraphs.
- Donor management / CRM, automatic donation receipts (Phase B, depends on the Freistellungsbescheid).
- PDF import of the prayer calendar (Phase B; Phase A: CSV, or the technical maintainer runs the existing script).
- AI translation suggestion DE → AR (Phase B, optional, needs an API key; costs a few cents per text).
- Admin interface in Arabic (see Q3).

## 5. Designs (themes)

| Theme | Description |
|---|---|
| **Weinrot** (Flyer) | Current design, matching the campaign flyer |
| **Grün** (Logo) | The original logo green #69B86B, gold accents |
| **Nachtblau & Gold** | Deep navy with gold: calm, elegant, very premium |
| **Ramadan** (seasonal) | Night blue with lantern gold and crescent ornaments; optional automatic activation during Ramadan |

All themes share layout, fonts and photos; only the colour tokens change. All are checked for WCAG AA contrast.

## 6. Security design

| Topic | Decision |
|---|---|
| Passwords | `scrypt` hashing, min. 10 characters, breached-password check optional later |
| Sessions | Random 256-bit token, stored hashed in the DB, `HttpOnly; Secure; SameSite=Strict` cookie, 12 h idle timeout, "log out everywhere" |
| Brute force | Max. 5 failed logins per account per 15 min + per-IP limit; constant-time comparisons |
| 2FA | TOTP (RFC 6238, Google Authenticator / Microsoft Authenticator / 1Password …), 10 one-time recovery codes. **Owner can make 2FA mandatory for all** with one switch. |
| CSRF | Same-origin check on every form + `SameSite=Strict` |
| **Sensitive changes** (IBAN, Stripe keys, SMTP, users, 2FA policy) | **Owner only**, **password re-entry**, **2FA required** for these actions as soon as it is enabled, **e-mail alert** to all owners, full before/after in the audit log |
| Secrets at rest | Stripe secret key and SMTP password encrypted with AES-256-GCM; the master key lives only in the server's `.env` (`APP_SECRET`), never in the DB or Git |
| Uploads | Images only (JPG/PNG/WebP), max. 8 MB, re-encoded server-side (strips EXIF/GPS) |
| Backups | Nightly SQLite backup on the server (14 days), one-click "Backup herunterladen" for owners |

> **Why the extra protection:** whoever can change the IBAN or Stripe key on a donation site can redirect donations. This is the single most attractive target for an attacker, so it gets the strongest protection.

## 7. Architecture

| Layer | Choice | Why |
|---|---|---|
| Storage | **SQLite** (built into Node, no extra service) on a persistent Docker volume, plus `uploads/` | Zero maintenance, fast, easy backup (one file) |
| Rendering | Pages switch from build-time static to **server-rendered with an in-memory cache** that is cleared on every save | Changes are live instantly; cached pages stay as fast as static ones |
| Admin UI | Astro server pages under **`/admin`**, same design tokens, small vanilla TypeScript enhancements (no heavy framework) | Fast, small, consistent with the site |
| Migration | On first start the existing JSON content is imported automatically | Nothing is lost |
| Static test build | `npm run build:pages` keeps working (reads the JSON seed) for GitHub Pages previews; the admin itself needs the server | |
| Removed | Sveltia CMS + GitHub-token login | One system instead of two |

## 8. Build plan

1. Data layer: SQLite schema, JSON import, content access functions, cache.
2. Switch pages to server rendering + theme from settings; keep the static demo build working.
3. Auth: users, sessions, login, lockout, TOTP 2FA, recovery codes, roles, audit log.
4. Admin shell: layout, navigation, command palette, toasts, mobile layout.
5. Screens: Dashboard → Ankündigungen → Programm → Kampagne → Gebetszeiten → Mediathek → Verein → Zahlungen → Design → Benutzer → Protokoll.
6. Themes: Nachtblau & Gold, Ramadan (+ auto schedule).
7. Payment and e-mail settings read from the DB (fall back to `.env`), with connection tests.
8. Tests (auth, 2FA, permissions, CRUD), security review, screenshots, docs (`ADMIN-ANLEITUNG.md` in German), deployment update (volume, backup).

**Estimate:** Phase A is a large build; I'll deliver it in one go with screenshots, as with the website.

## 9. Risks / trade-offs

| Risk | Mitigation |
|---|---|
| Server rendering means more server work than static files | In-memory cache; pages are re-rendered only after a change |
| Admin login is a new attack surface | §6; the `/admin` path is excluded from search engines; optional IP allow-list later |
| Losing the SQLite file = losing content | Nightly backups + download button; the JSON seed remains as a baseline |
| Admin cannot be tested on GitHub Pages | Test it on the VPS or locally with Docker (one command) |
