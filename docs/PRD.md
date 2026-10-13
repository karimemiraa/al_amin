# PRD: New website for the Mohammad Al-Amien Moschee (IGH Hannover e.V.)

| | |
|---|---|
| Status | **Approved 2026-10-13** (VPS hosting, German + Arabic at launch, deadline 01.02.2027) – Phase 1 built |
| Date | 2026-10-12 |
| Owner | IGH Hannover e.V. |
| Research | [`research/01-current-site-audit.md`](research/01-current-site-audit.md) · [`research/02-mosque-website-benchmark.md`](research/02-mosque-website-benchmark.md) · [`research/03-legal-donations-adgrants.md`](research/03-legal-donations-adgrants.md) |

---

## 1. Problem

The Islamisches Gemeindehaus Hannover e.V. must raise **1.3 million € by 01.02.2027** to buy a new building for the Mohammad Al-Amien Moschee: 3 floors × 700 m² plus 1,600 m² of outdoor space, 1 km from the current mosque. That leaves **about 16 weeks** from today.

The current web presence works against this goal:

- **Weak trust.** The Impressum is incomplete (no register number, one representative). Tracking (GA, Meta Pixel) loads without consent. The progress bar is a static "5 %" sitting next to a "100 % Transparenz" badge. The campaign page uses an **AI-generated fantasy mosque image** that is not the real building.
- **Fragmented donations.** Donations are split across three places: a separate subdomain, an empty "Spendenkonto" page and an unlinked old "Spenden" page.
- **Stale content.** The newest article dates from 2022, opening hours and Friday prayer times contradict each other, there are many typos, and the theme is a generic WordPress template.
- **Missing pieces.** There is no place for lessons, videos or live streams, even though the community is active on Telegram with regular live streams. There are no events, no visitor information, and the main site is German-only although the community is mainly Arabic-speaking.
- **No Ad Grants readiness.** The site is not ready to serve as the landing page for a Google Ad Grants account.

## 2. Goals and success criteria

| # | Goal | Measurable criterion |
|---|---|---|
| G1 | Collect donations | Donation flow reachable from every page in **1 click**; complete in **≤ 3 steps**; bank-transfer details and GiroCode visible without JavaScript |
| G2 | Build trust | Real building photos only; progress figure with an **"Stand: <date>"** stamp, updated at least weekly; a transparency section (register no., tax status, board, Satzung, fallback clause); a legally complete Impressum and Datenschutz |
| G3 | Premium feel | Visual identity derived from the campaign flyer (cream paper, burgundy, gold ornaments, serif headlines); consistent on mobile and desktop |
| G4 | Performance and quality | Lighthouse mobile **≥ 90 Performance, ≥ 95 Accessibility / Best Practices / SEO**; WCAG 2.1 AA; no third-party requests before consent |
| G5 | Self-service for volunteers | A non-technical volunteer can update the donation total, announcements, lessons, Iqamah/Jumu'ah times and videos in **< 5 minutes**, without a developer |
| G6 | Ad Grants ready | Meets the Google Ad Grants website policy; conversion events defined (donation started, donation completed, contact, newsletter) using Consent Mode v2 (basic) |
| G7 | Community hub | Prayer times, the weekly program, a video library and a live page, so people come back regularly (and see the campaign each time) |
| G8 | Multilingual-ready | German first; architecture supports Arabic (RTL) and English without a rebuild |

**Out of scope as success measures:** the amount actually raised depends on offline fundraising too. The site supports that goal but cannot guarantee it.

## 3. Users

1. **Community members (mainly Arabic-speaking)**: prayer times, Jumu'ah, lessons, live stream, quick donation from the phone (often from a WhatsApp or Telegram link).
2. **Wider Muslim donors (Germany and abroad)**: understand the project, trust it, and donate in a few taps.
3. **German public, neighbours, city, press, churches**: who the community is, how to visit, and the transparency facts.
4. **Volunteers and the board**: update content quickly.
5. **Google Ad Grants visitors**: search for "Moschee Hannover", "Spenden Moschee" and similar, and must land on clear, substantial pages.

