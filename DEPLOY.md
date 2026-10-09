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
