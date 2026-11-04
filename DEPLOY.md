# Pubblicazione

L'app gira in un solo container (backend che serve anche l'interfaccia), con PostgreSQL, Caddy per
HTTPS e un backup notturno, tutti descritti in `deploy/docker-compose.yml`.

## Cosa serve

- Una VPS Linux nell'Unione europea (es. Hetzner, OVH, Aruba): 2 vCPU, 4 GB di RAM e 40 GB di
  disco bastano per iniziare. Docker Engine con il plugin Compose.
- Un dominio o sottodominio (es. `workbook.tuodominio.it`) con un record `A`/`AAAA` verso il server.
- Porte 80 e 443 aperte (Caddy ottiene e rinnova da solo il certificato HTTPS).
- Un servizio SMTP per le email di conferma e di recupero della password.
- Facoltativo: credenziali OAuth di Google; un endpoint AI compatibile con OpenAI.

## Primo avvio

```bash
git clone <repository> workbook && cd workbook/deploy
cp .env.example .env
# Compila .env: dominio, APP_SECRET_KEY e POSTGRES_PASSWORD (valori casuali lunghi), SMTP.
python3 -c "import secrets; print(secrets.token_urlsafe(48))"   # per i due segreti
docker compose up -d --build
docker compose logs -f app        # migrazioni applicate, poi "Application startup complete"
```

L'app rifiuta di partire se la configurazione di produzione è incompleta (segreto debole,
indirizzo non `https://`, database SQLite, email non SMTP) e dice cosa manca.

**Primo amministratore**: registrati dal sito e conferma l'email. Il primo account confermato
diventa amministratore. In alternativa:

```bash
docker compose exec app python -m app.cli create-user --email tu@esempio.it --password '…' --verified --admin
```

Gli utenti creati da riga di comando accettano i termini al primo accesso.

**Google**: nella Google Cloud Console crea un client OAuth "Applicazione web" con URI di
reindirizzamento `https://<dominio>/api/auth/google/callback` e inserisci ID e segreto in `.env`.

**Assistente AI**: da "Amministrazione" → "Assistente AI" nell'app.

## Server con Nginx Proxy Manager

Se il server ha già Nginx Proxy Manager sulle porte 80 e 443, Caddy non serve: si usa
`deploy/docker-compose.npm.yml`, che collega l'app alla rete Docker del proxy senza pubblicare
porte.

1. **DNS**: record `A` del sottodominio (es. `aiworkbook.perlconsulting.it`) verso l'IP del server.
2. **Nginx Proxy Manager** → *Proxy Hosts* → *Add Proxy Host*: dominio, schema `http`, host
   `aiworkbook-app`, porta `8000`, *Block Common Exploits*; nella scheda *Advanced*:
   ```nginx
   client_max_body_size 2m;
   proxy_buffering off;
   proxy_read_timeout 300s;
   access_log off;
   ```
   Nella scheda *SSL*: nuovo certificato Let's Encrypt, *Force SSL*, *HTTP/2* (HSTS lo aggiunge
   l'app).
3. **App**: `git clone https://github.com/rmpugliese/aiworkbook.git /srv/apps/aiworkbook`, poi
   in `/srv/apps/aiworkbook/deploy/`: `cp .env.example .env` e compilarlo (`APP_DOMAIN` non serve; se la rete
   del proxy non si chiama `docker_default`, aggiungere `NPM_NETWORK=<nome>`), poi:
   ```bash
   docker compose -f docker-compose.npm.yml up -d --build
   docker compose -f docker-compose.npm.yml logs -f app
   ```
   Per gli altri comandi di questa guida aggiungere `-f docker-compose.npm.yml`.

## Server senza Docker (uv + systemd)

Come gli altri servizi già presenti sul VPS: l'app gira con uv come servizio systemd sulla porta
8000, Nginx Proxy Manager inoltra a `167.86.115.64:8000`, e iptables chiude la porta da Internet.
File in `deploy/native/`. Comandi da eseguire come `root` su Ubuntu 22.04.

**1. Pacchetti di sistema, utente e codice**

```bash
apt update && apt install -y git postgresql libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz-subset0 fonts-liberation fonts-dejavu-core
useradd --system --create-home --home-dir /var/lib/aiworkbook --shell /bin/bash aiworkbook
git clone https://github.com/rmpugliese/aiworkbook.git /srv/apps/aiworkbook
chown -R aiworkbook:aiworkbook /srv/apps/aiworkbook
curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR=/usr/local/bin sh
```

**2. Database**

```bash
sudo -u postgres createuser workbook --pwprompt      # scegli una password lunga
sudo -u postgres createdb workbook --owner workbook
```

**3. Configurazione**