## 4. Scope

### 4.1 Sitemap (German URLs; `/ar/` and `/en/` mirror the structure later)

| Page | Content |
|---|---|
| **Startseite** `/` | Campaign hero (real building photo, goal, progress, deadline countdown, "Jetzt spenden"); today's prayer times + next prayer + Jumu'ah; this week's lessons; latest announcement; latest video; short "Wer wir sind"; location; visitor CTA |
| **Kaufprojekt** `/neue-moschee` | The vision (what the building enables: Eid prayers, Ramadan, events, education, youth, women); building facts; photo gallery + floor plan; video from the imam or chair; **m² sponsorship** (351 € = 1 m², of 3,700 m²); progress and milestones timeline; budget breakdown; transparency; FAQ; donate block |
| **Spenden** `/spenden` | Donation form (one-time / monthly, presets, m² option, dedication field, receipt request); bank transfer + GiroCode (several amounts) + copy-IBAN; cash; other funds (Zakat, Zakat al-Fitr, general mosque costs); receipt info + downloadable simplified-receipt PDF |
| **Gebetszeiten** `/gebetszeiten` | Today + monthly table (Adhan / Iqamah), Jumu'ah time(s), PDF downloads, Ramadan Imsakiah when relevant |
| **Programm** `/programm` | Weekly lessons with day, time ("nach Maghrib"), teacher, **language tag**, audience; one-off events |
| **Mediathek** `/mediathek` | Video library by series (Khutbah, Sirah, Tazkiyah …), filterable by language; consent-gated YouTube embeds |
| **Live** `/live` | Permanent page embedding the channel's live stream + schedule + Telegram link |
| **Aktuelles** `/aktuelles` | Announcements and news (Ramadan, Eid, closures, campaign updates) |
| **Über uns** `/ueber-uns` | History since 1999, mission, board, imam, Schura Niedersachsen membership, Satzung, **Transparenz** section |
| **Besuch** `/besuch` | Guided tours, how to find us (rear courtyard Grabbestraße 3b, Vahrenwalder Platz stop), etiquette, simultaneous translation of the khutbah |
| **Kontakt** `/kontakt` | Form (honeypot, no reCAPTCHA), phone, e-mail, static map linking out |
| **Impressum, Datenschutz** | Rewritten to § 5 DDG / DSGVO / TDDDG |
| **Danke** `/danke` | Post-donation page: share via WhatsApp/Telegram, receipt info (conversion event) |

### 4.2 Features

- **Campaign progress**: a single value ("Spendenstand" + "Stand" date + donor count), edited in the CMS by the treasurer. Shown as euros and as m² ("1,240 of 3,700 m² gesichert"). Stripe donations may be added automatically later (phase 2).
- **Donations**: **keep Stripe** (already set up) via Stripe Checkout on our own domain, covering cards, Apple Pay / Google Pay, PayPal and SEPA. Add monthly recurring and metadata (dedication, receipt request, address). **GiroCode** SVGs are generated at build time. No third-party donation portal as the main path (Ad Grants rule).
- **Prayer times**: the mosque's own yearly table is the source of truth (imported once a year from CSV/PDF data). Iqamah offsets and Jumu'ah are editable in the CMS. The "next prayer" countdown is computed client-side with no third-party calls.
- **Video**: an official mosque YouTube channel (to be created) as the backbone; the site stores only metadata. Two-click consent placeholder. Live page auto-shows the current stream.
- **Consent**: a lightweight banner with equal Accept and Reject buttons; nothing third-party loads before consent; self-hosted fonts; cookieless analytics (Plausible or Matomo).
- **Sharing**: WhatsApp and Telegram share buttons with pre-written text plus Open Graph images showing the real building; printable QR poster for Friday prayer.
- **SEO**: schema.org `Mosque` / `PlaceOfWorship` + `NGO` + `Event`, sitemap, German meta, fast static pages.

