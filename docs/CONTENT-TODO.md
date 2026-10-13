# Offene Inhalte & Freigaben vor dem Go-live

Die Website wurde mit den vorhandenen Informationen gebaut. Folgende Punkte sind **Entwürfe oder Platzhalter** und müssen vom Vorstand geprüft, ergänzt oder freigegeben werden. Fast alles lässt sich im CMS unter `/admin` ändern (siehe [CMS-ANLEITUNG.md](CMS-ANLEITUNG.md)).

## 🔴 Muss vor dem Go-live erledigt sein

| # | Was | Wo | Warum |
|---|---|---|---|
| 1 | **Spendenstand**: aktuell `65.000 €` (= die 5 % der alten Spendenseite), Spenderzahl `0` | CMS → Einstellungen → Kampagne (`src/content/settings/campaign.json`) | Der Wert ist nur übernommen, nicht geprüft. Bitte echten Stand + Datum eintragen. |
| 2 | **Registernummer** (Amtsgericht Hannover, VR …) | CMS → Einstellungen → Verein (`site.json` → `registerNumber`) | Pflichtangabe im Impressum (§ 5 DDG), Vertrauen, Google Ad Grants |
| 3 | **Vorstand** (alle vertretungsberechtigten Mitglieder) | `site.json` → `representatives` | Impressum. Aktuell nur „Mohammad Kobbani“ (vom alten Impressum) |
| 4 | **Freistellungsbescheid**: Finanzamt, Steuernummer, Datum | `site.json` → `taxOffice`, `taxNumber`, `exemptionNoticeDate` | Ohne gültigen Bescheid (≤ 5 Jahre) keine Zuwendungsbestätigungen! Felder erscheinen automatisch auf Spenden-, Über-uns- und Impressumsseite, sobald ausgefüllt. |
| 5 | **Brief des Vorstands** auf `/neue-moschee` | `src/views/ProjectPage.astro` → `letter` | Von Claude formulierter Entwurf, Unterschrift „Der Vorstand“. Bitte lesen, anpassen, freigeben. |
| 6 | **Meilensteine** (Daten + Texte) | CMS → Kampagne → Meilensteine | „Gebäude gefunden & Kaufpreis verhandelt (09/2026)“ ist eine Annahme. |
| 7 | **„Was wir planen“** (Etagen-Aufteilung) | `ProjectPage.astro` → `plans` | Erster Entwurf, als solcher gekennzeichnet. Bitte bestätigen oder ändern. |
| 8 | **Was passiert mit Spenden, wenn der Kauf scheitert?** | `ProjectPage.astro` (FAQ + „Verwendung der Spenden“), `ueber-uns` | Formuliert nach Steuerberater-Empfehlung (Rückfall auf satzungsgemäße Zwecke). Vom Vorstand/Steuerberater bestätigen lassen. |
| 9 | **Zakat-Position** | FAQ auf `/neue-moschee` und `/spenden` | Text sagt: „umstritten, Zakat wird getrennt für Bedürftige gesammelt“. Bitte vom Imam bestätigen. |
| 10 | **Stripe-Zugang** (Secret Key) + Zahlungsarten aktivieren | Server `.env` | Ohne Key leitet das Formular automatisch zur Überweisung um. |
| 11 | **SMTP-Zugang** für das Kontaktformular | Server `.env` | Sonst zeigt das Formular eine Fehlermeldung mit Telefon/E-Mail. |
| 12 | **Freitagsgebet-Uhrzeit** (14:00) – ändert sich mit Sommer-/Winterzeit? | CMS → Gebetszeiten → Freitagsgebet | Die Ramadan-Seite der alten Website nannte 13:00 Uhr. |

## 🟡 Bald nachliefern

| # | Was | Wo |
|---|---|---|
| 13 | **Gebetskalender 2027** (PDF wie 2026) | Mit `scripts/parse-prayer-table.py` einlesen. Bis dahin berechnet die Website 2027 aus 2026 (± 1 Min., als „vorläufig“ markiert). |
| 14 | **Fotos & Video vom neuen Gebäude** (innen, Gelände, Drohne), Grundrisse | `src/assets/photos/` – aktuell gibt es nur 1 Außenfoto |
| 15 | **Offizieller YouTube-Kanal** der Moschee → Kanal-ID eintragen | `site.json` → `social.youtubeChannelId` / `youtubeUrl`. Dann zeigt `/live` den Livestream automatisch. |
| 16 | **Datum der beiden Freitagspredigten** in der Mediathek (geschätzt: 2.10. und 9.10.2026) | CMS → Mediathek |
| 17 | **Logo**: Das Moschee-Symbol wurde als Vektor (SVG) nachgezeichnet und in Weinrot statt Grün gesetzt, passend zum Kampagnen-Flyer. Bitte Farbe freigeben oder Originaldatei (SVG/AI) liefern. | `src/assets/brand/mark.svg` |
| 18 | **Vereinfachter Zuwendungsnachweis** als PDF zum Download (für Spenden ≤ 300 €) | Erst nach Punkt 4 möglich |
| 19 | WhatsApp-Kanal / Instagram (falls vorhanden) | `site.json` → `social` |
| 20 | Unterricht für Kinder/Frauen (falls es bereits Angebote gibt) | CMS → Programm |

## Inhalte, die aus der alten Website übernommen wurden

- Adresse, Telefon, E-Mail, Bankverbindung, Gründungsjahr 1999, Wegbeschreibung (Stadtbahn 1, 2, 8 / Bus 131)
- Wöchentliches Programm (7 Termine) inkl. Sprache
- Gebetszeiten 2026 (aus dem offiziellen PDF, alle 365 Tage) und Iqama-Abstände (+30 / +15 / +15 / +10 / +10 Min.)
- Simultanübersetzung der Freitagspredigt (WLAN „IGH-Hannover“)
- Projektdaten vom Flyer: 1,3 Mio. €, 3 × 700 m², 1.600 m² Außengelände, 1 km, 3 Min., Frist 01.02.2027, 1 m² = 351 €
- Koran- und Hadith-Zitate vom Flyer

## Bewusst entfernt

- Das **KI-generierte Moscheebild** der alten Spendenseite (nicht das echte Gebäude – Vertrauensrisiko)
- **Meta-Pixel und Google Analytics ohne Einwilligung** (Rechtsrisiko). Google Ads lädt nur noch nach Zustimmung.
- **reCAPTCHA** (durch Honeypot ersetzt)
- **Google Fonts von Google-Servern** (Schriften werden selbst gehostet)
