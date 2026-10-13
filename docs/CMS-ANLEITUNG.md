# Anleitung: Inhalte der Website bearbeiten

Mit dem Redaktionssystem (CMS) unter **<https://www.igh-hannover.de/admin>** können Ehrenamtliche Inhalte der Website ändern – ohne Programmierkenntnisse. Diese Anleitung erklärt die Anmeldung und die häufigsten Aufgaben Schritt für Schritt.

**Das Wichtigste vorab:**

- Alles, was Sie speichern, ist **sofort und öffentlich** – nach **2–3 Minuten** steht es auf der Website. Es gibt keinen „Entwurf“-Knopf. (Meldungen kann man aber mit dem Schalter „Veröffentlicht“ ausblenden.)
- **Deutsche Felder immer ausfüllen.** Arabische Felder sind meist freiwillig: Bleiben sie leer, erscheint auf der arabischen Seite der deutsche Text.
- Im Zweifel lieber kurz bei der technischen Betreuung nachfragen.

---

## Inhalt

1. [Einmalig: Zugang einrichten](#1-einmalig-zugang-einrichten)
2. [Spendenstand aktualisieren (wöchentlich)](#2-spendenstand-aktualisieren-wöchentlich)
3. [Neue Meldung veröffentlichen (mit arabischer Übersetzung)](#3-neue-meldung-veröffentlichen)
4. [Iqama-Zeiten und Freitagsgebet ändern](#4-iqama-zeiten-und-freitagsgebet-ändern)
5. [Unterricht zum Programm hinzufügen](#5-unterricht-zum-programm-hinzufügen)
6. [YouTube-Video in die Mediathek aufnehmen](#6-youtube-video-in-die-mediathek-aufnehmen)
7. [Gebetszeiten für das nächste Jahr](#7-gebetszeiten-für-das-nächste-jahr)
8. [Was Sie nicht tun sollten](#8-was-sie-nicht-tun-sollten)
9. [Wenn etwas nicht klappt](#9-wenn-etwas-nicht-klappt)

---

## 1. Einmalig: Zugang einrichten

Die Inhalte der Website liegen bei **GitHub** (einem Dienst zum Speichern von Dateien mit Versionsgeschichte). Das CMS speichert Ihre Änderungen dort. Deshalb brauchen Sie ein GitHub-Konto und einen persönlichen „Schlüssel“ (Zugriffstoken).

### 1.1 GitHub-Konto

1. Auf <https://github.com/signup> ein kostenloses Konto anlegen (mit Ihrer eigenen E-Mail-Adresse). Bitte die Zwei-Faktor-Anmeldung aktivieren, wenn GitHub danach fragt.
2. Ihren GitHub-Benutzernamen an die technische Betreuung schicken. Sie werden dann zum Repository der Website eingeladen.
3. Die Einladung per E-Mail (oder auf github.com oben rechts unter der Glocke) **annehmen**.

> **Hinweis für den Vorstand:** Das Repository sollte einem **Organisationskonto des Vereins** auf GitHub gehören (nicht dem privaten Konto einer Person). Dann bleibt der Zugriff erhalten, wenn jemand ausscheidet, und der Vorstand kann Personen selbst hinzufügen und entfernen. Jede Person bekommt ein eigenes Konto – Zugänge bitte nie teilen.

### 1.2 Zugriffstoken erstellen

1. Auf github.com anmelden → oben rechts auf Ihr **Profilbild** → **Settings**.
2. Links ganz unten **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
3. Ausfüllen:
   - **Token name:** `IGH Website CMS`
   - **Expiration:** z. B. 1 Jahr. (Danach einfach einen neuen Token erstellen – GitHub erinnert per E-Mail.)
   - **Resource owner:** den Besitzer des Website-Repositorys wählen (die Vereins-Organisation, bzw. aktuell `karimemiraa`).
   - **Repository access:** **Only select repositories** → das Website-Repository (`al_amin`) auswählen.
   - **Permissions → Repository permissions → Contents:** **Read and write**. (Alles andere so lassen.)
4. Unten **Generate token** klicken. Den angezeigten Token (beginnt mit `github_pat_…`) **sofort kopieren** – er wird nur einmal angezeigt.

Falls das Repository einer Organisation gehört, muss ein Organisations-Admin den Token eventuell noch freigeben (GitHub zeigt das an).

### 1.3 Im CMS anmelden

1. <https://www.igh-hannover.de/admin> öffnen.
2. **Mit Zugriffstoken anmelden** (englisch: *Sign In Using Access Token*) wählen, den Token einfügen, **Anmelden**.
3. Der Browser merkt sich die Anmeldung. Auf fremden Computern danach bitte oben rechts über das Menü **Abmelden**.

Die Sprache der Oberfläche stellen Sie über das Menü oben rechts → **Einstellungen** → **Sprache** auf Deutsch.

**Token verloren oder versehentlich weitergegeben?** Auf GitHub unter *Settings → Developer settings → Fine-grained tokens* den Token löschen und einen neuen erstellen. Der Token ist wie ein Passwort – nie per WhatsApp/E-Mail verschicken.

---

## 2. Spendenstand aktualisieren (wöchentlich)

Bitte mindestens **einmal pro Woche** (z. B. nach dem Freitagsgebet) – ein aktueller Stand schafft Vertrauen.

1. Links **Einstellungen** → **Spendenkampagne (Moscheekauf)**.
2. **Aktueller Spendenstand (€):** neuen Betrag eintragen – **nur Ziffern**, ohne Punkt und ohne €-Zeichen. Beispiel: 72.500 € → `72500`.
3. **Stand (Datum):** das heutige Datum wählen.
4. Falls bekannt: **Anzahl Spender** aktualisieren.
5. Erreichte Meilensteine: unter **Meilensteine** den Eintrag aufklappen und **Erledigt** einschalten.
6. Oben **Speichern**.

Nach 2–3 Minuten sind Fortschrittsbalken und Zahlen auf der Website aktualisiert.

---

## 3. Neue Meldung veröffentlichen

1. Links **Aktuelles** → oben **Neu**.
2. Felder ausfüllen:
   - **Titel** (Deutsch, Pflicht) – kurz und aussagekräftig.
   - **Titel (Arabisch)** – optional.
   - **Datum** – ist automatisch heute.
   - **Kategorie** – Neuigkeit, Spendenkampagne, Veranstaltung oder Ramadan.
   - **Termin** – nur bei Veranstaltungen, z. B. „Samstag, 25.10.2026, nach Maghrib“.
   - **Text** (Deutsch, Pflicht) – über die Knöpfe lassen sich **fett**, Listen und Links einfügen.
   - **Text (Arabisch)** – optional, siehe unten.
   - **Bild** – optional; Querformat, möglichst unter 500 KB. Keine Fotos von Personen ohne deren Einverständnis.
   - **Oben anheften** – nur für sehr wichtige Meldungen (z. B. Spendenaufruf).
   - **Veröffentlicht** – eingeschaltet lassen.
3. **Speichern.**

**Arabische Übersetzung:** Am besten schreibt eine arabischsprachige Person aus der Gemeinde den Text. Sie können die Meldung auch zuerst nur auf Deutsch speichern und die arabischen Felder später ergänzen (Meldung in der Liste anklicken → ergänzen → Speichern). Solange sie leer sind, zeigt die arabische Seite den deutschen Text.

**Alte Meldung entfernen:** Meldung öffnen → **Veröffentlicht** ausschalten → Speichern. So bleibt sie für später erhalten. Löschen nur bei Fehlern.

---

## 4. Iqama-Zeiten und Freitagsgebet ändern

Die **Gebetszeiten** (Adhan) kommen automatisch aus der Jahrestabelle der Moschee. Im CMS stellen Sie nur ein, **wie viele Minuten danach** das Gemeinschaftsgebet (Iqama) beginnt.

1. Links **Einstellungen** → **Gebetszeiten & Freitagsgebet**.
2. **Iqama (Minuten nach dem Adhan):** z. B. bei Fadschr `30` = Iqama 30 Minuten nach dem Adhan.
3. **Freitagsgebet (Dschumua):** Uhrzeit im Format `HH:MM` ändern, z. B. `13:30`. Gibt es zwei Freitagsgebete, unten auf **Hinzufügen** klicken und einen zweiten Eintrag anlegen.
4. **Aktueller Hinweis:** für vorübergehende Infos, z. B. „Im Ramadan: Tarawih um 21:30 Uhr“. Wenn er nicht mehr gilt, das Feld wieder **leeren**.
5. **Speichern.**

Denken Sie an die Umstellung von Sommer- auf Winterzeit (und zurück) beim Freitagsgebet.

---

## 5. Unterricht zum Programm hinzufügen

1. Links **Programm (Unterricht)** → **Neu**.
2. Ausfüllen:
   - **Titel** und **Titel (Arabisch)** – hier sind **beide Pflicht**. Im Zweifel den deutschen Titel ins arabische Feld kopieren.
   - **Wochentag**.
   - **Beginn:** z. B. „nach Maghrib“. Die Uhrzeit wird dann automatisch aus den Gebetszeiten berechnet. Nur bei „feste Uhrzeit“ zusätzlich das Feld **Uhrzeit** (`HH:MM`) ausfüllen.
   - **Beschreibung** (optional, Deutsch/Arabisch).
   - **Sprache** und **Zielgruppe** (Alle, Männer, Frauen, Kinder, Jugendliche).
   - **Lehrer / Referent** (optional).
   - **Aktiv** – eingeschaltet lassen.
3. **Speichern.**

**Unterricht pausiert** (z. B. Ferien)? Eintrag öffnen → **Aktiv** ausschalten → Speichern. Später einfach wieder einschalten.

---

## 6. YouTube-Video in die Mediathek aufnehmen

Sie brauchen die **Video-ID**: 11 Zeichen aus der YouTube-Adresse.

| So sieht der Link aus | Video-ID |
|---|---|
| `https://www.youtube.com/watch?v=JYlszuOud10` | `JYlszuOud10` (alles nach `v=`) |
| `https://www.youtube.com/watch?v=JYlszuOud10&t=120s` | `JYlszuOud10` (alles ab `&` weglassen) |
| `https://youtu.be/JYlszuOud10?si=abc123` | `JYlszuOud10` (alles ab `?` weglassen) |
| `https://www.youtube.com/live/JYlszuOud10` | `JYlszuOud10` |

Den Link bekommen Sie auf YouTube über **Teilen** → **Kopieren**.

1. Links **Mediathek (Videos)** → **Neu**.
2. **YouTube-Video-ID** einfügen (nur die 11 Zeichen).
3. **Titel** (Deutsch), **Titel (Arabisch)** (optional, gern den Original-Titel von YouTube), **Datum** der Predigt.
4. **Reihe** (z. B. Freitagspredigt), **Sprache**, **Sprecher**.
5. **Hervorheben:** einschalten, wenn das Video groß oben gezeigt werden soll – dann beim vorher hervorgehobenen Video wieder ausschalten.
6. **Speichern.**

---

## 7. Gebetszeiten für das nächste Jahr

Die jährliche Gebetszeiten-Tabelle (PDF der Moschee) kann **nicht über das CMS** eingespielt werden. Bitte **bis spätestens Anfang Dezember** das PDF für das kommende Jahr an die technische Betreuung schicken. Ohne neue Tabelle fehlen auf der Website ab dem 1. Januar die Gebetszeiten.

*Für die technische Betreuung:*

```bash
pdftotext -layout gebetszeiten-2027.pdf table.txt
python3 scripts/parse-prayer-table.py table.txt 2027 src/data/prayer-times/2027.json
```

Das Skript muss „365 days parsed“ (im Schaltjahr 366) melden. Danach einige Tage stichprobenartig mit dem PDF vergleichen (z. B. 1. Januar, 29. Februar, 30. Juni, 31. Dezember), die Datei committen und auf `main` pushen. Details stehen im Kopf des Skripts.

---

## 8. Was Sie nicht tun sollten

- **Keine Einstellungen löschen** (Spendenkampagne, Gebetszeiten, Moschee & Verein) und keine Felder darin leeren, die nicht ausdrücklich als „optional“ beschrieben sind.
- **Deutsche Felder nie leer lassen.** Arabisch ist freiwillig (Ausnahme: Titel im Programm).
- **Bankverbindung (IBAN) nur nach Rücksprache mit dem Vorstand ändern** und danach zu zweit kontrollieren – ein Tippfehler leitet Spenden ins Leere. Die IBAN steckt auch im QR-Code für Banking-Apps.
- **Keine personenbezogenen Daten** (Telefonnummern, Fotos von Kindern, Namen von Spendern) ohne Einverständnis veröffentlichen.
- Beträge **ohne Punkte** eintragen (`1300000`, nicht `1.300.000`).
- Den **Zugriffstoken nicht weitergeben**. Jede Person nutzt ihr eigenes Konto.
- Nicht viele Änderungen in schneller Folge an derselben Stelle speichern – lieber alles in Ruhe eintragen und einmal speichern.

---

## 9. Wenn etwas nicht klappt

| Problem | Was tun? |
|---|---|
| Änderung ist nach 3 Minuten nicht zu sehen | Seite neu laden mit **Strg + F5** (Mac: **Cmd + Shift + R**). Nach 10 Minuten immer noch nichts? Dann ist die Aktualisierung vermutlich an einem Fehler gescheitert – die alte Version bleibt online. Bitte der technischen Betreuung Bescheid geben (was wurde wann geändert). |
| Anmeldung klappt nicht / „Fehler beim Speichern“ | Der Token ist evtl. abgelaufen oder hat nicht das Recht „Contents: Read and write“ → neuen Token erstellen (Abschnitt 1.2). |
| Versehentlich etwas Falsches gespeichert | Einfach korrigieren und erneut speichern. Jede Version wird bei GitHub aufbewahrt; die technische Betreuung kann alles wiederherstellen. |
| Rot markiertes Feld beim Speichern | Pflichtfeld leer oder falsches Format (z. B. Uhrzeit nicht als `HH:MM`). Der Hinweis unter dem Feld erklärt, was erwartet wird. |
