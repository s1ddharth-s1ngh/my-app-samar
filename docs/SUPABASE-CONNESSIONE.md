# Collegamento Supabase di Samar

Il progetto configurato in `.env` è `iyblqhxehinylvhdpmxc`. L'app conserva IndexedDB come copia locale e sincronizza i record con lo schema `samar` dopo l'accesso tramite link email. I record nel cloud sono separati per utente mediante Row Level Security.

## Attivazione sul progetto

1. Ripristinare la raggiungibilità dell'API del progetto. Durante l'integrazione la richiesta a `https://iyblqhxehinylvhdpmxc.supabase.co/rest/v1/` ha restituito HTTP 521; l'app non può sincronizzare finché il progetto non risponde.
2. Applicare [supabase-records.sql](./supabase-records.sql) nel SQL Editor del progetto. Lo script crea solo `samar.records`, con accesso limitato all'utente autenticato.
3. Aggiungere `samar` agli **Exposed schemas** nelle impostazioni Data API. Il client usa `db: { schema: 'samar' }`.
4. In **Authentication → Providers → Email**, mantenere attivo l'accesso via email. Configurare il Site URL e gli URL di redirect per l'origine in cui gira Samar: il link email deve poter tornare all'app.
5. In Samar aprire **Impostazioni → Supabase**, inserire l'email, aprire il link ricevuto e controllare che compaia **Dati sincronizzati**. Ripetere l'accesso con la stessa email su un altro dispositivo.

La chiave nel browser deve essere **publishable**. Non inserire una `service_role` o una secret key in variabili `VITE_`.

## Come funziona

- Ogni modifica viene scritta subito in IndexedDB e accodata nell'outbox locale.
- Dopo l'accesso, la sincronizzazione carica le modifiche pendenti e poi scarica i record dell'account. Riparte quando torna la rete o l'app torna in primo piano.
- Al primo accesso, i dati già presenti nel browser vengono caricati nell'account. Se il cloud ha già impostazioni, quelle dell'account sostituiscono le impostazioni provvisorie create dal nuovo dispositivo.
- **Carica dati di esempio** e **Elimina tutti i dati** cancellano prima i record cloud dell'account alla prossima sincronizzazione, poi caricano il nuovo stato locale.
- Un browser già associato a un account non carica i dati locali su un altro account. Questo evita di mescolare dati di persone diverse.

## Verifica

Una build e il test locale di sincronizzazione controllano il percorso applicativo. La verifica completa richiede il progetto raggiungibile, lo schema esposto e una sessione email reale. Il test finale consiste nel creare un blocco su un dispositivo, sincronizzare, aprire la stessa email su un secondo dispositivo e verificare che il blocco appaia.

Documentazione Supabase: [schema personalizzato](https://supabase.com/docs/guides/api/using-custom-schemas), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [accesso via email](https://supabase.com/docs/guides/auth/auth-email-passwordless).
