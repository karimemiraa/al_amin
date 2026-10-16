# Anleitung: Die Verwaltung der Website

Für alle Ehrenamtlichen, die Inhalte pflegen. Keine Technik-Kenntnisse nötig. Alles, was Sie speichern, ist **sofort** auf der Website sichtbar.

> **Adresse:** `https://www.igh-hannover.de/admin`
> **Sprache:** Die Verwaltung gibt es auf Deutsch und Arabisch (unten links in der Seitenleiste umschalten).
> **Schnellsuche:** `Strg + K` (Mac: `⌘ + K`) öffnet die Befehlssuche. Tippen Sie z. B. „spenden“, „neue ankündigung“ oder „video“ und drücken Sie Enter.

---

## Inhalt

1. [Anmelden und Zwei-Faktor-Schutz (2FA)](#1-anmelden-und-zwei-faktor-schutz-2fa)
2. [Übersicht (Dashboard) und Spendenstand](#2-übersicht-dashboard-und-spendenstand)
3. [Ankündigungen und Hinweisleiste](#3-ankündigungen-und-hinweisleiste)
4. [Programm (Unterricht)](#4-programm-unterricht)
5. [Mediathek (Videos)](#5-mediathek-videos)
6. [Gebetszeiten](#6-gebetszeiten)
7. [Kampagne (Neue Moschee)](#7-kampagne-neue-moschee)
8. [Verein und Kontakt](#8-verein-und-kontakt)
9. [Zahlungen (nur Inhaber)](#9-zahlungen-nur-inhaber)
10. [Design (nur Inhaber)](#10-design-nur-inhaber)
11. [Benutzer, Konto und Protokoll](#11-benutzer-konto-und-protokoll)
12. [Sicherung (Backup)](#12-sicherung-backup)
13. [Häufige Fragen](#13-häufige-fragen)

---

## Rollen

| Rolle | Darf |
|---|---|
| **Inhaber** | Alles, auch Zahlungsdaten, Bankverbindung, Design, Benutzer und Sicherungen |
| **Redaktion** | Ankündigungen, Programm, Mediathek, Gebetszeiten, Kampagne/Spendenstand, Protokoll ansehen |

Menüpunkte, die Sie nicht nutzen dürfen, werden gar nicht angezeigt.

---

## 1. Anmelden und Zwei-Faktor-Schutz (2FA)

**Erste Anmeldung:** Sie bekommen von einem Inhaber eine **Einladung per E-Mail** (oder einen Einladungslink). Link öffnen, Namen bestätigen, Passwort wählen (mindestens 10 Zeichen; ein ganzer Satz ist am sichersten, z. B. „Unsere neue Moschee 2027!“).

**Anmelden:** E-Mail + Passwort. Ist 2FA aktiv, folgt ein 6-stelliger Code aus Ihrer Authenticator-App.

**2FA einrichten** (für Inhaber Pflicht, für alle anderen empfohlen):

1. Eine Authenticator-App aufs Handy laden: Google Authenticator, Microsoft Authenticator, 1Password o. ä.
2. In der Verwaltung: **Mein Konto → Zwei-Faktor-Schutz einrichten**.
3. Den QR-Code mit der App scannen und den 6-stelligen Code eingeben.
4. Die **10 Wiederherstellungscodes** ausdrucken oder sicher aufbewahren. Jeder Code funktioniert genau einmal, falls das Handy verloren geht.

**Bestätigen bei sensiblen Aktionen:** Vor Änderungen an Zahlungsdaten, Bankverbindung oder Benutzern fragt die Verwaltung noch einmal nach Passwort (und 2FA-Code). Danach haben Sie 10 Minuten Ruhe.

**Passwort vergessen:** Auf der Anmeldeseite „Passwort vergessen?“ (funktioniert, sobald der E-Mail-Versand unter *Zahlungen → E-Mail* eingerichtet ist). Sonst einen Inhaber bitten.

**Gesperrt?** Nach 5 falschen Versuchen ist das Konto 15 Minuten gesperrt. Einfach warten.

---

## 2. Übersicht (Dashboard) und Spendenstand

Die Startseite der Verwaltung zeigt auf einen Blick:

- **Spendenstand** mit Fortschrittsbalken. Rechts daneben ein Feld **„Spendenstand aktualisieren“**: neuen Betrag eintragen → Speichern. Fertig.
- **Gebetszeiten heute**, **nächste Unterrichte**, **letzte Änderungen** (wer hat was geändert).
- **Startklar-Liste:** was vor dem Go-live noch fehlt (Registernummer, Stripe, E-Mail, 2FA …). Punkte haken sich automatisch ab, sobald sie erledigt sind.

> **Hinweis zum Spendenstand:** Tragen Sie hier nur Überweisungen und Barspenden ein. Online-Spenden über Stripe werden **automatisch** dazugezählt (abschaltbar unter *Zahlungen*).

---

## 3. Ankündigungen und Hinweisleiste

### Neue Ankündigung (z. B. „Eid-Gebet“)

1. **Ankündigungen → Neu** (oder `Strg + K` → „neue ankündigung“).
2. Titel und Text auf **Deutsch** ausfüllen. Arabisch daneben; fehlt es, zeigt die arabische Seite den deutschen Text.
   - Taste **„Arabisch vorschlagen (KI)“**: schlägt eine Übersetzung vor (nur wenn ein KI-Schlüssel eingerichtet ist). Bitte vor dem Speichern prüfen!
3. Optional: **Bild** hochladen (JPG/PNG/WebP, max. 8 MB, wird automatisch verkleinert; Standortdaten werden entfernt).
4. Optional: **Erscheint ab** / **Läuft ab** – die Ankündigung erscheint und verschwindet dann von selbst.
5. Optional: **Oben anheften**.
6. **Speichern**.

**Status-Anzeigen in der Liste:** *Live* · *Geplant* (Startdatum in der Zukunft) · *Entwurf* (nicht veröffentlicht) · *Abgelaufen*.

### Hinweisleiste (eine Zeile oben auf jeder Seite)

Für kurze, wichtige Hinweise: „Eid-Gebet am Dienstag um 7:30 Uhr“, „Moschee heute geschlossen“, „Jumu'ah ab sofort um 13:30 Uhr“.

**Ankündigungen → Hinweisleiste** (ganz oben): Text DE/AR, optional Link und **„Automatisch ausblenden nach“**, Farbe wählen, **„Hinweisleiste anzeigen“** einschalten, speichern. Nach dem Ablaufdatum verschwindet die Leiste von selbst.

---

## 4. Programm (Unterricht)

Die Wochenübersicht zeigt alle Unterrichte nach Wochentag.

- **Neu:** Titel, Lehrer, Wochentag, Uhrzeit (oder „nach dem Maghrib/Ischa-Gebet“), Zielgruppe, Sprache.
- **Duplizieren:** praktisch für denselben Kurs an einem anderen Tag.
- **Pausieren:** Kurs fällt vorübergehend aus (z. B. Sommerferien) – er verschwindet von der Website, bleibt aber gespeichert.
- **Löschen:** nur, wenn der Kurs endgültig entfällt.

---

## 5. Mediathek (Videos)

1. Video auf YouTube hochladen (Kanal der Moschee).
2. **Mediathek → YouTube-Link einfügen.** Titel und Vorschaubild werden automatisch geholt.
3. Reihe (z. B. Khutba), Sprache, Datum prüfen. Optional **„Hervorheben“** (erscheint groß oben).
4. Speichern.

> **Live-Übertragung:** Den Livestream wie gewohnt auf YouTube starten und den Link als Video eintragen.

---

## 6. Gebetszeiten

- **Iqama:** Minuten zwischen Adhan und Gebetsbeginn, je Gebet (0–90).
- **Freitagsgebet:** Uhrzeit(en) und Hinweis, z. B. „Predigt auf Arabisch, übersetzt ins Deutsche“. Mehrere Freitagsgebete sind möglich.
- **Hinweis auf der Seite:** erscheint oben auf „Gebetszeiten“ (leer lassen = kein Hinweis).

### Neuen Jahreskalender hochladen (einmal im Jahr)

1. **„CSV-Vorlage herunterladen“** – enthält die Zeiten des aktuellen Jahres.
2. In Excel öffnen, Zeiten durch die neuen ersetzen, **als CSV speichern**.
3. Jahr wählen, Datei hochladen. Die Verwaltung prüft jede Zeile und zeigt Fehler mit Zeilennummer.

Fehlt der Kalender für ein Jahr, zeigt die Website **vorläufige** Zeiten (aus dem Vorjahr abgeleitet) und die Verwaltung warnt. Ein falsch hochgeladenes Jahr lässt sich mit dem **×** neben der Jahreszahl wieder entfernen.

---

## 7. Kampagne (Neue Moschee)

- **Ziel**, **gesammelt** (Überweisungen/Bar), **Anzahl Spender**, **Frist** (01.02.2027).
- **Gebäudedaten:** Preis pro m², Fläche, Etagen, Außenfläche, Entfernung, Minuten zur Bahn.
- **Meilensteine:** hinzufügen, Reihenfolge ändern, als erledigt markieren (z. B. „Notartermin“).
- Unten sehen Sie die **Online-Spenden über Stripe** getrennt aufgeführt.

---

## 8. Verein und Kontakt

Name, Adresse, Telefon, E-Mail, Vorstand, **Vereinsregisternummer**, **Steuerdaten** (Freistellungsbescheid), Anfahrt und Social-Media-Links (Telegram, YouTube, WhatsApp, Instagram). Diese Daten erscheinen im Footer, im Impressum und auf „Kontakt“.

---

## 9. Zahlungen (nur Inhaber)

> Diese Seite ist besonders geschützt: Wer die IBAN oder den Stripe-Schlüssel ändert, könnte Spenden umleiten. Jede Änderung wird protokolliert und **allen Inhabern per E-Mail gemeldet**.

**Bankverbindung:** Kontoinhaber, IBAN, BIC, Verwendungszweck. Die IBAN wird automatisch geprüft (Tippfehler werden erkannt). Daraus entsteht der **GiroCode** (QR-Code für die Banking-App) auf der Spenden-Seite.

**Stripe (Online-Spenden per Karte, Apple Pay, Google Pay, SEPA …):**

1. Bei [stripe.com](https://stripe.com) ein Konto für den Verein anlegen (Freistellungsbescheid bereithalten).
2. Stripe → *Entwickler → API-Schlüssel*: den **geheimen Schlüssel** (`sk_live_…`, zum Testen `sk_test_…`) hier eintragen.
3. Stripe → *Entwickler → Webhooks → Endpunkt hinzufügen*:
   - URL: `https://www.igh-hannover.de/api/stripe-webhook`
   - Ereignisse: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `invoice.paid`
   - Das **Signing Secret** (`whsec_…`) hier eintragen.
4. **„Verbindung testen“** drücken.
5. **„Online-Spenden automatisch zum Spendenstand addieren“** an lassen.

**E-Mail-Versand (SMTP):** Server, Port, Benutzer, Passwort, Absender. Wird gebraucht für Kontaktformular, Einladungen, „Passwort vergessen“ und Sicherheits-Meldungen. Mit **„Test-E-Mail senden“** prüfen.

**Übersetzung (optional):** Anthropic-API-Schlüssel (console.anthropic.com → API Keys) (`sk-ant-…`) für den Knopf „Arabisch vorschlagen“. Kosten: wenige Cent pro Text.

Alle Schlüssel werden **verschlüsselt** gespeichert und nur gekürzt angezeigt (z. B. `sk_live_…a1b2`).

---

## 10. Design (nur Inhaber)

Vier Designs mit Vorschau, ein Klick zum Aktivieren:

| Design | Wann |
|---|---|
| **Weinrot** | Passt zum Kampagnen-Flyer (Standard) |
| **Grün** | Das Grün des Original-Logos |
| **Nachtblau & Gold** | Ruhig und elegant |
| **Ramadan** | Laternen-Gold und Halbmond |

**„Während Ramadan & Eid automatisch umschalten“:** Ist das an, erscheint im Ramadan (und an den drei Eid-Tagen) von selbst das Ramadan-Design, danach wieder das gewählte Design.

---

## 11. Benutzer, Konto und Protokoll

**Benutzer** (nur Inhaber): Personen per E-Mail einladen, Rolle wählen (Inhaber/Redaktion), deaktivieren, 2FA zurücksetzen (wenn jemand sein Handy verloren hat), Regel **„2FA für alle Pflicht“**.

> Tipp: Mindestens **zwei Inhaber** anlegen, damit niemand ausgesperrt ist.

**Mein Konto:** Name, Sprache, Passwort ändern, 2FA einrichten, neue Wiederherstellungscodes, aktive Anmeldungen ansehen und **„überall abmelden“**.

**Protokoll:** Wer hat wann was geändert. Bei sensiblen Daten (IBAN, Schlüssel, Benutzer) mit vorher/nachher.

---

## 12. Sicherung (Backup)

Der Server sichert die Datenbank **jede Nacht** automatisch (14 Tage aufbewahrt). Unter **Sicherung** können Inhaber jederzeit **„Sicherung herunterladen“**. Bitte einmal im Monat eine Sicherung herunterladen und an einem sicheren Ort ablegen. Wiederherstellen: siehe [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 13. Häufige Fragen

**Ich habe gespeichert, sehe es aber nicht auf der Website.**
Seite neu laden (`Strg + F5`). Prüfen Sie bei Ankündigungen den Status (*Geplant*? *Entwurf*?).

**Ich habe aus Versehen etwas gelöscht.**
Einem Inhaber Bescheid geben. Aus der Sicherung der letzten Nacht lässt sich alles wiederherstellen.

**Ich habe mein Handy (2FA) verloren.**
Mit einem Wiederherstellungscode anmelden und danach 2FA neu einrichten. Keine Codes mehr? Ein Inhaber setzt Ihre 2FA unter *Benutzer* zurück.

**Was passiert, wenn ich eine Seite mit ungespeicherten Änderungen verlasse?**
Die Verwaltung fragt nach, bevor etwas verloren geht. Unten in der Speicherleiste steht dann „Ungespeicherte Änderungen“.

**Kann ich die Verwaltung auf dem Handy nutzen?**
Ja. Besonders praktisch für den Spendenstand nach dem Freitagsgebet oder eine schnelle Hinweisleiste.

**Lange Seitentexte (Projektbrief, Über uns, Impressum) ändern?**
Diese ändern sich selten und werden noch von der technischen Betreuung gepflegt (geplant für Phase B).
