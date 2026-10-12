# Benchmark: mosque websites and building-purchase campaigns

Researched 2026-10-12. Full source list at the end.

## Most relevant examples

| Site | Take | Avoid |
|---|---|---|
| **Kaufprojekt Berner Moschee** (kaufprojekt-bernermoschee.ch) — closest model, CHF 1.8M purchase | Purchase-only goal; progress bar "updated weekly"; sticky anchor nav (Ziel / Projekt / Verein / Spenden / FAQ); personal status letter from the board; refund/redirect policy if the purchase fails; audited accounts; letters of support from local churches; FAQ | Text-heavy; inconsistent dates |
| **East London Mosque** | Header Donate on every page; quick-donate presets; **sq-ft appeal** (£500/sq ft, "675 sq ft remaining") closed during Ramadan; live video/audio; charity no. + "How we use your donations" | Cluttered donate page; shop-like basket |
| **Al-Rahman Moschee Leipzig** | German m² mechanic (1 m² = 500 €, packages); strong Sadaqah Jariyah copy ("Dein Quadratmeter bleibt. Dein Lohn bleibt.") | No goal, no progress, receipts only on request |
| **Green Lane Masjid** | Impact numbers; annual report in hero; regulator badge; own media TV | Expansion page without progress or renders |
| **Cambridge Central Mosque** | Premium architecture-led brand; Hijri + Gregorian date bar; "Plan your visit" | No online payment |
| **Sheikh Zayed Grand Mosque** | Visual benchmark: full-bleed hero, next-prayer widget, accessibility controls | Feature overload |
| **MCC East Bay / ICOI** | Clear 3–4 CTA hero; named imams; weekly email; governance pages | — |
| **EPIC Masjid** | — | **Stale content** ("Coming soon", © 2023, 0 followers) destroys trust |
| **Othman Moschee (GoFundMe)** | Construction-progress photo updates | Goal unexplained; 0 % bar; no receipts |

## Top patterns to adopt (ranked)

1. Campaign as the homepage hero: one headline, goal, live amount, deadline, one CTA.
2. Honest progress meter **with an "as of" date**; never launch publicly at 0–5 %.
3. **m² sponsorship** mapped to the real building (here 351 €/m² = 1.3M ÷ 3,700 m²), shown as "X of 3,700 m² vergeben", ideally a filling floor-plan grid.
4. Sadaqah Jariyah framing with the hadith on building a mosque, plus a "Niyyah / im Namen von …" dedication field (e.g. for deceased parents).
5. Transparency block: Vereinsregister no., Freistellungsbescheid, Satzung, named board, purchase facts, what happens if the purchase fails, origin-of-funds statement.
6. Timeline of milestones (Absichtserklärung → Finanzierung → Notartermin → Übergabe) with short board letters.
7. Presets + monthly "Bau-Pate" giving.
8. German payment rails: bank transfer + GiroCode, SEPA debit, PayPal, card, Apple/Google Pay (Giropay discontinued).
9. Clear receipt process (Zuwendungsbestätigung).
10. Real visual proof: photos/drone of the building, floor plan, 60–90 s imam/chair video.
11. Opt-in donor wall + physical donor wall promise.
12. Ramadan / last-10-nights sprint mechanics (countdown, matching donor).
13. Endorsements from outside the community (city, churches, neighbours, Schura).
14. Always-useful community layer (prayer times, lessons, latest video) so every visit passes the progress bar.
15. WhatsApp share with pre-written text and image; QR posters for Friday prayer.

## Prayer-time data options

| Option | Pros | Cons |
|---|---|---|
| Mosque's own yearly table (current) | Exactly matches what the imam announces | Yearly manual upload |
| Mawaqit widget | Free; same data feeds TV screen + app | iframe styling; third-party embed (consent) |
| Aladhan API at build time | Full control, no runtime third party | Start times only; high-latitude issues; may disagree with mosque table |

**Decision for this project**: keep the mosque's own table as the source of truth (import CSV/JSON), Iqamah + Jumu'ah editable in the CMS.

## Video / live

YouTube channel as backbone (playlists per series), site embeds with a **two-click consent placeholder**; one permanent `/live` page embedding the channel's live stream. Metadata in CMS: title, teacher, series, language, date, YouTube ID.

## CMS options (summary)

- WordPress on a German managed host: familiar, but plugin maintenance and bloat (current site).
- **Astro static site + git-based CMS (Decap/Sveltia)**: best speed, security and design control; volunteers edit structured content only; depends on one technical maintainer.
- Webflow / Storyblok / Sanity: nice editors but cost, lock-in or a weaker GDPR story.
- Mosque SaaS (MasjidBox, Mohid, Masjidal): generic, no German donation receipts.

## Sources

eastlondonmosque.org.uk (donate, eternal-rewards, news/synagogue-sq-ft-appeal) · cambridgecentralmosque.org · greenlanemasjid.org/expansion · szgmc.gov.ae · icoi.net · mcceastbay.org · epicmasjid.org · kaufprojekt-bernermoschee.ch · leipziger-moschee.de/en/spenden/waqf · gofundme.com/f/othmanmoschee-aschaffenburg-gemeinsam-bauen · islam-penzberg.de · ditib.de · help.mawaqit.net · masjidbox.com · aladhan.com/calculation-methods · e-recht24.de (YouTube embeds)
