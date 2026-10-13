# Mohammad Al-Amien Moschee – Website

Neue Website des **Islamischen Gemeindehauses Hannover e.V.** mit Fokus auf das Kaufprojekt der neuen Moschee (1,3 Mio. € bis 01.02.2027). Deutsch und Arabisch (RTL).

## Überblick

| | |
|---|---|
| Framework | [Astro 7](https://astro.build) (statische Seiten) + `@astrojs/node` für `/api/*` |
| Styling | Tailwind CSS 4, Design-Tokens in `src/styles/global.css` |
| Inhalte | JSON-Dateien in `src/content/`, bearbeitbar über Sveltia CMS unter `/admin` |
| Spenden | Stripe Checkout (`src/pages/api/checkout.ts`) + Überweisung mit GiroCode (EPC-QR, beim Build erzeugt) |
| Gebetszeiten | Offizieller Jahreskalender der Moschee (`src/data/prayer-times/<jahr>.json`) |
| Hosting | VPS mit Docker + Caddy (automatisches HTTPS), Deployment per GitHub Actions |
| Datenschutz | Keine Cookies ohne Einwilligung, selbst gehostete Schriften, YouTube erst nach Klick |

## Lokale Entwicklung

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # Produktions-Build nach dist/
npm start          # Produktionsserver (benötigt .env, siehe .env.example)
```

## Projektstruktur

```
src/
  pages/             Routen (de ohne Präfix, ar unter /ar) + api/
  views/             Seiten-Komponenten (Texte DE/AR direkt in der Datei)
  components/        Wiederverwendbare Bausteine (Spendenformular, Gebetszeiten, …)
  content/           CMS-Inhalte: settings/, announcements/, program/, videos/
  data/prayer-times/ Gebetszeiten pro Jahr
  i18n/ui.ts         Gemeinsame Übersetzungen
  lib/               Gebetszeiten-Logik, GiroCode
public/admin/        Sveltia CMS
deploy/              docker-compose + Caddyfile
docs/                PRD, Recherche, Deployment, CMS-Anleitung, offene Punkte
```

## Dokumentation

- [docs/PRD.md](docs/PRD.md): Anforderungen und Plan
- [docs/CONTENT-TODO.md](docs/CONTENT-TODO.md): **offene Inhalte und Freigaben vor dem Go-live**
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): Server einrichten und deployen
- [docs/CMS-ANLEITUNG.md](docs/CMS-ANLEITUNG.md): Inhalte pflegen (für Ehrenamtliche)
- [docs/research/](docs/research/): Analyse der alten Website, Benchmark, Recht & Spenden
