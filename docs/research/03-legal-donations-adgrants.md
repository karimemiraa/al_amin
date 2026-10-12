# Legal, donations and Google Ad Grants (Germany)

Researched 2026-10-12. **Not legal or tax advice.** Sections 3–4 should be confirmed by the association's Steuerberater.

## 1. Google Ad Grants

- **Eligibility**: Google's current DE eligibility page accepts "Verein (e.V.)" and does **not** exclude religious organisations (the exclusion was lifted in 2012). Google's own Ad Grants policy cites "houses of worship" as an example. → Eligible in principle.
- **Verification**: now via **Goodstack** (TechSoup / Stifter-helfen stopped in Aug 2023). Needs: Registernummer or Steuernummer, Vereinsregisterauszug, **Freistellungsbescheid**. Names must match exactly.
- **Risks**: the non-discrimination clause in the Google for Nonprofits Additional Terms (unclear for religious bodies, though thousands of churches are approved); Google discretion; website rejection (most common).
- **Website requirements**: own domain (no redirect to a third-party donation portal), HTTPS everywhere, substantial unique HTML content (no thin / PDF-only / "under construction" pages), clear mission, address + registration number, fast and mobile-friendly, working donation links, no commercial ads.
- **Ongoing compliance**: ≥ 5 % CTR per month (2 misses → suspension), ≥ 1 conversion/month with valid tracking, Smart Bidding, no single-word keywords, Quality Score ≥ 3, ≥ 2 ad groups × 2 ads, ≥ 2 sitelinks, geo-targeting, annual survey. Up to USD 10,000/month, search ads only.
- **Implication**: the site must be built so it does **not depend** on Ad Grants, and must have real conversion events (donation started/completed, contact, newsletter).

## 2. German website law

- **Impressum (§ 5 DDG)**: full legal name, street address, all authorised board members (§ 26 BGB), e-mail + phone, "Amtsgericht Hannover, VR …". If news is published: "Verantwortlich i.S.d. § 18 Abs. 2 MStV". Remove the EU OS-platform link (closed 20 Jul 2025).
- **Datenschutz (DSGVO)**: hosting, contact form, donation processing (Stripe/PayPal), donor data for receipts (10-year retention, § 147 AO), newsletter, embeds, Ads conversion tracking. Supervisory authority: LfD Niedersachsen. Religious affiliation is special-category data (Art. 9).
- **Consent (§ 25 TDDDG)**: VG Hannover 19.03.2025 (10 A 5385/22): Accept and Reject equally prominent on first layer; Google Tag Manager needs prior consent.
- **Fonts**: self-host (LG München I, 3 O 17493/20).
- **YouTube / Maps**: two-click placeholders; static map image linking out.
- **Ads conversion tracking**: Consent Mode v2, **basic** mode (advanced is contested in Germany).
- **Analytics**: cookieless (Plausible / Matomo cookieless) instead of GA4.
- **CAPTCHA**: honeypot or Friendly Captcha, not reCAPTCHA.
- **Accessibility**: build to WCAG 2.1 AA regardless of BFSG applicability.

## 3. Donations and receipts

- Receipts (Zuwendungsbestätigungen) require a **Freistellungsbescheid ≤ 5 years old** (§ 63 Abs. 5 AO). Without it, do **not** promise "steuerlich absetzbar".
- **≤ 300 € per donation**: bank statement + a document from the e.V. (purpose, Finanzamt, Steuernummer, date of Freistellungsbescheid, Spende vs. Mitgliedsbeitrag) suffices (§ 50 Abs. 4 EStDV). → Offer a downloadable "Vereinfachter Zuwendungsnachweis" PDF.
- PayPal/card confirmations as proof are disputed → issue proper receipts or an annual Sammelbestätigung for online donations.
- Check the e.V.'s entry in the **Zuwendungsempfängerregister** (zer.bzst.de).
- Donation page must state: exact account-holder name (Verification of Payee since 9 Oct 2025), purpose, tax status, receipt process, privacy note, and a **fallback clause** ("Kommt der Kauf nicht zustande oder übersteigen die Spenden den Bedarf, verwenden wir sie für unsere satzungsmäßigen Zwecke").
- Target transparency: purchase price vs. Grunderwerbsteuer (5 % in Niedersachsen ≈ 65,000 €) + notary/Grundbuch.
- **Qard Hasan (interest-free loans)**: publicly soliciting repayable money can be a licensable deposit business under the KWG (BGH 2025, III ZR 261/23). **Do not advertise loans on the website without a lawyer.**
- **Zakat**: whether Zakat may fund the purchase is a religious question; the imam should state the position on the site.

## 4. Payments

| Option | Fees | Receipts | Fit |
|---|---|---|---|
| Bank transfer + GiroCode QR | 0 € | Simplified proof ≤ 300 € | **Primary channel** |
| Stripe (already in use) | ~1.5 % + 0.25 € EEA cards; SEPA ~0.35 €; nonprofit discount on request | Self-issued | Keep; Apple/Google Pay, cards, PayPal, SEPA |
| PayPal nonprofit rate | 1.5 % + 0.35 € (after application) | Self-issued | Secondary |
| twingle | 5 % → 2.5 % sliding, all-in | **Automatic receipts** | Option if automated receipts are wanted |
| FundraisingBox | 4 % + payment fees | CRM workflow | Option |
| betterplace / LaunchGood | 2.8 % / tips | betterplace issues receipts; LaunchGood none | Off-domain, secondary reach only |

**De-risking**: account closures hit Muslim charities disproportionately. Keep the Sparkasse (public-law, stronger protection) + a backup bank; sweep Stripe/PayPal balances often; tell providers in advance about expected campaign volume; keep a KYC pack ready (Satzung, Registerauszug, Freistellungsbescheid, board IDs, purchase documents, funds-origin statement).

## 5. GiroCode (EPC QR) spec

Error correction M, ≤ 331 bytes, LF-separated, no trailing separator:

```
BCD
002
1
SCT

Islamisches Gemeindehaus Hannover e.V.
DE43250500000152061370
EUR100
CHAR

Spende Moscheekauf
```

Generate as static SVG at build time (no third-party QR API). Always show name/IBAN/BIC/reference in plain text next to it, with a copy button.

## 6. Transparency

- Join **Initiative Transparente Zivilgesellschaft** (free; 10 disclosures; logo use).
- Progress with "as of" date, split by source; target breakdown; milestones; separate campaign account; over/under-funding clause; annual use-of-funds report; named contacts; "no foreign state funding" statement if true.

## Key sources

support.google.com/nonprofits/answer/3215869 · /answer/1657899 · /answer/9314402 · /answer/9004493 · /answer/12016036 · support.google.com/grants/answer/117827 · gesetze-im-internet.de (AO §§ 55, 60b, 62, 63; EStDV § 50) · dr-datenschutz.de (VG Hannover 2025) · europeanpaymentscouncil.eu EPC069-12 v3.0 · paypalobjects.com DE fee list 15 Jul 2026 · twingle.de · fundraisingbox.com · transparency.de/mitmachen/initiative-transparente-zivilgesellschaft