### 4.3 Explicitly out of scope (for now)

- Uploading and hosting video files on our own server: YouTube does this for free, better and more reliably.
- Member logins, donor accounts, online course registration with payments.
- A native app (Mawaqit / Telegram already cover this).
- Running the Google Ads campaigns themselves (separate workstream once the site and verification are ready).
- Qard Hasan / loan collection via the website (legal risk under the German Banking Act, KWG; see research 03).
- Full Arabic/English translation in phase 1 (see open question Q4).

## 5. Constraints

- **Deadline**: 01.02.2027. The campaign page must go live **first and fast**; everything else follows.
- **Ramadan 1448 starts around 8 February 2027**, about a week *after* the deadline. Ramadan and the last ten nights are the strongest giving period of the year (East London Mosque closed its purchase gap in Ramadan). Flagged as a strategic question (Q2).
- **Legal**: Impressum § 5 DDG, DSGVO, § 25 TDDDG (VG Hannover 2025 banner rules), receipts only with a valid Freistellungsbescheid.
- **Ad Grants**: own domain, HTTPS, substantial content, working donation flow, conversion tracking.
- **Maintainability**: run by volunteers; few content types; no plugin zoo.
- **Hosting**: in the EU (currently Hetzner). Stripe Checkout needs a small server-side endpoint (the existing PHP endpoint works on Hetzner webhosting).
- **Honesty**: only real photos of the real building; renderings must be labelled "Visualisierung".

## 6. Recommended technical approach

> Recommendation, open for discussion: see Q1.

| Layer | Choice | Why |
|---|---|---|
| Framework | **Astro** (static output) | Very fast, secure (no database or plugins to hack), full design control, built-in i18n incl. RTL |
| Styling | Tailwind CSS + custom design tokens | Consistent premium design system |
| CMS | **Sveltia CMS / Decap CMS** (git-based, runs at `/admin`) | Free; simple forms for volunteers; content versioned in GitHub |
| Donations | Stripe Checkout + small PHP or serverless endpoint; GiroCode via build-time SVG | Reuses the existing Stripe account |
| Hosting | Hetzner (existing) via GitHub Actions deploy, or Netlify / Cloudflare Pages with an EU DPA | EU hosting, HTTPS, CDN |
| Analytics | Plausible (EU) or Matomo cookieless | No consent needed for analytics |

**Trade-off vs. staying on WordPress**: WordPress is familiar to the current volunteers, but the bloat, plugin maintenance and security updates are exactly what made the current site slow and stale. Astro + a git-based CMS is faster, cheaper and safer, but **needs one technical person** (me now, a volunteer later) for structural changes. Volunteers only use the simple `/admin` editor.

## 7. Design direction

- **Identity from the flyer**: warm cream "paper" background, deep **burgundy/rose** headlines, **sand/gold** line ornaments, Islamic geometric/mandala line-art as subtle decoration, a wave divider, serif display type + elegant script accent ("in Hannover"), clean sans or serif body type.
- **Photography first**: real building, prayer hall, courtyard, community (faces only with consent).
- **Calm, dignified, premium**: generous white space, no stock-photo clichés, no pop-ups. The donate button is always visible (sticky on mobile).
- Light theme by default; dark-mode support optional.
- Logo: current green arch logo; needs a version that works on light backgrounds (see Q7).

## 8. Build plan

### Phase 0: Sign-off and inputs (this week)
1. Approve this PRD and answer the open questions.
2. Collect the inputs in section 9.

