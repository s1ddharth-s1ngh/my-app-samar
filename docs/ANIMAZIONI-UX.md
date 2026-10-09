# Animazioni — il sistema (studiato da `Telebi/builder-test`)

Questo documento descrive **perché** le animazioni del configuratore sembrano
"perfette" e **come** riprodurle qui. Non è teoria: ogni regola è presa dal
codice del collega (`src/lib/motion.ts` e i componenti che lo usano).

## 1. Un solo vocabolario, zero valori a caso

Nel progetto di riferimento esiste un unico file (`src/lib/motion.ts`) che
dichiara easing, durate e stagger. Nessun componente inventa i propri numeri.
Prima di quel file la stessa identica affordance viaggiava a 80 ms, 60 ms e
40 ms in tre pagine diverse: è esattamente quello che fa percepire
un'interfaccia come "fatta a pezzi".

Le curve:

| nome | valore | quando |
| --- | --- | --- |
| `EASE` | `[0.32, 0.72, 0, 1]` | firma del prodotto: pannelli, drawer, movimenti decisi |
| `EASE_OUT_EXPO` | `[0.16, 1, 0.3, 1]` | entrate di liste e menu: parte veloce, si posa piano |
| `SMOOTH_EASE` | `[0.25, 0.1, 0.25, 1]` | dissolvenze di pagina |

Regola generale: **ease-out per ciò che entra**, ease-in-out solo per ciò che
si muove da A a B restando a schermo. Mai `linear` su un'interfaccia.

## 2. Il tocco deve rispondere entro ~100 ms

Il feedback al tocco è la parte che decide se l'app "sembra viva". Nel
riferimento ogni elemento premibile è un `motion.button` con:

```tsx
whileTap={{ scale: 0.95 }}
transition={{ type: 'spring', stiffness: 400, damping: 15 }}
```

Punti chiave:

- è una **molla**, non una durata: il ritorno non ha un tempo fisso, reagisce
  alla velocità del gesto;
- la scala scende a `0.95`/`0.96` — visibile, non caricaturale;
- vale per **tutto** ciò che si preme: pulsanti, pill, voci di menu, icone,
  tab. Un solo elemento senza feedback rompe l'illusione;
- solo `transform` e `opacity`: il compositor li gestisce senza ridisegnare,
  quindi reggono 60 fps anche su telefoni lenti. Animare `width`, `height`,
  `top` o `box-shadow` è il modo più rapido per ottenere scatti.

## 3. Cambi di stato sfumati, non a scatto

Ogni cambio attivo/inattivo passa da una transizione di colore e opacità:

```
transition-[color,background-color,border-color,opacity] duration-300
```

Il collega ha incluso `opacity` apposta (commento in `PillButton.tsx`): il
passaggio `disabled → attivo` sfumava solo in alcuni punti, e lo scatto si
notava. Elencare le proprietà invece di usare `transition-all` evita di
animare per sbaglio layout e ombre.

## 4. Le liste entrano a cascata, con un tetto

I menu lunghi usano uno stagger dichiarato:

```ts
base: 0.18s        // attesa prima che il menu cominci
stagger: 0.06s     // ritardo per ogni voce successiva
staggerMaxIndex: 7 // oltre l'ottava voce la cascata non cresce più
duration: 0.6s     // con EASE_OUT_EXPO
from: { opacity: 0, y: 15 }
```

Il tetto è la parte importante: senza, un menu da 30 voci fa aspettare quasi
due secondi l'ultima riga. Per le sotto-voci lo stagger scende a `0.03s` e la
durata a `0.4s`, perché sono già in vista.

## 5. L'uscita conta quanto l'entrata

Un pannello che entra animato e sparisce di colpo è peggio di uno statico.
Tutto ciò che si monta e smonta sta dentro `AnimatePresence`, con `exit`
dichiarato: drawer che scivolano via (`x: '-100%'`, 0.35s, `EASE`), icone che
ruotano in uscita (search ↔ X, rotate ±90°, 0.15s), suggerimenti che sfumano.

Con il solo CSS questo richiede di tenere in stato il "sta chiudendo" e
rimuovere il nodo a transizione finita — motivo per cui qui usiamo
`framer-motion`, la stessa libreria del riferimento.

## 6. Niente sfondo scorrevole sulla selezione

Regola globale esplicita nel progetto del collega (`SelectPill.tsx`,
`AspettoDrawer.tsx`): **mai** `layoutId` per far scivolare l'evidenziazione tra
le opzioni. L'evidenziazione è statica, ad animarsi sono colore e opacità. Un
indicatore che scorre attira l'occhio sul contenitore invece che sul contenuto
e si disallinea appena la riga scrolla.

## 7. Direzione e durate

- micro-feedback (tap, hover, focus): molla, oppure 120–200 ms;
- cambio di stato (attivo/inattivo, colore): 300 ms;
- entrata di un elemento (voce di lista, hint): 400–600 ms con `EASE_OUT_EXPO`;
- pannelli e drawer: 350–400 ms con `EASE`;
- dissolvenza di pagina: 200–300 ms con `SMOOTH_EASE`.

Più grande è l'elemento, più lungo il movimento. Un pulsante che impiega
400 ms sembra rotto; un pannello che ne impiega 150 sembra uno scatto.

## 8. Accessibilità

`prefers-reduced-motion: reduce` deve ridurre le durate e azzerare gli
spostamenti, non spegnere il feedback: opacità e colore restano, i movimenti
spariscono.

## Come è applicato in questa app

- `src/lib/motion.ts` — il vocabolario condiviso (porta diretta del file del
  collega: easing, stagger dei menu, transizioni dei pannelli).
- `src/ui/Button.tsx`, `src/ui/IconButton.tsx` — `whileTap` a molla.
- `src/ui/TabPills.tsx` — selezione sfumata (senza indicatore scorrevole).
- `src/ui/Sheet.tsx` — entrata **e uscita** del foglio con `AnimatePresence`
  (prima usava classi `animate-in` di un plugin Tailwind mai installato:
  erano CSS morto, il foglio compariva di colpo).
- `src/app/Layout.tsx` — dissolvenza di pagina a ogni cambio di rotta.
- `src/app/MobileShell.tsx` — launcher con entrata/uscita, voci a cascata,
  icona che ruota, feedback al tocco sulla barra inferiore.
