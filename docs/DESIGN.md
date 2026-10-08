# Sistema grafico — Samar

Come si costruisce una schermata. Il **perché** delle scelte sta in
`DECISIONS.md`; qui c'è solo il **come**.

> **Regola zero** — prima di scrivere una classe CSS, cerca in `src/ui/` e in
> `src/lib/surfaces.ts`. Il sistema è già scritto: una pagina lo _compone_, non
> lo reinventa. Se una cosa serve e non c'è, aggiungila lì, non nella pagina.

---

## 1. Fondamenta

| Ruolo            | Valore                        | Dove          |
| ---------------- | ----------------------------- | ------------- |
| Canvas           | `#000000`                     | `body`        |
| Card contenuto   | `#111111`                     | `CARD`        |
| Card navigazione | `#121212` + ombra lunga       | `CARD_NAV`    |
| Card metrica     | gradiente `#161616 → #101010` | `CARD_METRIC` |
| Bordo            | `border-white/[0.06]`         | ovunque       |

Le superfici si distinguono con un **bordo a capello**, mai con un'ombra.
L'unica ombra del sistema è quella delle card di navigazione, e serve a farle
galleggiare sul nero, non a separarle dal contenuto.

Non esiste un quinto fondo di card. Se una sezione deve staccarsi, usa spazio o
un `Divider`, non un grigio nuovo.

## 2. La scala di opacità È la gerarchia

Niente esadecimali grigi. Il testo è bianco a un'opacità fissa:

```
white        titolo di pagina, cifra di una metrica
white/85     corpo importante
white/70     corpo
white/55     etichetta di riga, testo secondario
white/45     icona a riposo, azione quieta
white/40     sottotitolo di card
white/35     stato vuoto, intestazione di tabella
white/30     micro-label
```

Sette gradini. Non aggiungerne un ottavo: se serve, vuol dire che due cose sulla
pagina stanno competendo e una va tolta.

## 3. Tipografia

Font: **Inter Variable** (`@fontsource-variable/inter`), importato in
`src/main.tsx`, dichiarato in `--font-sans`.

```
9.5px   MICRO_LABEL, intestazione tabella    600, tracking .07em, UPPERCASE
10px    delta in pillola
10.5px  sottotitolo di card
11px    pillole, link inline, bottoni        500 / 600
12px    campi, righe secondarie
13px    corpo, titolo di card                600 per i titoli
14px    titolo di sezione
20px    .kpi-number
24px    titolo di pagina (text-2xl)          700
28px    cifra di testa di una MetricCard — e basta
```

Corpo a 13px, `line-height 1.45`, `letter-spacing -0.01em`.
Gli input stanno a **16px sotto 768px** (iOS zooma sotto i 16) e tornano a 13px
da `md` in su: già gestito in `tokens.css`, non riscriverlo.

Ogni cifra che sta in colonna porta `tabular-nums` — la classe `.tabular` o
l'attributo `data-numeric`.

## 4. Raggi — due, non cinque

```
rounded-full   tutto ciò che è interattivo in superficie:
               bottoni, campi, chip, segmented, avatar, icon button
rounded-xl     i contenitori: card, pannelli, sheet, box icona
```

`rounded-[20px]` compare nelle card perché è il valore del riferimento: resta
incapsulato in `CARD` / `CARD_METRIC`. Non scriverlo a mano altrove.

## 5. Colore = informazione, mai decorazione

```
#1F523A   brand. Stato selezionato e UNA azione primaria per pagina.
#D1D9B0   link inline e valori "brand" dentro una card.
emerald   solo un delta positivo o uno stato realmente buono.
amber     solo un avviso reale.
red       solo un errore o un superamento reale.
```

Un bottone pieno brand esiste (`PILL_BRAND`) ed è l'unico bottone pieno del
sistema. Se in una schermata ce ne sono due, una delle due azioni non è primaria.

Per i grafici si usa **solo** `src/ui/chartPalette.ts`: sei tinte categoriche
validate col checker della skill `dataviz`. I colori che l'utente sceglie per i
bucket non passano i controlli e non entrano in un grafico.

## 6. Spazio

- Il padding di pagina lo mette il `Layout`, non la schermata.
- Fra blocchi di una pagina: `space-y-3`.
- Dentro una card: `p-4`, header a `mb-3`.
- Griglie: `grid-cols-2` sul telefono, `xl:grid-cols-4` per i KPI,
  `xl:grid-cols-3` per contenuto + colonna laterale.

## 7. Vetro

Il materiale sta in `src/styles/glass.css`, le ricette in `src/lib/glass.ts`.

- Il vetro appartiene **solo al livello di navigazione**: barre, sheet, popover,
  controlli flottanti. Mai su contenuto, liste o importi — il blur uccide la
  leggibilità delle cifre tabulari.
- Il vetro non può campionare altro vetro: per annidare usa `.glass-group` sul
  contenitore e `.glass-item` sui figli.