### Phase 1: Campaign launch (target: ~2–3 weeks after sign-off)
3. Project setup: Astro, Tailwind, design tokens, fonts (self-hosted), base layout, header with sticky donate button, footer with legal info.
4. Design system: buttons, cards, progress meter, prayer-time widget, section ornaments. A preview goes to you for approval **before** building all the pages.
5. **Kaufprojekt** page + **Spenden** page (Stripe Checkout, GiroCode, bank, receipts, m² sponsorship) + **Danke** page.
6. **Startseite** with campaign hero, prayer times today, program, location.
7. **Gebetszeiten** (2026 + 2027 tables), **Programm**, **Über uns / Transparenz**, **Besuch**, **Kontakt**.
8. **Impressum, Datenschutz**, consent banner, cookieless analytics.
9. CMS (`/admin`) for donation total, announcements, program, prayer-time overrides.
10. QA: Lighthouse, accessibility, mobile devices, donation test payments (Stripe test mode), link check.
11. Go-live on `igh-hannover.de`; redirect `spende.igh-hannover.de` → `/spenden`; redirect old URLs; remove the legacy HTML site.

### Phase 2: Community hub and growth (following ~3–4 weeks)
12. **Mediathek** + **Live** page (after the YouTube channel exists).
13. **Aktuelles** with campaign updates and milestone timeline.
14. Arabic version of the campaign and donation pages (if not already in phase 1) + English.
15. Donor wall (opt-in), floor-plan m² grid, automatic Stripe total sync.
16. Ad Grants: Goodstack verification support, conversion events, landing-page checks.
17. Newsletter / WhatsApp channel sign-up.

### Phase 3: Final sprint and beyond
18. Countdown and final-weeks mechanics (matching-donor banner, daily progress updates) before 01.02.2027, and Ramadan mode if the campaign continues.
19. Ongoing: monthly content check so the site never goes stale.

## 9. Inputs needed from the association

| # | Item | Needed for |
|---|---|---|
| I1 | Vereinsregister number (Amtsgericht Hannover, VR …) | Impressum, Ad Grants, trust |
| I2 | **Freistellungsbescheid**: does one exist, date, Finanzamt, Steuernummer | Receipts, Ad Grants, donation page |
| I3 | Current board members (names, roles; photos optional) + imam | Impressum, Über uns |
| I4 | Satzung (PDF) | Transparency |
| I5 | Current amount raised (and donor count, if known) | Progress meter |
| I6 | Purchase details: is 1.3M the price only or the total incl. tax/notary? Status (reserved? notary date?) | Budget breakdown, timeline |
| I7 | What happens to donations if the purchase fails | Fallback clause |
| I8 | Photos/videos of the new building (outside, inside, outdoor area, ideally drone) + floor plans | Kaufprojekt page |
| I9 | Prayer-time table 2027 (same source as 2026) + Jumu'ah time(s) | Gebetszeiten |
| I10 | Stripe account access (or the developer who built the current spende page) | Donations |
| I11 | Hosting/domain access (Hetzner, DNS) | Deploy |
| I12 | Logo source files (vector/SVG, if available) | Design |
| I13 | Imam's position on Zakat for the purchase | Spenden FAQ |

## 10. Risks

| Risk | Mitigation |
|---|---|
| No valid Freistellungsbescheid → no receipts, no Ad Grants | Check first (I2); adjust the wording ("Spendenquittung auf Anfrage") until clarified |
| Bank/PayPal/Stripe account limits during campaign volume | Notify Sparkasse/Stripe in advance; KYC pack ready; sweep balances; GiroCode as main channel |
| Ad Grants rejected | The site works without Ads; Meta/organic/WhatsApp sharing as primary drivers |
| Progress bar looks weak (low %) | Show the real figure but lead with m² and donor count; soft-launch to the community first |
| Content goes stale after launch | Few content types, a CMS, a monthly check, a named content owner |
| Deadline too tight for the full site | Phase 1 focuses on campaign + essentials; the rest follows |

## 11. Open questions (blocking sign-off)

Answered on 2026-10-13:
- **Q1 Tech**: deploy on own VPS → Astro + Sveltia CMS + Docker/Caddy (see `DEPLOYMENT.md`).
- **Q2 Deadline**: 01.02.2027 confirmed.
- **Q4 Languages**: German + Arabic at launch (entire site, not only campaign pages).
- **All other inputs**: build with what exists, edit later → tracked in [`CONTENT-TODO.md`](CONTENT-TODO.md).
