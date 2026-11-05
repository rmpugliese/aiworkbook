# Plan: Fase 12 — Pagine legali, cookie e trasparenza sull'AI

1. Configurazione `APP_LEGAL_NAME`, `_ADDRESS`, `_VAT_ID`, `_EMAIL`, `_PEC`, `_COURT`, `_REVIEWED`
2. Impostazioni AI: `provider_name`, `server_location`, `model_kind`; migrazione
3. `GET /api/legal` pubblico: titolare, versione dei termini, assistente (attivo, modello,
   fornitore, sede, tipo, locale/remoto)
4. Pagine: `/privacy`, `/terms`, `/cookies`, `/ai`; dati dal backend; avviso "Bozza" condizionale
5. Piè di pagina: Privacy · Termini · Cookie · Uso dell'AI; pannello cookie
6. Amministrazione: campi del fornitore AI; avviso se i dati del titolare mancano
7. Consenso AI e proposta dell'assistente: etichetta e rimando all'informativa
8. `TERMS_VERSION` aggiornata
9. Test: endpoint pubblico senza segreti, pagine con e senza dati, pannello cookie, etichetta AI;
   `.env.example` e DEPLOY.md
