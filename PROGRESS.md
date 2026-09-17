# PROGRESS — Ciclo

Tracking allineato alla numerazione del MEGA PROMPT. Legenda: ✅ fatto · 🏗️ parziale · ⬜ da fare.

> Nota di riallineamento (2026-09-17): le sessioni precedenti avevano adottato una
> numerazione propria da T3.3 in poi, che non corrispondeva alla specifica. Le righe
> qui sotto ripartono dalla specifica e registrano lo stato reale del codice.

## FASE 0 — Fondamenta
- ✅ T0.1 (2026-09-15) Inizializza il progetto (Vite + React + TS strict).
- ✅ T0.2 (2026-09-15) Tailwind e token di design.
- ✅ T0.3 (2026-09-15) ESLint, Prettier, husky, lint-staged.
- ✅ T0.4 (2026-09-15) Vitest + testing-library.
- ✅ T0.5 (2026-09-15) Documenti di progetto.
- ✅ T0.6 (2026-09-15) Router e guscio di navigazione.

## FASE 1 — Strato dati
- ✅ T1.1 (2026-09-15) Tipi del dominio.
- ✅ T1.2 (2026-09-15) Schemi zod.
- ✅ T1.3 (2026-09-15) Interfaccia DataAdapter.
- ✅ T1.4 (2026-09-15) Implementazione IndexedDB.
- ✅ T1.5 (2026-09-15) Outbox per la sincronizzazione futura.
- ✅ T1.6 (2026-09-15) Store Zustand e persistenza ottimistica.
- ✅ T1.7 (2026-09-15) Dati di esempio.

## FASE 2 — Sistema visivo e guscio
- ✅ T2.1 (2026-09-15) Primitivi UI.
- ✅ T2.2 (2026-09-15) Componenti del denaro.
- ✅ T2.3 (2026-09-15) Anello del ciclo.
- ✅ T2.4 (2026-09-15) Tema chiaro/scuro.
- ✅ T2.5 (2026-09-15) Layout responsive e stati globali.
- ✅ T2.6 (2026-09-17) Liquid Glass: materiale, tab bar, sheet, toast, bottoni. *(fuori specifica, richiesto dall'utente)*

## FASE 3 — Denaro: anagrafiche
- ✅ T3.1 (2026-09-15) Fonti di entrata: CRUD.
- ✅ T3.2 (2026-09-15) Bucket: CRUD con regole di allocazione.
- ✅ T3.3 (2026-09-17) Spese ricorrenti: CRUD, con bucket di uscita e flag "crea un task".
- ✅ T3.4 (2026-09-17) Impostazioni finanziarie: modalità ciclo, ancoraggio, valuta, riporto, con anteprima del ciclo corrente.
- ⬜ T3.5 `domain/money.ts` + property test.

## FASE 4 — Denaro: motore e cicli
- ⬜ T4.1 Motore di allocazione (`domain/allocation.ts`).
- 🏗️ T4.2 Motore dei cicli — esiste `features/cycles/engine.ts`, va spostato in `domain/cycles.ts` e testato.
- 🏗️ T4.3 Apertura e chiusura di un ciclo — flusso parziale, senza riepilogo né riporto.
- ⬜ T4.4 Registrazione delle entrate.
- 🏗️ T4.5 Movimenti — esiste solo la spesa rapida in Oggi.
- ⬜ T4.6 Correzione manuale di un'allocazione.

## FASE 5 — Denaro: la vista
- 🏗️ T5.1 Schermata Soldi.
- ⬜ T5.2 Dettaglio bucket.
- ⬜ T5.3 Storico e grafici.
- ⬜ T5.4 Previsione del ciclo.

## FASE 6 — Progetti e task
- ✅ T6.1 (2026-09-15) Progetti: CRUD.
- 🏗️ T6.2 Task semplici: CRUD — manca l'editor completo.
- ⬜ T6.3 Lista task con filtri e raggruppamento.
- ⬜ T6.4 Completamento con annulla.
- ⬜ T6.5 Sottotask.
- ⬜ T6.6 Dettaglio task.

## FASE 7 — Ricorrenze, abitudini, streak
- ⬜ T7.1 Motore delle ricorrenze.
- ⬜ T7.2 Editor della ricorrenza.
- ⬜ T7.3 Occorrenze e materializzazione.
- ⬜ T7.4 Streak.
- ⬜ T7.5 Abitudini nella vista Oggi.

## FASE 8 — Timer
- 🏗️ T8.1 Motore del timer — `TimerModal` esiste, non è basato su timestamp.
- ⬜ T8.2 Schermata timer.
- ⬜ T8.3 Sessioni.
- ⬜ T8.4 Statistiche del tempo.

## FASE 9 — Acquisti
- ⬜ T9.1 Acquisti: CRUD.
- ⬜ T9.2 Pianificazione in un ciclo.
- ⬜ T9.3 Impatto sul budget.
- ⬜ T9.4 Acquisto effettuato.
- ⬜ T9.5 Collegamento acquisto ↔ task.

## FASE 10 — Notifiche
- ⬜ T10.1 … T10.6

## FASE 11 — PWA e offline
- 🏗️ T11.1 Manifest e icone — manifest statico, manca `vite-plugin-pwa`.
- ⬜ T11.2 … T11.5

## FASE 12 — Backup
- ⬜ T12.1 … T12.3

## FASE 13 — La vista Oggi
- 🏗️ T13.1 … ⬜ T13.3

## FASE 14 — Qualità
- ⬜ T14.1 … T14.5

## FASE 15 — Preparazione a Supabase
- ⬜ T15.1 … T15.3
