# Mohammad Al-Amien Moschee – Website

Neue Website des **Islamischen Gemeindehauses Hannover e.V.** mit Fokus auf das Kaufprojekt der neuen Moschee (1,3 Mio. € bis 01.02.2027). Deutsch und Arabisch (RTL).

## Überblick

| | |
|---|---|
| Framework | [Astro 7](https://astro.build) mit `@astrojs/node` (Server-Rendering mit Seiten-Cache, `src/middleware.ts`) |
| Styling | Tailwind CSS 4, Design-Tokens in `src/styles/global.css` |
| Inhalte | SQLite-Datenbank (Node built-in), bearbeitet in der eigenen Verwaltung unter `/admin` (Login, 2FA, Rollen, Protokoll). `src/content/` enthält die Startinhalte. |
| Spenden | Stripe Checkout (`src/pages/api/checkout.ts`) + Überweisung mit GiroCode (EPC-QR, serverseitig erzeugt) |
| Gebetszeiten | Offizieller Jahreskalender der Moschee (`src/data/prayer-times/<jahr>.json`) |
| Hosting | VPS mit Docker + Caddy (automatisches HTTPS), Deployment per GitHub Actions |
| Datenschutz | Keine Cookies ohne Einwilligung, selbst gehostete Schriften, YouTube erst nach Klick |

## Lokale Entwicklung

```bash
npm install
npm run dev        # http://localhost:4321
npm test           # Automatische Tests (Login, 2FA, Inhalte …)
npm run build      # Produktions-Build nach dist/
npm start          # Produktionsserver (benötigt .env, siehe .env.example)
```

## Projektstruktur

```
src/
  pages/             Routen (de ohne Präfix, ar unter /ar) + api/
  views/             Seiten-Komponenten (Texte DE/AR direkt in der Datei)
  components/        Wiederverwendbare Bausteine (Spendenformular, Gebetszeiten, …)
  content/           Startinhalte (werden beim ersten Start in die Datenbank übernommen)
  data/prayer-times/ Gebetszeiten pro Jahr
  i18n/ui.ts         Gemeinsame Übersetzungen
  lib/               Gebetszeiten-Logik, GiroCode
src/pages/admin/     Verwaltung (Admin-Panel)
src/lib/server/      Datenbank, Login/2FA, verschlüsselte Zugangsdaten, E-Mail, Uploads
tests/               Automatische Tests (npm test)
deploy/              docker-compose + Caddyfile
docs/                PRD, Recherche, Deployment, Admin-Anleitung, offene Punkte
```

## Dokumentation

- [docs/PRD.md](docs/PRD.md): Anforderungen und Plan
- [docs/CONTENT-TODO.md](docs/CONTENT-TODO.md): **offene Inhalte und Freigaben vor dem Go-live**
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): Server einrichten und deployen
- [docs/ADMIN-ANLEITUNG.md](docs/ADMIN-ANLEITUNG.md): Inhalte pflegen in der Verwaltung (für Ehrenamtliche)
- [docs/PRD-ADMIN.md](docs/PRD-ADMIN.md): Konzept der Verwaltung
- [docs/SECURITY.md](docs/SECURITY.md): Sicherheitsprüfung und Ergebnisse
- [docs/research/](docs/research/): Analyse der alten Website, Benchmark, Recht & Spenden
