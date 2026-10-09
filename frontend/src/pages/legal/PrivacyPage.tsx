import { List, Text } from '@mantine/core'

import { APP_NAME } from '../../config'
import { LegalPage, Section } from './LegalPage'

export function PrivacyPage() {
  return (
    <LegalPage title="Informativa sulla privacy">
      <Text>
        Questa informativa spiega quali dati personali tratta {APP_NAME} (di seguito "l'app"),
        perché, per quanto tempo e quali diritti hai, ai sensi del Regolamento (UE) 2016/679 (GDPR).
      </Text>

      <Section title="1. Titolare del trattamento">
        <Text>
          [NOME O RAGIONE SOCIALE DEL TITOLARE], [INDIRIZZO], P. IVA [NUMERO], email di contatto per
          la privacy: [EMAIL PRIVACY].
        </Text>
      </Section>

      <Section title="2. Quali dati trattiamo">
        <List spacing="xs">
          <List.Item>
            <b>Dati dell'account</b>: email, nome visualizzato, password (conservata solo come
            impronta crittografica, mai in chiaro), data di registrazione e di conferma, eventuale
            collegamento con un account Google (identificativo e email forniti da Google).
          </List.Item>
          <List.Item>
            <b>Contenuti che inserisci</b>: progetti, nomi dei clienti, descrizioni, user story,
            risposte del workbook, valutazioni Go/No-Go.
          </List.Item>
          <List.Item>
            <b>Marchio</b>: logo e colore principale che scegli di caricare.
          </List.Item>
          <List.Item>
            <b>Dati tecnici</b>: sessioni di accesso (data e ultimo utilizzo), registro delle
            richieste (data, indirizzo richiesto, esito, durata, identificativo dell'utente) e, per
            l'assistente AI, solo metadati delle richieste (azione, modello, numero di caratteri,
            esito), mai i testi inviati o ricevuti. Gli indirizzi IP sono usati in memoria per
            limitare gli abusi e non vengono conservati.
          </List.Item>
          <List.Item>
            <b>Link condivisi</b>: etichetta, scadenza, numero e data degli accessi. Il link stesso
            è conservato solo come impronta crittografica.
          </List.Item>
        </List>
      </Section>

      <Section title="3. Perché li trattiamo e su quale base">
        <List spacing="xs">
          <List.Item>
            Fornirti il servizio (account, progetti, documenti, condivisione): esecuzione del
            contratto, cioè dei termini d'uso che accetti alla registrazione (art. 6.1.b GDPR).
          </List.Item>
          <List.Item>
            Inviarti le email necessarie (conferma dell'indirizzo, recupero della password):
            esecuzione del contratto.
          </List.Item>
          <List.Item>
            Sicurezza del servizio e prevenzione degli abusi (registri tecnici, limiti di utilizzo):
            legittimo interesse (art. 6.1.f GDPR).
          </List.Item>
          <List.Item>
            Usare l'assistente AI su un progetto: solo dopo che lo hai attivato per quel progetto.
          </List.Item>
        </List>
        <Text>Non usiamo i tuoi dati per pubblicità, profilazione o per addestrare modelli.</Text>
      </Section>

      <Section title="4. Dati dei tuoi clienti">
        <Text>
          Se nei progetti inserisci informazioni sui tuoi clienti, sei tu il titolare di quei dati e
          devi avere una base giuridica per trattarli; per quei contenuti il titolare dell'app
          agisce come responsabile del trattamento (art. 28 GDPR), secondo i termini d'uso. Evita di
          inserire categorie particolari di dati (salute, opinioni, ecc.) se non strettamente
          necessario.
        </Text>
      </Section>

      <Section title="5. Assistente AI">
        <Text>
          L'assistente è facoltativo e spento su ogni progetto finché non lo attivi. Quando lo usi,
          la domanda, le altre risposte dell'iterazione e i dati del progetto vengono inviati al
          servizio di intelligenza artificiale configurato dall'amministratore dell'app, che può
          essere eseguito sui nostri server ("locale") o da un fornitore esterno ("remoto"); l'app
          te lo indica prima dell'attivazione. Fornitore attuale: [NOME DEL FORNITORE AI O "modello
          eseguito sui server del titolare"].
        </Text>
      </Section>

      <Section title="6. Con chi condividiamo i dati">
        <List spacing="xs">
          <List.Item>Fornitore dell'infrastruttura (server e database): [NOME, PAESE].</List.Item>
          <List.Item>Fornitore del servizio email: [NOME, PAESE].</List.Item>
          <List.Item>Google, solo se scegli di accedere con Google.</List.Item>
          <List.Item>Il fornitore AI indicato al punto 5, solo se attivi l'assistente.</List.Item>
          <List.Item>
            Le persone a cui invii un link condiviso, che vedono l'iterazione in sola lettura.
          </List.Item>
        </List>
        <Text>
          I dati sono conservati nell'Unione europea. [SE UN FORNITORE TRASFERISCE DATI FUORI
          DALL'UE, INDICARE LE GARANZIE, ES. CLAUSOLE CONTRATTUALI STANDARD.]
        </Text>
      </Section>

      <Section title="7. Per quanto tempo">
        <List spacing="xs">
          <List.Item>Account e contenuti: finché non elimini l'account.</List.Item>
          <List.Item>Sessioni: 30 giorni dall'ultimo utilizzo.</List.Item>
          <List.Item>
            Link di conferma e di recupero della password: fino all'uso o alla scadenza.
          </List.Item>
          <List.Item>Registro delle richieste all'assistente AI: 12 mesi.</List.Item>
          <List.Item>Copie di sicurezza: [14] giorni.</List.Item>
        </List>
      </Section>

      <Section title="8. I tuoi diritti">
        <Text>
          Puoi accedere ai tuoi dati, correggerli, cancellarli, limitarne il trattamento, opporti e
          riceverli in un formato leggibile da macchina (artt. 15–22 GDPR). Nella pagina "Profilo e
          marchio" puoi scaricare tutti i tuoi dati ed eliminare l'account in autonomia. Per il
          resto scrivi a [EMAIL PRIVACY]. Hai anche diritto di reclamo al Garante per la protezione
          dei dati personali (garanteprivacy.it).
        </Text>
      </Section>

      <Section title="9. Cookie">
        <Text>
          L'app usa solo cookie tecnici necessari al funzionamento: la sessione di accesso, un
          codice di protezione contro le richieste contraffatte (CSRF) e, solo durante l'accesso con
          Google, un cookie temporaneo di 10 minuti. Nessun cookie di profilazione o di terze parti,
          quindi non serve un banner di consenso.
        </Text>
      </Section>

      <Section title="10. Sicurezza e modifiche">
        <Text>
          Le comunicazioni sono cifrate (HTTPS), le password e i link sono conservati solo come
          impronte crittografiche e l'accesso ai progetti è limitato al proprietario. Se questa
          informativa cambia in modo sostanziale, ti chiederemo di prenderne visione al primo
          accesso successivo.
        </Text>
      </Section>
    </LegalPage>
  )
}