- Il raggio non si imposta mai nel CSS del vetro: è una utility.
- Il degrado è già scritto per `@supports not (backdrop-filter)`,
  `prefers-reduced-transparency` e `prefers-contrast: more`. Non toccarlo.

## 8. Inventario — cosa esiste già

**Superfici** (`src/lib/surfaces.ts`): `CARD` `CARD_NAV` `CARD_METRIC`
`PILL_QUIET` `PILL_BRAND` `PILL_DANGER` `LINK_SOFT` `MICRO_LABEL` `ROW`
`ROW_DIVIDE` `EMPTY_LINE` `ICON_ACTION` `ICON_ACTION_DANGER` `FIELD` `TH` `TD`
`TR`

**Vetro** (`src/lib/glass.ts`): `glassButtonClass` `glassPrimaryButtonClass`
`glassDestructiveButtonClass` `glassFieldClass` `glassSurfaceClass`
`glassDropdownClass` `glassOverlayClass` `glassRowActionClass`

**Componenti** (`src/ui/`, tutti riesportati da `@/ui`):

| Componente                             | Quando                                                     |
| -------------------------------------- | ---------------------------------------------------------- |
| `Button`                               | `variant: brand / quiet / ghost / danger`, `size: sm / md` |
| `IconButton`                           | azione di riga o di barra, solo icona + `label`            |
| `Card` / `CardHeader`                  | la superficie di default                                   |
| `StatCard`                             | una cifra sola, con `progress` e `tone` opzionali          |
| `MetricCard`                           | cifra di testa + delta + sparkline + sotto-metriche        |
| `Field` `MoneyInput` `Select` `Toggle` | i form                                                     |
| `Chip`                                 | `neutral / brand / good / warn / bad`                      |
| `TabPills`                             | l'unica fila di tab di alto livello                        |
| `PageHeader`                           | ogni pagina si apre così                                   |
| `Divider` `EmptyState` `Sheet` `Toast` | il resto                                                   |
| `Money`                                | ogni importo, sempre — mai `toFixed` a mano                |
| `ChartFrame`                           | ogni grafico: titolo, sintesi, didascalia, tabella dati    |
| `CycleRing`                            | l'anello del ciclo                                         |

Se stai per scrivere la sesta variante di un bottone: non farlo.

## 9. Ricette

**Una pagina**

```tsx
<div className="space-y-3">
  <PageHeader title="Titolo" subtitle="Una riga su cosa fa" actions={<Button>…</Button>} />
  <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{/* StatCard */}</div>
  <Card>
    <CardHeader title="Sezione" action={<Link className={LINK_SOFT}>Vedi tutto</Link>} />
    {/* contenuto */}
  </Card>
</div>
```

**Una lista**

```tsx
<div className={ROW_DIVIDE}>
  {items.map((it) => (
    <button key={it.id} className={ROW}>
      <span className="min-w-0 flex-1 truncate text-[12px] text-white/70">{it.name}</span>
      <Money cents={it.amount} className="text-[12px]" />
    </button>
  ))}
</div>;
{
  items.length === 0 && <p className={EMPTY_LINE}>Niente qui.</p>;
}
```

**Un grafico**: sempre dentro `ChartFrame`, sempre con legenda **e** tabella
dati — la coppia smeraldo↔rosa è a ΔE 7.6 in deuteranopia, legale solo con un
encoding secondario.

## 10. Do / Don't

- Comporre da `surfaces.ts` — non inventare un fondo nuovo in una pagina
- Sette opacità — non `text-gray-400`
- Due raggi — non `rounded-lg` su un contenitore
- Un bottone pieno per pagina — non il colore brand su ogni CTA
- Vetro sulla navigazione — non su una card di contenuto
- `tabular-nums` sulle cifre — non colonne che ballano
- `Money` per gli importi — non formattazione a mano
- Colore quando significa qualcosa — non colore perché è bello
- Padding dal `Layout` — non `p-4 sm:p-8` ripetuto in ogni schermata
- `aria-label` su ogni bottone solo-icona — non icone mute

## 11. Portare il sistema in un progetto nuovo

Copia quattro file e installa i pacchetti:

```
src/styles/tokens.css      token, scala tipografica, chip di stato, scrollbar
src/styles/glass.css       il materiale iOS 27
src/lib/surfaces.ts        il vocabolario delle superfici
src/lib/glass.ts           le ricette di classe del vetro
```

```bash
npm i tailwindcss @tailwindcss/vite @fontsource-variable/inter \
      @ios27_design_system/tokens lucide-react
```

`src/index.css` li incatena in questo ordine — l'ordine conta, i materiali
devono arrivare prima delle ricette che li consumano:

```css
@import './styles/tokens.css';
@import '@ios27_design_system/tokens/css/materials';
@import './styles/glass.css';
```

Poi porta `src/ui/` per intero: è il sistema reso componenti, e senza quello
restano dei token e nessuna disciplina.
