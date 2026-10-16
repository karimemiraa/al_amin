# Website-Betrieb: Server einrichten und aktualisieren

Diese Anleitung beschreibt, wie die Website **www.igh-hannover.de** auf einem eigenen Server (VPS) läuft, wie man sie zum ersten Mal einrichtet und wie Updates, Backups und Fehlersuche funktionieren. Sie richtet sich an Ehrenamtliche mit etwas Technik-Erfahrung (Befehle in ein Terminal kopieren können reicht).

> Für das Bearbeiten von Inhalten (Spendenstand, Ankündigungen, Programm, Videos, Design …) siehe [ADMIN-ANLEITUNG.md](ADMIN-ANLEITUNG.md). Das geschieht im Browser unter `/admin` – dafür braucht man keinen Server-Zugang.

---

## 1. Überblick: Wie hängt alles zusammen?

```
Besucher ──HTTPS──▶ Caddy (Port 80/443, automatische Zertifikate)
                        │
                        ▼
                    web (Node.js, Port 4321, nur intern erreichbar)
                    ├─ Website (Seiten werden aus der Datenbank erzeugt und zwischengespeichert)
                    ├─ /admin (Verwaltung mit Login + 2FA)
                    ├─ /api/checkout (Stripe), /api/stripe-webhook, /api/contact
                    └─ Volume igh_data: SQLite-Datenbank, hochgeladene Bilder, nächtliche Backups
```