```bash
cp /srv/apps/aiworkbook/deploy/native/env.example /srv/apps/aiworkbook/deploy/.env
chown aiworkbook:aiworkbook /srv/apps/aiworkbook/deploy/.env && chmod 600 /srv/apps/aiworkbook/deploy/.env
nano /srv/apps/aiworkbook/deploy/.env    # segreto, password del database in APP_DATABASE_URL, SMTP
```

**4. Dipendenze e interfaccia** (Node 22 in un ambiente conda, solo per la build)

```bash
conda create -y -n aiworkbook-node -c conda-forge nodejs=22
cd /srv/apps/aiworkbook/backend && sudo -u aiworkbook -H uv sync --frozen --no-dev
cd /srv/apps/aiworkbook/frontend && conda run -n aiworkbook-node npm ci --no-audit --no-fund && conda run -n aiworkbook-node npm run build
chown -R aiworkbook:aiworkbook /srv/apps/aiworkbook
```

**5. Servizio**

```bash
cp /srv/apps/aiworkbook/deploy/native/aiworkbook.service /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now aiworkbook
journalctl -u aiworkbook -f     # migrazioni, poi "Application startup complete"
```

**6. Porta 8000 chiusa da Internet** (stessa regola dei servizi esistenti): fermare la regola,
aggiungere `8000` all'elenco delle porte in `/etc/systemd/system/block-internal-ports.service`
(sia in `ExecStart` sia in `ExecStop`), poi riattivarla:

```bash
systemctl stop block-internal-ports
sed -i 's/--dports 5000,5050 /--dports 5000,5050,8000 /' /etc/systemd/system/block-internal-ports.service
systemctl daemon-reload && systemctl start block-internal-ports
iptables -S INPUT | grep dports
```

**7. Backup e pulizia**

```bash
install -d -o postgres -g postgres -m 700 /var/backups/aiworkbook
crontab -e
```

e aggiungere le due righe:

```cron
30 2 * * * sudo -u postgres /srv/apps/aiworkbook/deploy/native/backup.sh
45 2 * * * sudo -u aiworkbook -H /srv/apps/aiworkbook/deploy/native/aiworkbook.sh cleanup
```

I backup vanno in `/var/backups/aiworkbook` (14 giorni). Ripristino:
`sudo -u postgres pg_restore --clean --if-exists -d workbook <file>.dump`.

**Aggiornamenti** (come root: scarica, aggiorna le dipendenze, ricompila l'interfaccia e riavvia)

```bash
/srv/apps/aiworkbook/deploy/native/aiworkbook.sh update
```

## Prima dell'apertura al pubblico

- [ ] Far rivedere da un legale `/privacy` e `/terms` (in `frontend/src/pages/legal/`), compilare
      i campi tra parentesi quadre e togliere l'avviso "Bozza" in `LegalPage.tsx`.
- [ ] Se i testi cambiano in modo sostanziale, aggiornare `TERMS_VERSION` in `backend/app/legal.py`
      (e la data in `LegalPage.tsx`): tutti dovranno accettare di nuovo.
- [ ] Verificare l'invio delle email e l'accesso con Google sul dominio vero.
- [ ] Provare un ripristino dal backup (vedi sotto).

## Backup e ripristino

Il servizio `backup` scrive ogni notte `deploy/backups/workbook-<data>.dump` e tiene gli ultimi
`BACKUP_KEEP_DAYS` giorni (14 di default). Copia regolarmente la cartella fuori dal server (es.
`rsync` o lo storage del provider).

Ripristino su un database vuoto:

```bash
docker compose stop app
docker compose exec -T db pg_restore --clean --if-exists -U workbook -d workbook < backups/workbook-<data>.dump
docker compose start app
```

## Aggiornamenti

```bash
git pull
docker compose up -d --build      # le migrazioni partono all'avvio del container
```

## Log e monitoraggio

- `docker compose logs app`: una riga JSON per richiesta (id, metodo, percorso, stato, durata,
  id utente), mai contenuti, password o token. Gli errori riportano l'id della richiesta che
  l'utente vede nel messaggio.
- `https://<dominio>/api/health` per un servizio di uptime esterno (es. UptimeRobot): `status`
  `ok`, oppure `degraded` se il database non risponde.
- Il container `cleanup` elimina ogni giorno sessioni scadute, link email usati e il registro AI
  oltre i 12 mesi.

## Note

- Un solo processo applicativo: i limiti di richieste sono in memoria e funzionano così. Per più
  istanze servirebbe un archivio condiviso (es. Redis).
- La porta dell'app non è pubblicata: solo Caddy la raggiunge, per questo l'app si fida delle sue
  intestazioni `X-Forwarded-*` per l'indirizzo IP dei visitatori.
