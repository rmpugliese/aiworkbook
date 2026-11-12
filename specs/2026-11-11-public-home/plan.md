# Fase 18: Pagina iniziale pubblica — Piano

## 1. Materiale

1. Screenshot ritagliati e ridotti in WebP (circa 1.200 px di larghezza) in
   `frontend/src/assets/home/`.
2. Video di presentazione ricompresso (H.264, senza audio) e immagine di copertina.

## 2. Rotte

1. `RequireAuth` accetta un figlio oltre alle rotte annidate.
2. Indice `/`: pagina di presentazione per chi non ha fatto l'accesso, progetti per gli altri
   (con il controllo dei termini come oggi).

## 3. Pagina

1. `frontend/src/pages/HomePage.tsx`: sezione iniziale con video, sezioni delle funzioni
   alternate testo/immagine, chiusura con invito e note.
2. Testi in italiano, nessun testo del workbook PMI.

## 4. Test

1. Visitatore senza accesso su `/`: vede titolo, pulsanti verso `/register` e `/login`, video.
2. Utente con accesso su `/`: vede i progetti.
3. Il test "torna alla pagina chiesta dopo l'accesso" resta su una pagina protetta.