- Der **Quellcode** liegt im GitHub-Repository. Die **Inhalte** (Ankündigungen, Programm, Spendenstand, Benutzer …) liegen in der Datenbank auf dem Server (Docker-Volume `igh_data`) und werden in der Verwaltung unter `/admin` bearbeitet – Änderungen sind sofort live.
- Auf dem Server laufen zwei Docker-Container: **web** (die Website) und **caddy** (Webserver, kümmert sich um HTTPS-Zertifikate von Let's Encrypt und Weiterleitungen).
- Bei jeder **Code-Änderung** auf dem Branch `main` baut GitHub Actions die Seite zur Probe und spielt sie dann per SSH automatisch auf den Server (ca. 2–3 Minuten). Die Datenbank bleibt dabei unangetastet.

Wichtige Dateien im Repository:

| Datei | Zweck |
|---|---|
| `Dockerfile` | Bauanleitung für den Website-Container |
| `deploy/docker-compose.yml` | Startet `web` und `caddy` zusammen |
| `deploy/Caddyfile` | Domains, HTTPS, Sicherheits-Header, Weiterleitungen alter URLs |
| `.github/workflows/deploy.yml` | Automatisches Bauen und Ausrollen |
| `.env` (nur auf dem Server!) | Hauptschlüssel `APP_SECRET` und optionale Grundeinstellungen |
| Volume `igh_data` | Datenbank, Bilder, Backups – **das Wichtigste auf dem Server** |

---

## 2. Voraussetzungen

- Ein VPS mit **Ubuntu 24.04 LTS**, z. B. Hetzner Cloud CX22 (2 vCPU, 4 GB RAM, 40 GB SSD). Weniger als 2 GB RAM reicht zum Bauen der Seite oft nicht (siehe [Swap](#swap-bei-wenig-arbeitsspeicher)).
- Zugriff auf die DNS-Einstellungen der Domain `igh-hannover.de` (beim Domain-Anbieter).
- Ein GitHub-Konto mit Admin-Rechten auf dem Repository.
- Ein Stripe-Konto des Vereins und ein E-Mail-Postfach (SMTP) für das Kontaktformular.

Bei der Server-Bestellung am besten gleich den eigenen **SSH-Schlüssel** hinterlegen (statt Passwort).

---

## 3. Server vorbereiten

Als `root` per SSH auf den Server einloggen (`ssh root@<SERVER-IP>`) und die folgenden Blöcke nacheinander ausführen.

### 3.1 System aktualisieren und automatische Sicherheitsupdates

```bash
apt update && apt -y upgrade
apt -y install git ufw unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades   # Frage mit "Ja" beantworten
```

### 3.2 Docker und Docker Compose installieren

(Offizielle Anleitung: <https://docs.docker.com/engine/install/ubuntu/>)

```bash
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt update
apt -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
docker compose version   # Test: zeigt eine Versionsnummer
```

### 3.3 Benutzer für das Deployment anlegen

Wir arbeiten nicht dauerhaft als `root`. Der Benutzer `deploy` darf Docker benutzen und besitzt den Website-Ordner.

```bash
adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy
mkdir -p /home/deploy/.ssh && cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh && chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys
mkdir -p /opt/igh-website && chown deploy:deploy /opt/igh-website
```

> Hinweis: Mitglieder der Gruppe `docker` haben faktisch Root-Rechte. Den Zugang zu `deploy` also genauso sorgfältig behandeln wie `root`.

### 3.4 Firewall (ufw)

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp     # SSH (bei anderem SSH-Port diesen eintragen!)
ufw allow 80/tcp     # HTTP (für Zertifikate und Weiterleitung auf HTTPS)
ufw allow 443/tcp    # HTTPS
ufw allow 443/udp    # HTTP/3
ufw enable
ufw status
```

Gut zu wissen: Docker trägt veröffentlichte Ports (hier nur 80/443 von Caddy) selbst in die Firewall ein. Der Website-Container (Port 4321) ist absichtlich **nicht** veröffentlicht und nur für Caddy erreichbar.

Bei Hetzner kann man zusätzlich in der Cloud Console eine „Firewall“ mit denselben Regeln anlegen.

### Swap bei wenig Arbeitsspeicher

Hat der Server nur 2 GB RAM oder bricht der Build mit „Killed“ / „out of memory“ ab:

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 4. DNS-Einträge

Beim Domain-Anbieter folgende Einträge setzen (`<IPv4>` / `<IPv6>` = Adressen des Servers, stehen in der Hetzner Console):

| Name | Typ | Wert |
|---|---|---|
| `www` | A | `<IPv4>` |
| `www` | AAAA | `<IPv6>` |
| `@` (die Domain selbst, `igh-hannover.de`) | A | `<IPv4>` |
| `@` | AAAA | `<IPv6>` |
| `spende` | A | `<IPv4>` |
| `spende` | AAAA | `<IPv6>` |

- **MX-, SPF- und andere Mail-Einträge nicht anfassen**, sonst funktioniert die E-Mail des Vereins nicht mehr.
- Wenn der Server keine IPv6-Adresse hat, die AAAA-Einträge weglassen (und eventuell vorhandene alte AAAA-Einträge löschen!).
- Änderungen brauchen je nach TTL einige Minuten bis Stunden. Prüfen mit: `dig +short www.igh-hannover.de` (muss die Server-IP zeigen).

Caddy holt die HTTPS-Zertifikate erst, wenn das DNS stimmt. Was Caddy weiterleitet:

- `igh-hannover.de/...` → `https://www.igh-hannover.de/...`
- `spende.igh-hannover.de` → `https://www.igh-hannover.de/spenden` (gut für Flyer und QR-Codes)
- alte Adressen der früheren WordPress-Seite (z. B. `/uberuns`, `/spendenkonto`, `/gebetskalendar`) → neue Seiten. Die Liste steht in `deploy/Caddyfile`.

---

## 5. Website auf den Server holen

Ab jetzt als Benutzer `deploy` arbeiten: `ssh deploy@<SERVER-IP>`.

```bash
cd /opt/igh-website
git clone https://github.com/karimemiraa/al_amin.git .
```

**Ist das Repository privat?** Dann braucht der Server einen eigenen Lese-Schlüssel („Deploy Key“):

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_readonly -N "" -C "igh-server"
cat ~/.ssh/github_readonly.pub
```

Den angezeigten Text in GitHub unter *Repository → Settings → Deploy keys → Add deploy key* eintragen („Allow write access“ **nicht** anhaken). Dann:

```bash
cat >> ~/.ssh/config <<'EOF'
Host github.com
  IdentityFile ~/.ssh/github_readonly
EOF
git clone git@github.com:karimemiraa/al_amin.git .
```

> Zieht das Repository später in eine GitHub-Organisation des Vereins um: `git remote set-url origin <neue-URL>` auf dem Server ausführen.

---

## 6. Zugangsdaten: die Datei `.env`

```bash
cd /opt/igh-website
cp .env.example .env
chmod 600 .env
nano .env        # speichern mit Strg+O, Enter; beenden mit Strg+X
```

Die `.env` liegt **nur auf dem Server** und wird nie ins Repository hochgeladen.

| Variable | Bedeutung |
|---|---|
| `APP_SECRET` | **Pflicht.** Hauptschlüssel, mit dem gespeicherte Zugangsdaten (Stripe-Schlüssel, SMTP-Passwort) verschlüsselt werden. Einmalig erzeugen mit `openssl rand -base64 32`, im Passwortmanager des Vorstands sichern und **nie wieder ändern** (sonst sind gespeicherte Zugangsdaten unlesbar und müssen neu eingegeben werden). |
| `DATA_DIR` | Nicht ändern – im Container ist das `/app/data` (Volume `igh_data`). |
| `PUBLIC_SITE_URL` | Adresse der Website, `https://www.igh-hannover.de`. Wird für die Rücksprung-Links von Stripe gebraucht. |
| `STRIPE_SECRET_KEY` | Optional. Besser in der Verwaltung unter *Zahlungen & E-Mail* eintragen (verschlüsselt gespeichert, Änderungen protokolliert). Ein Wert hier dient nur als Ersatz. |
| `SMTP_*`, `CONTACT_*` | Optional – ebenfalls besser in der Verwaltung unter *Zahlungen & E-Mail* eintragen. |
| `SMTP_HOST` | Mailserver des E-Mail-Anbieters, z. B. `smtp.ionos.de` |
| `SMTP_PORT` | Meist `587` (STARTTLS). `465` nur, wenn der Anbieter es verlangt (siehe Abschnitt 12). |
| `SMTP_USER` / `SMTP_PASS` | Login des Postfachs, über das die Website Mails verschickt |
| `CONTACT_TO` | Wer die Nachrichten aus dem Kontaktformular bekommt, z. B. `kontakt@igh-hannover.de` |
| `CONTACT_FROM` | Absender der Mails, z. B. `website@igh-hannover.de` – muss zum SMTP-Postfach passen |
| `PUBLIC_PLAUSIBLE_DOMAIN` | Optional: `www.igh-hannover.de`, wenn ein Plausible-Konto (cookielose Statistik) existiert. Leer = aus. |
| `PUBLIC_PLAUSIBLE_SRC` | Skript-Adresse von Plausible; Standard so lassen. Bei selbst gehostetem Plausible auch die CSP im `Caddyfile` anpassen. |
| `PUBLIC_GOOGLE_ADS_ID` | Optional: Google-Ads-Konto (Google Ad Grants), z. B. `AW-123456789`. Wird nur nach Einwilligung geladen. Leer = aus. |
| `PUBLIC_GOOGLE_ADS_DONATION_LABEL` | Optional: Conversion-Label für „Spende abgeschlossen“ aus Google Ads |
| `HOST` / `PORT` | Nicht ändern (`0.0.0.0` / `4321`). |

Wichtig:

- Variablen mit `PUBLIC_` werden **beim Bauen** in die Seiten eingebaut. Nach einer Änderung immer mit `--build` neu starten (Abschnitt 7).
- Kommt in einem Passwort ein `$` vor, muss es in der `.env` als `$$` geschrieben werden (Eigenheit von Docker Compose).
- Keine Leerzeichen um das `=`.

### 6.1 Stripe einrichten

1. Im [Stripe Dashboard](https://dashboard.stripe.com) das Vereinskonto vollständig aktivieren (Vereinsregisterauszug, Vorstand, Bankkonto). Beim Stripe-Support nachfragen, ob es einen Rabatt für gemeinnützige Organisationen gibt.
2. **Testen zuerst:** oben rechts „Testmodus“ einschalten → *Entwickler → API-Schlüssel* → „Geheimer Schlüssel“ (`sk_test_…`) kopieren und in der Verwaltung unter *Zahlungen & E-Mail* eintragen, Modus „Test“, dann „Verbindung testen“. Testspenden mit der Karte `4242 4242 4242 4242`, beliebigem zukünftigen Ablaufdatum und beliebiger Prüfziffer.
3. **Webhook (für den automatischen Spendenstand):** *Entwickler → Webhooks → Endpunkt hinzufügen* → URL `https://www.igh-hannover.de/api/stripe-webhook`, Ereignisse `checkout.session.completed` und `invoice.paid`. Das angezeigte Signing Secret (`whsec_…`) in der Verwaltung eintragen. Danach werden Online-Spenden automatisch zum Spendenstand addiert.
3a. **Live gehen:** Testmodus aus → den Live-Schlüssel (`sk_live_…`) und das Live-Webhook-Secret in der Verwaltung eintragen, Modus „Live“. Den Live-Schlüssel niemals per E-Mail/Chat verschicken.
4. *Einstellungen → Zahlungen → Zahlungsmethoden* aktivieren:
   - **Karten**
   - **PayPal** (muss bei Stripe einmalig freigeschaltet bzw. mit dem PayPal-Konto verbunden werden)
   - **SEPA-Lastschrift** (Achtung: Lastschriften sind erst nach einigen Tagen endgültig bestätigt)
   - **Apple Pay / Google Pay** (Wallets) – bei Stripe Checkout ist keine Domain-Verifizierung nötig
5. *Einstellungen → Unternehmensdaten → Öffentliche Angaben*: **Abrechnungsbeschreibung** (Statement Descriptor), z. B. `IGH HANNOVER SPENDE` (max. 22 Zeichen, erscheint auf dem Kontoauszug), außerdem Support-E-Mail und Telefon.
6. *Einstellungen → Branding*: Logo/Icon der Moschee, Akzentfarbe (Dunkelgrün) – das sieht man auf der Stripe-Bezahlseite.
7. Optional: *Einstellungen → Kunden-E-Mails* → „Erfolgreiche Zahlungen“ einschalten, dann erhalten Spender automatisch eine Zahlungsbestätigung von Stripe. (Das ersetzt **nicht** die Zuwendungsbestätigung des Vereins.)

---

## 7. Website starten

```bash
cd /opt/igh-website
docker compose -f deploy/docker-compose.yml up -d --build
```

Der erste Start dauert 3–5 Minuten (Pakete laden, Seite bauen). Danach:

```bash
docker compose -f deploy/docker-compose.yml ps        # beide Container "running", web "healthy"
docker compose -f deploy/docker-compose.yml logs -f caddy   # Zertifikate: "certificate obtained successfully"
```

Dann im Browser <https://www.igh-hannover.de> öffnen.

**Erster Start der Verwaltung:** <https://www.igh-hannover.de/admin> öffnen. Aus Sicherheitsgründen braucht die allererste Einrichtung einen Einmal-Link aus dem Server-Protokoll: auf dem Server `dc logs web | grep setup` eingeben und den angezeigten Link (`…/admin/setup?token=…`) öffnen. (Alternativ in der `.env` selbst `SETUP_TOKEN=…` festlegen.) Dann erscheint die Einrichtung: Name, E-Mail und Passwort des ersten **Inhabers** eingeben, danach die Zwei-Faktor-Anmeldung mit einer Authenticator-App einrichten und die Wiederherstellungscodes sicher ablegen. Weitere Personen lädt der Inhaber danach unter *Benutzer* ein. (Die Einrichtungsseite ist nur erreichbar, solange noch kein Konto existiert – direkt nach dem ersten Deployment erledigen!) Testen: Seiten aufrufen, eine Testspende (im Stripe-Testmodus), eine Nachricht über das Kontaktformular, Weiterleitung von `https://spende.igh-hannover.de`.

Tipp: Damit man den Befehl nicht ständig tippen muss, einmalig ausführen:

```bash
echo 'alias dc="docker compose -f /opt/igh-website/deploy/docker-compose.yml"' >> ~/.bashrc && source ~/.bashrc
# danach z. B.: dc ps   dc logs -f web   dc restart web
```

---

## 8. Automatisches Ausrollen mit GitHub Actions

Bei jedem Commit auf `main` läuft `.github/workflows/deploy.yml`:

1. **Build check:** GitHub baut die Seite zur Probe. Schlägt das fehl (z. B. Pflichtfeld im CMS leer, Tippfehler im Code), wird **nichts** ausgerollt – die alte Version bleibt online.
2. **Deploy:** GitHub verbindet sich per SSH mit dem Server und führt aus:
   `git fetch` → `git reset --hard origin/main` → `docker compose … up -d --build` → alte Images aufräumen.

Solange die Secrets (unten) fehlen, wird der Deploy-Schritt einfach übersprungen.

### 8.1 SSH-Schlüssel nur für GitHub erzeugen

Auf dem **eigenen Rechner** (nicht auf dem Server):

```bash
ssh-keygen -t ed25519 -f igh-deploy -N "" -C "github-actions-deploy"
```

Das erzeugt zwei Dateien: `igh-deploy` (privat, geheim!) und `igh-deploy.pub` (öffentlich).

Den öffentlichen Schlüssel auf dem Server erlauben:

```bash
ssh deploy@<SERVER-IP> "cat >> ~/.ssh/authorized_keys" < igh-deploy.pub
```

Optional, aber empfohlen – den Fingerabdruck des Servers ermitteln (schützt davor, dass GitHub sich mit einem falschen Server verbindet). Auf dem Server:

```bash
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
# Ausgabe z. B.: 256 SHA256:AbCdEf... root@server (ED25519) → den Teil "SHA256:AbCdEf..." kopieren
```

### 8.2 Secrets in GitHub eintragen

*Repository → Settings → Secrets and variables → Actions → New repository secret*:

| Name | Inhalt |
|---|---|
| `VPS_HOST` | IP-Adresse (oder Hostname) des Servers |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | kompletter Inhalt der Datei `igh-deploy` (inkl. `-----BEGIN …` und `-----END …`) |
| `VPS_PORT` | optional, nur wenn SSH nicht auf Port 22 läuft |
| `VPS_SSH_FINGERPRINT` | optional, der `SHA256:…`-Wert von oben |

Danach die Datei `igh-deploy` auf dem eigenen Rechner sicher löschen oder in einem Passwortmanager ablegen.

Test: *Actions → Build & Deploy → Run workflow*. Beide Jobs sollten grün werden.

### 8.3 So fließt eine Änderung

```
Code-Änderung ─▶ Commit auf main ─▶ GitHub Actions: Build check ─▶ Deploy auf Server ─▶ live
                                    (ca. 1 Min.)                  (ca. 1–2 Min.)
```

Insgesamt **2–3 Minuten**. Inhalte aus der Verwaltung (`/admin`) brauchen das nicht – sie sind sofort nach „Speichern“ live. Den Fortschritt sieht man unter *Actions* im Repository. Ein roter Haken bedeutet: Es wurde nichts ausgerollt – Fehlermeldung im Job anklicken.

---

## 9. Backups

Der Code liegt in GitHub. **Die Inhalte, Benutzer und Bilder liegen aber nur auf dem Server** (Volume `igh_data`) – deshalb:

1. **Automatisch:** Die Website legt jede Nacht ein Datenbank-Backup im Volume an (`/app/data/backups`, die letzten 14 Tage). Inhaber können unter *Benutzer → Sicherung* jederzeit ein aktuelles Backup **herunterladen** – am besten einmal im Monat und vor größeren Änderungen, und außerhalb des Servers aufbewahren.
2. **Komplettes Volume sichern** (Datenbank + Bilder), z. B. per Cronjob nachts auf einen anderen Speicher:
   ```bash
   docker run --rm -v igh-website_igh_data:/data -v /root/backups:/backup alpine tar czf /backup/igh_data-$(date +%F).tgz -C /data .
   ```
3. **Die Datei `/opt/igh-website/.env`** – an einem sicheren Ort (z. B. Passwortmanager des Vorstands) ablegen und bei jeder Änderung aktualisieren.
2. **Caddy-Zertifikate** (Docker-Volume `igh-website_caddy_data`) – nicht zwingend nötig, Caddy holt sie bei Verlust neu. Bei häufigen Neuinstallationen aber sinnvoll, weil Let's Encrypt die Anzahl neuer Zertifikate begrenzt:
   ```bash
   docker run --rm -v igh-website_caddy_data:/data -v "$PWD":/backup alpine tar czf /backup/caddy_data.tgz -C /data .
   ```

Zusätzlich lohnen sich die (günstigen) automatischen Server-Backups/Snapshots beim Hoster.

**Wiederherstellen:** Container stoppen (`dc stop web`), das gesicherte Archiv zurück ins Volume entpacken (`docker run --rm -v igh-website_igh_data:/data -v /root/backups:/backup alpine sh -c "rm -rf /data/* && tar xzf /backup/igh_data-DATUM.tgz -C /data"`) oder eine heruntergeladene `igh-backup-….sqlite` als `/data/igh.sqlite` hineinkopieren, dann `dc start web`. Dafür muss dieselbe `APP_SECRET` gesetzt sein.

**Server komplett neu aufsetzen:** Abschnitte 3–7 wiederholen, `.env` zurückkopieren, Volume-Backup zurückspielen, DNS auf die neue IP umstellen, `VPS_HOST` in GitHub anpassen.

---

## 10. Zurückrollen (Rollback)

Wenn nach einem Update etwas kaputt ist:

```bash
cd /opt/igh-website
git log --oneline -10                     # die letzten Versionen anzeigen
git reset --hard <COMMIT-ID>              # z. B. git reset --hard 3f2a1bc (die letzte funktionierende Version)
docker compose -f deploy/docker-compose.yml up -d --build
```

Achtung: Der **nächste Commit auf `main` rollt wieder den neuesten Stand aus**. Den Fehler deshalb auch im Repository beheben – am einfachsten auf GitHub den fehlerhaften Commit rückgängig machen (`git revert <COMMIT-ID>` und pushen) oder im CMS die Änderung zurücknehmen.

---

## 11. Logs und Fehlersuche

```bash
cd /opt/igh-website
docker compose -f deploy/docker-compose.yml ps              # Läuft alles?
docker compose -f deploy/docker-compose.yml logs -f web     # Website (Stripe-, Kontaktformular-Fehler)
docker compose -f deploy/docker-compose.yml logs -f caddy   # Zertifikate, Weiterleitungen
docker compose -f deploy/docker-compose.yml restart web     # Website neu starten
df -h && docker system df                                   # Speicherplatz
```

(`Strg+C` beendet die Log-Anzeige.)

| Problem | Ursache / Lösung |
|---|---|
| Browser meldet Zertifikatsfehler | DNS zeigt noch nicht auf den Server oder Port 80/443 ist blockiert. `dig +short www.igh-hannover.de` und `ufw status` prüfen, dann `logs caddy`. |
| „502 Bad Gateway“ | Der `web`-Container läuft nicht. `logs web` ansehen, `up -d --build` ausführen. |
| Build bricht mit „Killed“ ab | Zu wenig Arbeitsspeicher → [Swap](#swap-bei-wenig-arbeitsspeicher) einrichten. |
| Spenden-Button liefert Fehler | `STRIPE_SECRET_KEY` falsch/leer oder Zahlungsmethode in Stripe nicht aktiv → `logs web`. |
| Kontaktformular verschickt nichts | SMTP-Daten prüfen (Abschnitt 12) → `logs web`. |
| Festplatte voll | `docker system prune -f` (löscht nur Ungenutztes). |

**Regelmäßige Pflege (etwa monatlich):** Basis-Images aktualisieren, damit Sicherheitsupdates von Node.js und Caddy ankommen:

```bash
cd /opt/igh-website
docker compose -f deploy/docker-compose.yml pull caddy
docker compose -f deploy/docker-compose.yml build --pull web
docker compose -f deploy/docker-compose.yml up -d
```

Caddy-Konfiguration geändert? Ohne Ausfallzeit neu laden:

```bash
docker compose -f deploy/docker-compose.yml exec caddy caddy reload --config /etc/caddy/Caddyfile
```

---

## 12. E-Mail-Zustellung (Kontaktformular)

Das Kontaktformular verschickt Nachrichten über das SMTP-Postfach aus der `.env`. Damit sie nicht im Spam landen:

1. **Ein echtes Postfach der Vereinsdomain** verwenden (z. B. `website@igh-hannover.de` beim bisherigen Mail-Anbieter) – keine Gmail-/GMX-Adresse als Absender.
2. `CONTACT_FROM` muss genau die Adresse sein, mit der man sich am SMTP-Server anmeldet (oder ein dort erlaubter Alias).
3. Beim Domain-/Mail-Anbieter prüfen, ob **SPF**, **DKIM** und **DMARC** für `igh-hannover.de` eingerichtet sind (die meisten Anbieter haben dafür einen Assistenten). Test: eine Nachricht über das Formular an eine Gmail-Adresse schicken und dort „Original anzeigen“ → SPF/DKIM müssen „PASS“ zeigen.
4. **Port 587** (STARTTLS) verwenden. Hetzner sperrt bei neuen Konten ausgehende Verbindungen auf den Ports 25 und 465; 587 funktioniert.
5. Die Website schickt keine Mails direkt vom Server, deshalb ist auf dem VPS kein eigener Mailserver nötig.

Nach einer Änderung der SMTP-Daten: `docker compose -f deploy/docker-compose.yml up -d --build`, dann das Formular testen und `logs web` beobachten.
