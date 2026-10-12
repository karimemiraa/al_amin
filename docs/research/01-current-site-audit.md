# Audit: current website igh-hannover.de

Crawled 2026-10-12. Facts are verbatim from the live site unless noted.

## Organisation facts (as published)

| Item | Value |
|---|---|
| Legal name | Islamisches Gemeindehaus Hannover e.V. (site title wrongly says "Islamische") |
| Mosque name | Mohammad Al-Amien Moschee ("Vahrenwalder Moschee", "Vahrenwalder Platz") |
| Address | Grabbestraße 3b, 30165 Hannover (rear courtyard of the building block) |
| Founded | 1999 |
| Phone | +49 173 7307516 (Mohamad Kobbani, "Abu Elias"); legacy site also lists 0152 34027220 |
| E-mail | kontakt@igh-hannover.de |
| Bank | IBAN DE43 2505 0000 0152 0613 70, BIC NOLADE2HXXX (Sparkasse Hannover) |
| Impressum | "Vertreten durch: Mohammad Kobbani". No Vereinsregister no., no Registergericht. Still cites § 5 TMG |
| Board (2010 press article) | Vereinsvorsitzender Ahmed Atrasch, Vereinssprecher Mohamad Kobbani, Imam Mahmoud Jlek (may be outdated) |
| Umbrella | Member of Schura Niedersachsen; independent, mostly Arabic-speaking, Sunni |
| Socials | Telegram t.me/Masjid_Mohammad_Al_Amien (~2K subscribers, regular live streams). No official YouTube/Instagram/Facebook found. Khutbahs are on Sheikh Ahmad Obaid's personal channel youtube.com/@ahmadobaid621 |

## Pages

- **Home**: hero, prayer-time widget, "Freitagsgebet: 14:00 Uhr" (hardcoded), program cards, donation teaser, 6 activity tiles, "Was ist Islam?", 2 articles, gallery.
- **Über uns**: one paragraph (2022); Quran citations 49:13 and 3:64 are swapped.
- **Kontakt**: WPForms + reCAPTCHA, Google Maps embed, leftover Golden-Gate placeholder map script. Hours "Montag – Sonntag" vs footer "Samstag — Freitag".
- **Gebetskalender**: yearly PDF + 12 monthly PDFs + Ramadan Imsakiah PDF.
- **Simultanübersetzung**: Friday khutbah (Arabic) translated live to German over the mosque Wi-Fi (`igh-hannover.live`, local only).
- **Artikel**: only 2 posts (2010 visit by Mayor Weil; 2022 "Der Islam").
- **Spendenkonto**: empty page. Old `/spenden` page unlinked, with a broken GiveWP link.
- **spende.igh-hannover.de**: separate static campaign page, DE/EN/AR/TR, Stripe Checkout (PHP `create-checkout-session.php`), amounts 25/50/100/200/351 €, "1 m² = 351 €", progress bar **hardcoded at 5 %**, Meta Pixel without consent, and an **AI-generated fantasy mosque image** (not the real building).

## Prayer times

- Plugin "Daily Prayer Time for Mosques"; times come from the mosque's own yearly table (not calculated live). Adhan + Iqamah shown.
- Calculation method not stated. Jumu'ah 14:00 (13:00 during Ramadan/winter page). Single Jumu'ah.

## Weekly program (from homepage + poster)

| When | Title | Language |
|---|---|---|
| Sat after Asr | Vorträge – Die Sirah des Propheten ﷺ | German |
| Sun after Asr | Islamischer Glaube – Grundlagen | Arabic |
| Fri after Maghrib | Koranstunde – Rezitation & Tajweed | Arabic |
| Tue after Maghrib | Tazkiyah (مجالس التزكية) / Al-Iksir (الإكسير) | Arabic |
| Thu after Maghrib | Hifz session (جلسة حفظ) | Arabic |
| Sat after Fajr | Quran Tadabbur (مجلس تدبّر قرآني) | Arabic |
| Sun after Fajr | Fajr der Änderung – Sirah + breakfast | Arabic |

No children's, women's, convert or German-language courses listed.

## Tech

WordPress 7.0.2 on Hetzner, Kadence theme + Kadence Blocks, Rank Math PRO, Site Kit (GA tag), WPForms, Google Fonts from Google servers, ~32 JS / 19 CSS files, slow TTFB (1.7–2.5 s, measured via proxy).

## Assets

- Logo: `/wp-content/uploads/2022/12/moschee-logo.png` (white text), `moschee-logo-dark.png`, `moschee-icon.png`.
- Real photos (2023, 2560 px): `/wp-content/uploads/2023/02/{001..007,010,011}-scaled.jpg` (courtyard, fountain, hallway, prayer hall, congregation).
- New building photo: `spende.igh-hannover.de/images/Moschee_ohne.jpg` (2400×1792).

## Key weaknesses

1. **Trust / legal**: incomplete Impressum; GA + Meta Pixel without consent; outdated Datenschutz; static 5 % bar labelled "100 % Transparenz"; AI image could mislead donors.
2. **Stale content**: newest article 2022; empty pages; legacy HTML site still indexed.
3. **Inconsistencies**: opening hours, Jumu'ah time, typos, mixed English UI strings.
4. **Fragmented donations**: 3 places (subdomain, empty page, unlinked page).
5. **Missing**: events, video/live, visitor info, multilingual main site (community is mainly Arabic-speaking), how-to-find-us.
