/* ============================================================
   Bellagotchi — ein ruhiges Pflegespiel.

   Bella kann nicht sterben, nicht krank werden und nicht weglaufen.
   Wer eine Woche nicht hereinschaut, findet sie müde und traurig vor,
   mehr nicht — und hat sie in ein paar Minuten wieder obenauf. Alles,
   was hier gerechnet wird, muss diese Zusage halten.
   ============================================================ */

const RAEUME = ['schlaf', 'kueche', 'wohnen', 'bad', 'schrank'];
const RAUMNAME = { schlaf:'Schlafzimmer', kueche:'Küche', wohnen:'Wohnzimmer',
                   bad:'Bad', schrank:'Kleiderschrank' };

/* Die Bildschirmfläche im Gerät, in Pixeln der Grafik — nicht in
   Bildschirmpunkten. Der Maßstab kommt später aus der echten Breite. */
const SCHIRM_B = 128, SCHIRM_H = 96;
const BODEN_Y = 68;            // ab hier beginnt der Fußboden

/* ---------- Bestand ---------- */

function leererVault(){
  const jetzt = new Date().toISOString();
  return {
    bella: {
      name: 'Bella',
      geboren: jetzt,
      satt: 75, sauber: 80, ausgeruht: 70, laune: 80,
      schlaeft: false, zugedeckt: false,
      ort: 'schlaf',            // sie ist immer nur an einem Ort
    },
    bad: { zusatz: 'klar' },
    /* Von Hand gesetzte Plätze, in Zentimetern: raum → name → {x, unten}.
       Was hier steht, gilt vor der Voreinstellung. */
    plaetze: {},
    zonen: {},
    bestellung: null,
    outfit: { stueck: 'kleid', farbe: 'rosenrot', frisur: 'lang',
              schuhe: 'sch_ballerina', accessoire: 'acc_keins' },
    zeiten: { einschlafen: '02:30', aufwachen: '10:30' },
    raeume: {
      schlaf:  { wand:'flieder', wandmuster:'wand_punkte',   boden:'eiche', bodenmuster:'boden_diele',
                 deko: ['kissen_a'], wanddeko: [], licht: true },
      kueche:  { wand:'butter',  wandmuster:'wand_karo',     boden:'perle', bodenmuster:'boden_fliese' },
      wohnen:  { wand:'minze',   wandmuster:'wand_streifen', boden:'eiche', bodenmuster:'boden_diele' },
      bad:     { wand:'himmel',  wandmuster:'wand_karo',     boden:'perle', bodenmuster:'boden_fliese',
                 deko: [] },
      schrank: { wand:'rosa',    wandmuster:'wand_herzen',   boden:'beere', bodenmuster:'boden_teppich' },
    },
    besitz: { kleider: ['rosenrot', 'himmelblau'], haare: ['beere', 'honig'],
              waende: ['flieder','butter','minze','himmel','rosa'],
              boeden: ['eiche','perle','beere'],
              bett: ['kissen_a'], bad: [], zusaetze: ['klar'], wanddeko: [],
              stuecke: ['kleid', 'schlafanzug'], frisuren: ['lang', 'kurz'],
              schuhe: ['sch_barfuss', 'sch_ballerina'], accessoires: ['acc_keins'] },
    vorrat: { erdbeere: 3, milch: 2, mehl: 2, honig: 1, beere: 2, ei: 2 },
    snacks: { keks: 2, apfel: 1 },
    bestelltHeute: { tag: '', anzahl: 0 },
    kochbuch: [],
    post: [],
    gesprochen: [],
    erinnerungen: false,
    stand: jetzt,
    letzterBesuch: jetzt,
    modus: 'hell',
    backup: null,
  };
}

let DATA = leererVault();

const state = {
  raum: 'schlaf',
  blase: null,        // was Bella gerade sagt
  blaseBis: 0,
  offen: null,        // welches Fenster offen ist
  auswahl: [],        // angeklickte Zutaten in der Küche
  schaum: false,      // Bella ist eingeschäumt und noch nicht abgebraust
  bestellwahl: [],    // was gerade in den Bestellkorb gelegt wurde
  szene: null,        // läuft gerade eine Kochszene?
  essen: null,        // isst Bella gerade in der Küche?
  dusche: null,       // läuft gerade das Abbrausen?
  plansch: null,      // planscht Bella gerade in der Wanne?
  platzieren: null,   // { was } — welcher Gegenstand gerade gesetzt wird
  bildzaehler: 0,     // treibt die Zappel-Animation
};

function vaultPayload(){
  const v = {};
  for (const k of ['bella','bad','plaetze','zonen','bestellung','bestelltHeute','outfit','zeiten','raeume',
                   'besitz','vorrat','snacks','kochbuch','post','gesprochen','erinnerungen',
                   'stand','letzterBesuch','modus','backup']) v[k] = DATA[k];
  return v;
}

function zahl(x, standard, min, max){
  const n = Number(x);
  if (!Number.isFinite(n)) return standard;
  return Math.min(max, Math.max(min, n));
}

function uhrzeit(x, standard){
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(x) ? x : standard;
}

function adoptVault(saved){
  const v = leererVault();
  if (!saved) return v;
  const b = saved.bella || {};
  v.bella = {
    name: String(b.name || 'Bella').slice(0, 14) || 'Bella',
    geboren: typeof b.geboren === 'string' ? b.geboren : v.bella.geboren,
    satt: zahl(b.satt, 75, 0, 100),
    sauber: zahl(b.sauber, 80, 0, 100),
    ausgeruht: zahl(b.ausgeruht, 70, 0, 100),
    laune: zahl(b.laune, 80, 0, 100),
    schlaeft: !!b.schlaeft,
    zugedeckt: !!b.zugedeckt,
    ort: RAEUME.includes(b.ort) ? b.ort : 'schlaf',
  };
  v.bad = { zusatz: BADEZUSAETZE[(saved.bad || {}).zusatz] ? saved.bad.zusatz : 'klar' };
  v.plaetze = {};
  Object.entries(saved.plaetze || {}).forEach(([raum, dinge]) => {
    if (!RAEUME.includes(raum) || !dinge || typeof dinge !== 'object') return;
    v.plaetze[raum] = {};
    Object.entries(dinge).forEach(([name, o]) => {
      if (o && Number.isFinite(o.x) && Number.isFinite(o.unten))
        v.plaetze[raum][name] = { x: +o.x, unten: +o.unten };
    });
  });
  /* Die Größen der Zonen. Die Stelle steht in `plaetze`, hier steht
     nur, wie breit und hoch — das braucht nur, wer Bett oder Wanne
     selbst gemalt hat. */
  v.zonen = {};
  Object.entries(saved.zonen || {}).forEach(([name, o]) => {
    if (!zoneDa(name) || !o) return;
    const masse = {};
    if (Number.isFinite(o.b) && o.b > 4) masse.b = +o.b;
    if (Number.isFinite(o.h) && o.h > 4) masse.h = +o.h;
    if (Object.keys(masse).length) v.zonen[name] = masse;
  });
  const roh = Array.isArray(saved.bestellung) ? saved.bestellung
            : (saved.bestellung ? [saved.bestellung] : []);
  const echt = roh.filter(b => b && typeof b.liefert === 'string'
                            && b.waren && typeof b.waren === 'object')
                  .map(b => ({ liefert: b.liefert, waren: b.waren }));
  v.bestellung = echt.length ? echt : null;
  const o = saved.outfit || {};
  v.outfit = {
    stueck: KLEIDUNG[o.stueck] ? o.stueck : 'kleid',
    farbe:  KLEIDER[o.farbe] ? o.farbe : (KLEIDER[o.kleid] ? o.kleid : 'rosenrot'),
    frisur: FRISUREN[o.frisur] ? o.frisur : 'lang',
    schuhe: SCHUHE[o.schuhe] ? o.schuhe : 'sch_ballerina',
    accessoire: ACCESSOIRES[o.accessoire] ? o.accessoire : 'acc_keins',
  };
  const z = saved.zeiten || {};
  v.zeiten = { einschlafen: uhrzeit(z.einschlafen, '02:30'),
               aufwachen:   uhrzeit(z.aufwachen,   '10:30') };

  RAEUME.forEach(r => {
    const q = (saved.raeume || {})[r] || {};
    const d = v.raeume[r];
    v.raeume[r] = {
      wand: WANDFARBEN[q.wand] ? q.wand : d.wand,
      wandmuster: KACHELN[q.wandmuster] ? q.wandmuster : d.wandmuster,
      boden: BODENFARBEN[q.boden] ? q.boden : d.boden,
      bodenmuster: KACHELN[q.bodenmuster] ? q.bodenmuster : d.bodenmuster,
      deko: (Array.isArray(q.deko) ? q.deko : (d.deko || [])).filter(x => KLEINKRAM[x]).slice(0, 3),
      licht: typeof q.licht === 'boolean' ? q.licht : (d.licht !== false),
      wanddeko: (Array.isArray(q.wanddeko) ? q.wanddeko : (d.wanddeko || []))
                  .filter(x => WANDDEKO[x]).slice(0, WANDDEKO_MAX),
    };
  });

  const bs = saved.besitz || {};
  const gefiltert = (liste, quelle, standard) => {
    const echt = (Array.isArray(liste) ? liste : []).filter(x => quelle[x]);
    return echt.length ? [...new Set(echt)] : standard;
  };
  v.besitz = {
    kleider: gefiltert(bs.kleider, KLEIDER, ['rosenrot','himmelblau']),
    stuecke: gefiltert(bs.stuecke, KLEIDUNG, ['kleid','schlafanzug']),
    frisuren: gefiltert(bs.frisuren, FRISUREN, ['lang','kurz']),
    schuhe: gefiltert(bs.schuhe, SCHUHE, ['sch_barfuss','sch_ballerina']),
    accessoires: gefiltert(bs.accessoires, ACCESSOIRES, ['acc_keins']),
    waende:  gefiltert(bs.waende,  WANDFARBEN, ['flieder','butter','minze','himmel','rosa']),
    boeden:  gefiltert(bs.boeden,  BODENFARBEN, ['eiche','perle','beere']),
    bett:    (Array.isArray(bs.bett) ? bs.bett : []).filter(x => BETTZEUG[x]),
    wanddeko:(Array.isArray(bs.wanddeko) ? bs.wanddeko : []).filter(x => WANDDEKO[x]),
    bad:     (Array.isArray(bs.bad)  ? bs.bad  : []).filter(x => BADSPIELZEUG[x]),
    zusaetze: gefiltert(bs.zusaetze, BADEZUSAETZE, ['klar']),
  };
  if (!v.besitz.zusaetze.includes(v.bad.zusatz)) v.besitz.zusaetze.push(v.bad.zusatz);
  // Was man trägt, muss man auch besitzen.
  if (!v.besitz.kleider.includes(v.outfit.farbe)) v.besitz.kleider.push(v.outfit.farbe);
  if (!v.besitz.stuecke.includes(v.outfit.stueck)) v.besitz.stuecke.push(v.outfit.stueck);
  if (!v.besitz.frisuren.includes(v.outfit.frisur)) v.besitz.frisuren.push(v.outfit.frisur);
  if (!v.besitz.schuhe.includes(v.outfit.schuhe)) v.besitz.schuhe.push(v.outfit.schuhe);
  if (!v.besitz.accessoires.includes(v.outfit.accessoire)) v.besitz.accessoires.push(v.outfit.accessoire);

  v.vorrat = {};
  Object.keys(ZUTATEN).forEach(k => {
    v.vorrat[k] = zahl((saved.vorrat || {})[k], 0, 0, 99);
  });
  v.snacks = {};
  Object.keys(SNACKS).forEach(k => {
    v.snacks[k] = zahl((saved.snacks || {})[k], 0, 0, 99);
  });
  const bh = saved.bestelltHeute || {};
  v.bestelltHeute = { tag: typeof bh.tag === 'string' ? bh.tag : '',
                      anzahl: zahl(bh.anzahl, 0, 0, 99) };
  v.kochbuch = (saved.kochbuch || []).filter(id => REZEPTE.some(r => r.id === id));
  v.post = (saved.post || []).filter(p => p && typeof p.art === 'string')
    .map(p => ({ art: String(p.art), was: String(p.was || ''), text: String(p.text || '') }));
  v.gesprochen = (saved.gesprochen || []).filter(x => typeof x === 'string').slice(-40);
  v.erinnerungen = !!saved.erinnerungen;
  v.stand = typeof saved.stand === 'string' ? saved.stand : v.stand;
  v.letzterBesuch = typeof saved.letzterBesuch === 'string' ? saved.letzterBesuch : v.letzterBesuch;
  v.modus = saved.modus === 'dunkel' ? 'dunkel' : 'hell';
  v.backup = saved.backup || null;
  return v;
}

let speicherKlemmt = false;
async function persist(){
  try { await Store.saveVault(vaultPayload()); speicherKlemmt = false; }
  catch (e){ speicherKlemmt = true; }
}

/* ---------- Zutaten und Rezepte ----------
   Die Küche ist kein Knopf „Füttern", sondern zwei Zutaten, die etwas
   ergeben. Was herauskommt, wandert ins Kochbuch — das ist der Grund,
   noch einmal in die Küche zu gehen. */

const ZUTATEN = {
  erdbeere: { name:'Erdbeere', zeichen:'erdbeere' },
  milch:    { name:'Milch',    zeichen:'milch' },
  mehl:     { name:'Mehl',     zeichen:'mehl' },
  honig:    { name:'Honig',    zeichen:'honig' },
  beere:    { name:'Blaubeere',zeichen:'beere' },
  ei:       { name:'Ei',       zeichen:'ei' },
};

const REZEPTE = [
  { id:'pfannkuchen', name:'Pfannkuchen', aus:['mehl','ei'],        satt:34, laune:6 },
  { id:'milchreis',   name:'Milchreis',   aus:['milch','mehl'],     satt:30, laune:5 },
  { id:'shake',       name:'Erdbeershake',aus:['erdbeere','milch'], satt:22, laune:12 },
  { id:'marmelade',   name:'Marmelade',   aus:['erdbeere','honig'], satt:18, laune:10 },
  { id:'muffin',      name:'Beerenmuffin',aus:['beere','mehl'],     satt:28, laune:11 },
  { id:'honigbrot',   name:'Honigbrot',   aus:['honig','mehl'],     satt:26, laune:7 },
  { id:'ruehrei',     name:'Rührei',      aus:['ei','milch'],       satt:32, laune:4 },
  { id:'beerentraum', name:'Beerentraum', aus:['beere','erdbeere'], satt:20, laune:14 },
  { id:'kuchen',      name:'Honigkuchen', aus:['honig','ei'],       satt:30, laune:13 },
  { id:'beerenmilch', name:'Beerenmilch', aus:['beere','milch'],    satt:19, laune:9 },
  { id:'ruehrkuchen', name:'Rührkuchen',  aus:['ei','erdbeere'],    satt:27, laune:10 },
  { id:'honigmilch',  name:'Honigmilch',  aus:['honig','milch'],    satt:16, laune:15 },
  { id:'erdbeerkeks', name:'Erdbeerkeks', aus:['erdbeere','mehl'],  satt:25, laune:12 },
  { id:'beerenhonig', name:'Beerenhonig', aus:['honig','beere'],    satt:17, laune:16 },
  { id:'beerenomlett',name:'Beerenomlett',aus:['beere','ei'],       satt:29, laune:8 },
];

/* Bestellt wird kostenlos; geliefert wird am nächsten Tag. Das ist die
   Geduld statt eines Preises: man muss vorher daran denken, nicht
   sparen. */
const LIEFERSTUNDE = 9;

/* Fünf Zutaten am Tag, über beliebig viele Bestellungen. Das Limit
   hängt am Kalendertag, nicht an der Bestellung — sonst könnte man
   fünfmal hintereinander fünf ordern. */
const TAGESMENGE = 5;

function heuteSchluessel(jetzt){
  const d = new Date(jetzt || Date.now());
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
       + '-' + String(d.getDate()).padStart(2, '0');
}

/* Wie viel heute noch geht. Ein neuer Tag setzt den Zähler zurück. */
function bestellRest(jetzt){
  const heute = heuteSchluessel(jetzt);
  if (DATA.bestelltHeute.tag !== heute) return TAGESMENGE;
  return Math.max(0, TAGESMENGE - DATA.bestelltHeute.anzahl);
}

function bestellungVermerken(anzahl, jetzt){
  const heute = heuteSchluessel(jetzt);
  if (DATA.bestelltHeute.tag !== heute) DATA.bestelltHeute = { tag: heute, anzahl: 0 };
  DATA.bestelltHeute.anzahl += anzahl;
}

function lieferzeit(jetzt){
  const d = new Date(jetzt);
  d.setDate(d.getDate() + 1);
  d.setHours(LIEFERSTUNDE, 0, 0, 0);
  return d;
}

/* Ist eine Lieferung fällig, wandert sie in den Vorrat. Es können
   mehrere offen sein — am Tageslimit hängt die Menge, nicht die Zahl
   der Bestellungen. */
function lieferungPruefen(jetzt){
  const offen = Array.isArray(DATA.bestellung) ? DATA.bestellung
              : (DATA.bestellung ? [DATA.bestellung] : []);
  if (!offen.length) return null;
  const nun = new Date(jetzt || Date.now());
  const geliefert = {};
  const bleibt = [];
  offen.forEach(b => {
    if (nun < new Date(b.liefert)){ bleibt.push(b); return; }
    Object.entries(b.waren).forEach(([id, n]) => {
      if (!ZUTATEN[id]) return;
      DATA.vorrat[id] = Math.min(99, (DATA.vorrat[id] || 0) + n);
      geliefert[id] = (geliefert[id] || 0) + n;
    });
  });
  DATA.bestellung = bleibt.length ? bleibt : null;
  return Object.keys(geliefert).length ? geliefert : null;
}

/* ---------- Bad ----------
   Der Zusatz färbt das Wasser und die Blasen. Mehr macht er nicht — es
   soll hübsch sein, nicht wirksamer. */

const BADEZUSAETZE = {
  klar:     { name:'Klar',      wasser:['#BEE6FF','#8FD0F5','#5AA8D8'], blase:'#8FD0F5', blaseHell:'#DFF3FF' },
  rosen:    { name:'Rosen',     wasser:['#FFD3E8','#FFA7CE','#E06BA4'], blase:'#FFA7CE', blaseHell:'#FFE6F2' },
  minze:    { name:'Minze',     wasser:['#CFF8E6','#8EE8C4','#4FBF97'], blase:'#8EE8C4', blaseHell:'#E7FFF6' },
  lavendel: { name:'Lavendel',  wasser:['#E0D2FF','#B79BF0','#8562C9'], blase:'#B79BF0', blaseHell:'#F2EAFF' },
  zitrone:  { name:'Zitrone',   wasser:['#FFF3BF','#FFE070','#D9B52E'], blase:'#FFE070', blaseHell:'#FFFAE0' },
  galaxie:  { name:'Galaxie',   wasser:['#6E6BC8','#4B3F9E','#2A1F63'], blase:'#A88FFF', blaseHell:'#E0D4FF' },
};

/* Snacks sind fertig — man kocht sie nicht, man hat sie oder nicht.
   Sie kommen ausschließlich mit der Post; das ist der Unterschied zur
   Küche, wo man aus Zutaten etwas macht. */
const SNACKS = {
  keks:      { name:'Keks',       satt:12, laune:6,  farbe:'#D8A467' },
  schoki:    { name:'Schokolade', satt:14, laune:10, farbe:'#8A5B2E' },
  apfel:     { name:'Apfel',      satt:10, laune:4,  farbe:'#FF5C5C' },
  brezel:    { name:'Brezel',     satt:15, laune:5,  farbe:'#C98B5A' },
  lutscher:  { name:'Lutscher',   satt:6,  laune:13, farbe:'#FF4FA3' },
  joghurt:   { name:'Joghurt',    satt:13, laune:7,  farbe:'#BEE6FF' },
  nuesse:    { name:'Nüsse',      satt:16, laune:3,  farbe:'#A3703F' },
  gummibaer: { name:'Gummibären', satt:8,  laune:12, farbe:'#4BE38A' },
};

const BADSPIELZEUG = {
  sp_ente:   { name:'Ente' },
  sp_schiff: { name:'Schiffchen' },
  sp_stern:  { name:'Seestern' },
};

/* ---------- Wanddeko ----------
   Hängt an der Wand über dem Bett, nicht auf dem Bett. Kommt wie alles
   andere mit der Post. Anders als Kissen und Kuscheltiere steht hier
   eine Höhe über dem Boden dabei: eine Lichterkette gehört oben hin,
   ein Regal auf Greifhöhe. */
/* `breit` hängt quer über die ganze Nische, alles andere in den freien
   Streifen zwischen Fenster und Bett. Die Vorgabestelle wird aus der
   Nische gerechnet statt in festen Zentimetern angegeben: die Nische ist
   auf jedem Gerät verschieden groß, und feste Werte lägen mal über dem
   Fenster und mal im Bett. Verschieben lässt sich danach alles. */
/* Wie viele Stücke gleichzeitig an der Wand hängen dürfen. Drei, nicht
   vier: die Nische ist klein, und bei vier großen Stücken gibt es keine
   Anordnung mehr, in der sich nichts deckt. Verschieben kann man danach
   trotzdem alles. */
const WANDDEKO_MAX = 3;

const WANDDEKO = {
  wd_lichterkette: { name:'Lichterkette', breit: true },
  wd_girlande:     { name:'Girlande',     breit: true },
  wd_bild:         { name:'Bild' },
  wd_bild_gross:   { name:'Großes Bild' },
  wd_traumfaenger: { name:'Traumfänger' },
  wd_wandregal:    { name:'Wandregal' },
};

const BETTZEUG = {
  kissen_a:  { name:'Kissen rosa' },
  kissen_b:  { name:'Kissen blau' },
  kissen_c:  { name:'Kissen gelb' },
  ku_baer:   { name:'Teddy' },
  ku_hase:   { name:'Hase' },
  ku_frosch: { name:'Frosch' },
  ku_katze:  { name:'Katze' },
};

function rezeptFuer(a, b){
  return REZEPTE.find(r => (r.aus[0] === a && r.aus[1] === b) || (r.aus[0] === b && r.aus[1] === a)) || null;
}

/* ---------- Zeit ----------
   Bella lebt nach der Uhr des Handys, aber als Nachteule: sie schläft
   von halb drei bis halb elf. Beides lässt sich verschieben, deshalb
   steht es im Bestand und nicht hier als Zahl. */

function minutenAus(hhmm){
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/* Liegt der Zeitpunkt im Schlaffenster? Das Fenster geht über
   Mitternacht, deshalb die Fallunterscheidung. */
function istSchlafzeit(d){
  const jetzt = d.getHours() * 60 + d.getMinutes();
  const ein = minutenAus(DATA.zeiten.einschlafen);
  const auf = minutenAus(DATA.zeiten.aufwachen);
  return ein <= auf ? (jetzt >= ein && jetzt < auf) : (jetzt >= ein || jetzt < auf);
}

/* Wie viele Minuten zwischen zwei Zeitpunkten fielen in den Schlaf.
   Minutenweise gezählt statt gerechnet: das Fenster ist verschiebbar,
   und eine Formel dafür wäre in zwei Wochen keiner mehr nachvollziehen. */
function schlafMinuten(von, bis){
  let geschlafen = 0;
  const schritt = 5;
  for (let t = von.getTime(); t < bis.getTime(); t += schritt * 60000){
    if (istSchlafzeit(new Date(t))) geschlafen += schritt;
  }
  return geschlafen;
}

/* Pro Stunde. Wach zehrt alles, Schlaf füllt das Ausgeruht wieder auf. */
const ZEHRUNG = { satt: 3.2, sauber: 2.0, ausgeruht: 4.6 };
/* Im Dunkeln schläft sie besser. Gerechnet wird mit dem Licht, wie es
   gerade steht — wann im Nachhinein geschaltet wurde, weiß die App
   nicht, und dafür eine Schaltuhr mitzuschreiben wäre mehr Aufwand als
   Nutzen. */
const ERHOLUNG = 11;
const ERHOLUNG_HELL = 7;

function lichtAn(){ return DATA.raeume.schlaf.licht !== false; }
function erholungJetzt(){ return lichtAn() ? ERHOLUNG_HELL : ERHOLUNG; }

/* Höchstens so viele Stunden werden nachgerechnet. Wer einen Monat weg
   war, findet Bella traurig vor — aber nicht auf null, und ein paar
   Minuten Pflege bringen sie zurück. Das ist die Zusage der App. */
const NACHHOLGRENZE = 36;
const BODEN_WERT = 12;

function begrenzen(x){ return Math.min(100, Math.max(0, x)); }

/* Schreibt die Werte von DATA.stand bis jetzt fort. */
function standFortschreiben(jetzt){
  const nun = jetzt || new Date();
  const vorher = new Date(DATA.stand);
  let minuten = (nun - vorher) / 60000;
  if (!(minuten > 0)) { DATA.stand = nun.toISOString(); return 0; }

  const echteMinuten = minuten;
  let schlaf = schlafMinuten(vorher, nun);
  if (minuten > NACHHOLGRENZE * 60){
    // Gekappt, aber im selben Verhältnis, damit eine lange Pause nicht
    // plötzlich wie eine durchwachte Nacht aussieht.
    const anteil = (NACHHOLGRENZE * 60) / minuten;
    schlaf *= anteil;
    minuten = NACHHOLGRENZE * 60;
  }
  const wach = minuten - schlaf;
  const b = DATA.bella;

  b.satt      = begrenzen(b.satt      - ZEHRUNG.satt      * minuten / 60);
  b.sauber    = begrenzen(b.sauber    - ZEHRUNG.sauber    * minuten / 60);
  b.ausgeruht = begrenzen(b.ausgeruht - ZEHRUNG.ausgeruht * wach / 60 + erholungJetzt() * schlaf / 60);

  // Die Laune folgt den anderen dreien, langsam und immer nur bis zu
  // einem Rest: ganz unten landet sie nie.
  const schnitt = (b.satt + b.sauber + b.ausgeruht) / 3;
  const zieh = Math.min(1, minuten / (6 * 60));
  b.laune = begrenzen(b.laune + (schnitt - b.laune) * zieh);

  [ 'satt', 'sauber', 'ausgeruht', 'laune' ].forEach(k => {
    if (b[k] < BODEN_WERT) b[k] = BODEN_WERT;
  });

  b.schlaeft = istSchlafzeit(nun);
  DATA.stand = nun.toISOString();
  return echteMinuten;
}

function stimmung(){
  const b = DATA.bella;
  if (b.schlaeft) return 'schlaef';
  if (b.laune >= 75) return 'froh';
  if (b.laune <= 38) return 'traurig';
  return 'normal';
}

function gesamtwohl(){
  const b = DATA.bella;
  return Math.round((b.satt + b.sauber + b.ausgeruht + b.laune) / 4);
}

/* ---------- Die Bühne ----------
   Das Spiel füllt die obere Hälfte. Die Auflösung ist deshalb nicht
   fest, sondern ergibt sich aus der gemessenen Fläche geteilt durch den
   Maßstab — so bleibt jeder Pixel ein ganzes Vielfaches und das Bild
   reicht trotzdem von Rand zu Rand.

   Die Szenen richten sich an der Fläche aus statt an festen Punkten;
   deshalb steht unten überall `s.b` und `s.h` statt einer Zahl. */

const BUEHNE_ANTEIL = 0.5;

/* Gerechnet wird ab hier in **Zentimetern**. Wie viele Bildpunkte
   daraus werden, sagt der Maßstab in massstab.js; gezeichnet wird in
   Gerätepunkten, nicht in CSS-Punkten — sonst reichte die Auflösung
   für diesen Detailgrad nicht.

   Die Bühne zeigt so viel Zimmer, wie das Gerät hergibt: auf einem
   dichten Bildschirm mehr, auf einem groben weniger. Der Fußboden liegt
   immer unten, damit bei wenig Platz oben etwas fehlt und nicht unten. */

function buehneMasse(){
  const el = typeof document !== 'undefined' ? document.getElementById('buehne') : null;
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  let breiteCss = el ? el.clientWidth : 0;
  let hoeheCss = typeof window !== 'undefined' ? Math.round(window.innerHeight * BUEHNE_ANTEIL) : 0;
  if (!(breiteCss > 60) || !(hoeheCss > 60)){
    // jsdom misst nicht: ein plausibles Handy annehmen.
    breiteCss = 390; hoeheCss = 422;
  }
  const leinwandB = Math.round(breiteCss * dpr);
  const leinwandH = Math.round(hoeheCss * dpr);
  /* Die Breite steht fest: ein ganzes Zimmer. Die Höhe folgt der Form
     der Bühne — ein schmaleres Gerät zeigt mehr Wand, ein breiteres
     weniger. Der Maßstab ist das Ergebnis, nicht die Vorgabe. */
  /* Auf einem flachen, breiten Bildschirm reichte die feste Breite
     nicht: das Zimmer wäre dann niedriger als Bella. Dann wird der
     Ausschnitt breiter — mehr Zimmer statt abgeschnittener Bella. */
  const form = leinwandH / leinwandB;
  const noetig = Math.ceil((BELLA_CM + ZIMMER.bodenCm + 12) / form);
  const b = Math.max(ZIMMER.breiteCm, noetig);
  const mass = leinwandB / b;
  return {
    b, h: +(leinwandH / mass).toFixed(2),
    dpr, breiteCss, hoeheCss, leinwandB, leinwandH, mass,
  };
}

/* Ein Rechteck, in Zentimetern angegeben. Alles Gezeichnete geht hier
   durch, damit nirgends versehentlich eine andere Einheit einfließt. */
function px(ctx, s, x, y, b, h, farbe){
  if (!farbe) return;
  ctx.fillStyle = farbe;
  ctx.fillRect(Math.round(x * s.mass), Math.round(y * s.mass),
               Math.max(0, Math.round(b * s.mass)), Math.max(0, Math.round(h * s.mass)));
}

/* Eine gefüllte Ellipse, zeilenweise aus Rechtecken — so bekommt sie
   die stufige Kante, die zur Pixelgrafik gehört. Gerechnet wird in
   Punkten, damit die Stufen auf dem Punktraster sitzen. */
function ellipse(ctx, s, mx, my, rx, ry, farbe){
  if (!farbe) return;
  const mxp = mx * s.mass, myp = my * s.mass;
  const rxp = Math.round(rx * s.mass), ryp = Math.round(ry * s.mass);
  ctx.fillStyle = farbe;
  for (let y = -ryp; y <= ryp; y++){
    const t = 1 - (y * y) / (ryp * ryp);
    if (t <= 0) continue;
    const halb = Math.round(rxp * Math.sqrt(t));
    ctx.fillRect(Math.round(mxp - halb), Math.round(myp + y), halb * 2 + 1, 1);
  }
}

function ellipsenRing(ctx, s, mx, my, rx, ry, dicke, farbe){
  const mxp = mx * s.mass, myp = my * s.mass;
  const rxp = Math.round(rx * s.mass), ryp = Math.round(ry * s.mass);
  const dp = Math.max(1, Math.round(dicke * s.mass));
  ctx.fillStyle = farbe;
  for (let y = -ryp; y <= ryp; y++){
    const t = 1 - (y * y) / (ryp * ryp);
    if (t <= 0) continue;
    const aussen = Math.round(rxp * Math.sqrt(t));
    const ti = 1 - (y * y) / ((ryp - dp) * (ryp - dp));
    const innen = ti > 0 ? Math.round((rxp - dp) * Math.sqrt(ti)) : -1;
    if (innen < 0){ ctx.fillRect(Math.round(mxp - aussen), Math.round(myp + y), aussen * 2 + 1, 1); continue; }
    ctx.fillRect(Math.round(mxp - aussen), Math.round(myp + y), aussen - innen, 1);
    ctx.fillRect(Math.round(mxp + innen + 1), Math.round(myp + y), aussen - innen, 1);
  }
}

/* Ein Möbelstück an seiner Stelle. Drei Quellen, in dieser Reihenfolge:
   eine gelieferte Datei, eine Zeichnung aus moebel.js, zur Not noch das
   alte Raster. Verankert wird unten links — Dinge stehen auf dem Boden,
   sie hängen nicht an ihrer Oberkante. */
function maleNachMass(ctx, s, name, raster, xCm, untenCm, plaetze, nacht){
  if (maleBildNachMass(ctx, s, name, xCm, untenCm)) return;
  const cm = groesseCm(name);
  if (cm && moebelDa(name)){
    maleMoebel(ctx, s, name, xCm, untenCm - cm, breiteCm(name, raster), cm, plaetze, nacht);
    return;
  }
  const rows = Array.isArray(raster) ? raster : (raster && raster.p);
  if (!rows || !rows.length) return;
  const zug = cm ? (cm * s.mass) / rows.length : s.mass;
  const hoehe = rows.length * zug;
  const xp = Math.round(xCm * s.mass), yp = Math.round(untenCm * s.mass - hoehe);
  for (let j = 0; j < rows.length; j++){
    const zeile = rows[j];
    for (let i = 0; i < zeile.length; i++){
      const ch = zeile[i];
      if (ch === '.') continue;
      const nr = PLAETZE.indexOf(ch);
      const farbe = nr >= 0 ? (plaetze && plaetze[nr]) : PALETTE[ch];
      if (!farbe) continue;
      ctx.fillStyle = farbe;
      ctx.fillRect(Math.round(xp + i * zug), Math.round(yp + j * zug),
                   Math.ceil(zug), Math.ceil(zug));
    }
  }
}

/* Eine gelieferte Datei. Sie wird auf ihre wirkliche Größe gebracht —
   nicht umgefärbt, nicht zugeschnitten, nur so groß, wie die
   eingetragenen Zentimeter es verlangen. Gemalt ist sie in der
   Modellauflösung (5,6 Punkte je cm); zeigt das Gerät weniger, bleibt
   der Rest in der Datei und kommt auf einem größeren Bildschirm zum
   Vorschein. */
function maleBildNachMass(ctx, s, name, xCm, untenCm){
  const b = BILDER[name];
  if (!b) return false;
  const cm = groesseCm(name);
  const hoehe = cm ? cm * s.mass : b.h * (s.mass / MODELL_PX_JE_CM);
  const breite = Math.round(hoehe * b.b / b.h);
  ctx.drawImage(b.el, Math.round(xCm * s.mass), Math.round(untenCm * s.mass - hoehe),
                breite, Math.round(hoehe));
  return true;
}

/* Wie breit etwas in Zentimetern ist — für Platzierungen. */
function breiteCm(name, raster){
  const fest = breitenMass(name);
  if (fest) return fest;
  const b = BILDER[name];
  const cm = groesseCm(name);
  // Eine gelieferte Datei behält ihr Seitenverhältnis.
  if (b) return cm ? +(cm * b.b / b.h).toFixed(1) : +(b.b / MODELL_PX_JE_CM).toFixed(1);
  const rows = Array.isArray(raster) ? raster : (raster && raster.p);
  if (!rows || !rows.length || !cm) return 0;
  return +(cm * rows[0].length / rows.length).toFixed(1);
}

/* ---------- Gemalte Wände und Böden ----------
   Wand und Boden bleiben zwei getrennte Sachen, die man einzeln wechselt
   — deshalb gibt es keinen einen Zimmer-Hintergrund, sondern je ein Bild
   für die gewählte Tapete und eins für den gewählten Boden. Wer in den
   Einstellungen die Tapete tauscht, tauscht damit auch das gemalte Bild.

   Zwei Arten von Datei, unterschieden an ihrer eigenen Breite:

     Bahn    so breit wie das Zimmer (1904 Punkte). Wird einmal gesetzt,
             am Boden verankert. Zeigt das Gerät mehr Wand, als die Bahn
             hoch ist, wird die oberste Zeile fortgesetzt; dasselbe zur
             Seite. Für gemalte Wände mit Motiv.
     Kachel  schmaler. Wird wiederholt, von der Bodenlinie aus gesetzt,
             damit die Fuge dort sitzt und nicht irgendwo. Für Tapeten
             und Dielen.

   Nichts wird verzerrt und nichts umgefärbt: eine Datei wird nur auf
   ihre Zentimeter gebracht. */
function maleFlaeche(ctx, s, platz, xCm, yCm, bCm, hCm, vonUnten, bahnBreiteCm){
  const b = BILDER[platz];
  if (!b || !ctx.drawImage || !ctx.save) return false;
  const p = v => Math.round(v * s.mass);
  const x0 = p(xCm), y0 = p(yCm), x1 = p(xCm + bCm), y1 = p(yCm + hCm);
  if (!(x1 > x0) || !(y1 > y0)) return false;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, x1 - x0, y1 - y0);
  ctx.clip();

  /* Woran sich eine Bahn misst: im Zimmer die Zimmerbreite, in einer
     Nahansicht deren Ausschnitt. */
  const bahn = bahnBreiteCm || ZIMMER.breiteCm;
  const eigenBreiteCm = b.b / MODELL_PX_JE_CM;
  if (eigenBreiteCm >= bahn - 2){
    // Bahn: in Zimmerbreite, mittig, am gewünschten Rand verankert.
    const zb = p(bahn) - p(0);
    const zh = Math.max(1, Math.round(b.h * zb / b.b));
    const zx = x0 + Math.round(((x1 - x0) - zb) / 2);
    const zy = vonUnten ? y1 - zh : y0;
    ctx.drawImage(b.el, zx, zy, zb, zh);
    // Ränder fortsetzen, damit nie eine Lücke steht.
    if (zy > y0)      ctx.drawImage(b.el, 0, 0,       b.b, 1, zx, y0, zb, zy - y0);
    if (zy + zh < y1) ctx.drawImage(b.el, 0, b.h - 1, b.b, 1, zx, zy + zh, zb, y1 - (zy + zh));
    if (zx > x0)      ctx.drawImage(b.el, 0, 0,       1, b.h, x0, zy, zx - x0, zh);
    if (zx + zb < x1) ctx.drawImage(b.el, b.b - 1, 0, 1, b.h, zx + zb, zy, x1 - (zx + zb), zh);
  } else {
    // Kachel: wiederholt, ausgerichtet an der Kante, die zählt.
    const kb = Math.max(1, Math.round(eigenBreiteCm * s.mass));
    const kh = Math.max(1, Math.round((b.h / MODELL_PX_JE_CM) * s.mass));
    const start = vonUnten ? y1 - kh : y0;
    const schritt = vonUnten ? -kh : kh;
    for (let yy = start; vonUnten ? yy + kh > y0 : yy < y1; yy += schritt)
      for (let xx = x0; xx < x1; xx += kb)
        ctx.drawImage(b.el, xx, yy, kb, kh);
  }
  ctx.restore();
  return true;
}

/* Wand- und Bodenmuster kacheln. Ein Motiv ist rund 12 cm groß. */
const KACHEL_CM = 12;

function maleKachelCm(ctx, s, kachel, xCm, yCm, bCm, hCm, plaetze){
  const zug = (KACHEL_CM * s.mass) / 8;
  const x0 = xCm * s.mass, y0 = yCm * s.mass;
  const bp = bCm * s.mass, hp = hCm * s.mass;
  for (let j = 0; j < hp; j += 8 * zug){
    for (let i = 0; i < bp; i += 8 * zug){
      for (let r = 0; r < 8; r++){
        for (let c = 0; c < 8; c++){
          const ch = kachel[r][c];
          if (ch === '.') continue;
          const nr = PLAETZE.indexOf(ch);
          const farbe = nr >= 0 ? (plaetze && plaetze[nr]) : PALETTE[ch];
          if (!farbe) continue;
          const xx = x0 + i + c * zug, yy = y0 + j + r * zug;
          if (xx > x0 + bp || yy > y0 + hp) continue;
          ctx.fillStyle = farbe;
          ctx.fillRect(Math.round(xx), Math.round(yy), Math.ceil(zug), Math.ceil(zug));
        }
      }
    }
  }
}

/* ---------- Tageszeit ----------
   Früher lag hier ein Rasterpunkt-Überzug über jedem Zimmer. Der war als
   Nachtstimmung gedacht, las sich aber als Muster über dem Bild und hat
   jede Grafik zugedeckt. Die Tageszeit bleibt als Angabe erhalten — sie
   entscheidet, ob Fenster hell oder dunkel sind —, aber es wird nichts
   mehr über die Szene gelegt. */

function tageszeit(d){
  const h = (d || new Date()).getHours();
  if (h >= 8  && h < 17) return { name:'tag',    nacht:false };
  if (h >= 5  && h < 8)  return { name:'morgen', nacht:false };
  if (h >= 17 && h < 20) return { name:'abend',  nacht:true  };
  return { name:'nacht', nacht:true };
}

function raumFarben(raum){
  const r = DATA.raeume[raum];
  return { wand: WANDFARBEN[r.wand].farben, boden: BODENFARBEN[r.boden].farben,
           wandmuster: KACHELN[r.wandmuster], bodenmuster: KACHELN[r.bodenmuster] };
}

/* Die sechs Plätze: Stofffarbe und Haarfarbe. Die Haarfarbe ist fest —
   wählbar ist die Frisur, nicht ihre Farbe. */
function outfitPlaetze(){
  const k = KLEIDER[DATA.outfit.farbe].farben;
  return [k[0], k[1], k[2], HAARFARBE[0], HAARFARBE[1], HAARFARBE[2]];
}

/* Kopf und Körper aneinandergesetzt. Eine neue Frisur kostet so kein
   zweites Kleid und umgekehrt. */
function bellaRaster(){
  return FRISUREN[DATA.outfit.frisur].p.concat(KLEIDUNG[DATA.outfit.stueck].p);
}

function stoffFarben(){ return KLEIDER[DATA.outfit.farbe].farben; }

/* Nachts liegt sie nicht jeden Tag gleich da. Die Haltung hängt am
   Kalendertag, nicht am Zufall — sonst zappelte sie im Bett. */
const SCHLAFLAGEN = [
  { dx: 0,  dy: 0,  spiegel: false },
  { dx: 6,  dy: 1,  spiegel: false },
  { dx: -5, dy: 0,  spiegel: true  },
  { dx: 2,  dy: -1, spiegel: true  },
  { dx: -2, dy: 1,  spiegel: false },
];

function schlaflage(jetzt){
  const d = new Date(jetzt || Date.now());
  /* Der Schlaf geht über Mitternacht. Die frühen Stunden werden dem
     Vorabend zugerechnet, damit sie sich nicht um drei Uhr umdreht. */
  const nacht = new Date(d);
  if (d.getHours() < 12) nacht.setDate(nacht.getDate() - 1);
  const schluessel = nacht.getFullYear() + '-' + nacht.getMonth() + '-' + nacht.getDate();
  return SCHLAFLAGEN[streuung(schluessel) % SCHLAFLAGEN.length];
}

/* Zappeln: ein Pixel reicht — zwei sehen aus, als würde sie hüpfen. */
function zappel(){
  if (DATA.bella.schlaeft) return 0;
  const st = stimmung();
  if (st === 'froh') return (state.bildzaehler % 6 < 3) ? -2 : 0;
  if (st === 'traurig') return 0;
  return (state.bildzaehler % 20 < 10) ? 0 : -1;
}

/* ---------- Die Zimmer mit Wand, Boden und Möbeln ----------
   Gilt für Küche, Wohnzimmer und Kleiderschrank. Schlafzimmer und Bad
   sind herangezoomte Szenen und werden eigens gezeichnet. */

/* Bella stehend: Körper und Gesicht mit demselben Zug gezeichnet, sonst
   säße das Gesicht neben dem Kopf. `untenCm` ist der Boden unter ihren
   Füßen — Dinge stehen auf dem Boden, sie hängen nicht an der
   Oberkante. */
function maleBellaStehend(ctx, s, xCm, untenCm, gesicht, nurKopf, spiegel){
  if (maleBildNachMass(ctx, s, 'bella_steht', xCm, untenCm)) return;
  const hoch = nurKopf ? GROESSEN_CM.bella * 0.247 : GROESSEN_CM.bella;
  const breit = breiteCm('bella', null);
  maleBellaFigur(ctx, s, xCm, untenCm - hoch, breit, hoch, {
    frisur: DATA.outfit.frisur,
    stueck: DATA.outfit.stueck,
    schuhe: DATA.outfit.schuhe,
    accessoire: DATA.outfit.accessoire,
    stoff: stoffFarben(),
    haar: HAARFARBE,
    gesicht: gesicht || stimmung(),
    nurKopf: !!nurKopf,
    spiegel: !!spiegel,
  });
}

function bellaBreiteCm(){ return breiteCm('bella', bellaRaster()); }

/* Im Platzierungs-Modus bekommt jedes Ding einen Rahmen, das gewählte
   einen hellen. Ohne den sieht man nicht, was man gerade verschiebt. */
function rahmenUm(ctx, s, name, sprite, p, gewaehlt){
  const b = breiteCm(name, sprite), h = groesseCm(name) || 0;
  if (!b || !h) return;
  const farbe = gewaehlt ? '#FFF06A' : 'rgba(255,240,106,.35)';
  const d = gewaehlt ? 1.2 : 0.6;
  px(ctx, s, p.x, p.unten - h, b, d, farbe);
  px(ctx, s, p.x, p.unten - d, b, d, farbe);
  px(ctx, s, p.x, p.unten - h, d, h, farbe);
  px(ctx, s, p.x + b - d, p.unten - h, d, h, farbe);
}

/* Eine Zone hat keine Grafik, nur eine Fläche. Im Platzierungs-Modus
   bekommt sie einen gestrichelten Rahmen, damit man sieht, was man
   gerade verschiebt. */
function zonenRahmen(ctx, s, z, gewaehlt){
  const farbe = gewaehlt ? '#6AE0FF' : 'rgba(106,224,255,.35)';
  const d = gewaehlt ? 1.2 : 0.6;
  const oben = z.unten - z.h;
  for (let x = z.x; x < z.x + z.b; x += 8){
    px(ctx, s, x, oben, Math.min(4, z.x + z.b - x), d, farbe);
    px(ctx, s, x, z.unten - d, Math.min(4, z.x + z.b - x), d, farbe);
  }
  for (let y = oben; y < z.unten; y += 8){
    px(ctx, s, z.x, y, d, Math.min(4, z.unten - y), farbe);
    px(ctx, s, z.x + z.b - d, y, d, Math.min(4, z.unten - y), farbe);
  }
}

/* Wie viel vom Zimmer Fußboden ist, in Zentimetern — aber nie so viel,
   dass Bella oben aus dem Bild ragt. Auf einem Gerät mit wenig
   Punktdichte bleibt weniger Zimmer übrig, und dann weicht der Boden. */
function bodenbandCm(s){
  /* Feste Höhe, damit die Bodenlinie auf jedem Gerät an derselben
     Stelle im Zimmer liegt. Nur wenn die Bühne so flach wäre, dass
     Bella nicht mehr hineinpasst, weicht der Boden — das kann nach der
     Rechnung in buehneMasse nicht vorkommen, steht aber als Netz da. */
  const platz = Math.max(12, s.h - GROESSEN_CM.bella - 12);
  return Math.min(ZIMMER.bodenCm, platz);
}

/* Wo die Möbel stehen: `x` in Zentimetern vom genannten Rand, `wand`
   für Dinge, die hängen (dann ist `y` die Höhe der Oberkante über dem
   Boden). Alles andere steht auf dem Boden. */
const EINRICHTUNG = {
  kueche: [ {s:'fenster', von:'mitte', x:20, hoehe:205},
            {s:'herd', von:'links', x:20},
            {s:'kuehlschrank', von:'links', x:88},
            {s:'tisch', von:'rechts', x:25} ],
  wohnen: [ {s:'fenster', von:'mitte', x:55, hoehe:210},
            {s:'regal', von:'links', x:14},
            {s:'sofa', von:'mitte', x:10},
            {s:'pflanze', von:'rechts', x:12} ],
  schrank:[ {s:'stange', von:'mitte', x:30, hoehe:175},
            {s:'schrank', von:'links', x:18},
            {s:'spiegel', von:'rechts', x:30, hoehe:170} ],
};

/* Wo Bella im Zimmer steht, in Zentimetern von links. Sie steht ein
   Stück auf dem Fußboden nach vorn — dadurch steht sie sichtbar vor den
   Möbeln statt in ihnen drin. */
const BELLA_STELLE = { kueche:158, wohnen:124, schrank:148 };

function eigenerPlatz(raum, name){
  const r = DATA.plaetze[raum];
  return (r && r[name]) || null;
}

function platzierenCm(m, s, bodenY, raum){
  const eigen = eigenerPlatz(raum, m.s);
  if (eigen) return eigen;
  const breite = breiteCm(m.s, MOEBEL[m.s]);
  const x = m.von === 'rechts' ? s.b - breite - m.x
          : m.von === 'mitte'  ? (s.b - breite) / 2 + (m.x || 0)
          : m.x;
  const unten = m.hoehe ? bodenY - m.hoehe + (groesseCm(m.s) || 0) : bodenY + 2;
  return { x, unten };
}

function maleZimmer(ctx, s, raum, ohneBella){
  const f = raumFarben(raum);
  const bodenY = s.h - bodenbandCm(s);

  /* Erst die gemalte Datei, sonst Farbe und Muster. Wand und Boden
     einzeln, damit man beide weiter getrennt wechseln kann. */
  const r = DATA.raeume[raum];
  px(ctx, s, 0, 0, s.b, s.h, f.wand[0]);
  const gemalteWand = maleFlaeche(ctx, s, 'wand_' + r.wand, 0, 0, s.b, bodenY, true);
  if (!gemalteWand) maleKachelCm(ctx, s, f.wandmuster, 0, 0, s.b, bodenY, f.wand);
  const gemalterBoden = maleFlaeche(ctx, s, 'boden_' + r.boden, 0, bodenY, s.b, s.h - bodenY, false);
  if (!gemalterBoden) maleKachelCm(ctx, s, f.bodenmuster, 0, bodenY, s.b, s.h - bodenY, f.boden);
  /* Die dunkle Kante zwischen Wand und Boden nur, wo nichts Gemaltes
     liegt — über einem eigenen Bild wäre sie ein fremder Strich. */
  if (!gemalteWand && !gemalterBoden) px(ctx, s, 0, bodenY - 3, s.b, 3, PALETTE.K);

  const stoff = stoffFarben();
  EINRICHTUNG[raum].forEach(m => {
    const p = platzierenCm(m, s, bodenY, raum);
    maleNachMass(ctx, s, m.s, MOEBEL[m.s], p.x, p.unten,
                 [stoff[0], stoff[1], stoff[2]], tageszeit().nacht);
    if (state.platzieren) rahmenUm(ctx, s, m.s, MOEBEL[m.s], p, m.s === state.platzieren.was);
  });

  // Die Pflanze aus der Post steht in der Küche, in ihrer eigenen Größe.
  if (raum === 'kueche'){
    const eigen = eigenerPlatz(raum, 'deko_pflanze');
    const pb = breiteCm('deko_pflanze', null);
    const p = eigen || { x: s.b - pb - 30, unten: bodenY + 2 };
    maleNachMass(ctx, s, 'deko_pflanze', null, p.x, p.unten, null);
    if (state.platzieren) rahmenUm(ctx, s, 'deko_pflanze', null, p, state.platzieren.was === 'deko_pflanze');
  }

  // Bella steht nur in dem Zimmer, in dem sie gerade ist.
  if (ohneBella || DATA.bella.ort !== raum) return;
  const bb = bellaBreiteCm();
  const bx = Math.min(BELLA_STELLE[raum] || s.b * 0.4, s.b - bb - 6);
  const vorn = Math.round(bodenbandCm(s) * 0.5);
  const isst = state.essen && raum === 'kueche';
  const takt = Math.floor(Date.now() / 220) % 4;
  const neigung = isst && takt % 3 === 1 ? 2 : zappel();
  maleBellaStehend(ctx, s, bx, bodenY + vorn + neigung,
                   isst ? (takt === 2 ? 'satt' : 'froh') : stimmung());
  if (isst){
    const tellerB = breiteCm('teller', KOCHZEUG.teller);
    maleNachMass(ctx, s, 'teller', KOCHZEUG.teller, bx + bb / 2 - tellerB / 2,
                 bodenY + vorn - 75, null);
  }
}

/* ---------- Die Schlafnische ----------
   Kein Zimmer mit Bett darin, sondern die Nische selbst, herangezoomt:
   eine runde Öffnung in der Wand, links das Fenster zur Stadt, rechts
   ein Regal mit Lichterkette, unten die Kissenlandschaft. Alles
   gezeichnet statt als ein großes Bild abgelegt, damit es sich an jede
   Bühnengröße anpasst. */

const NISCHE = {
  wand:      '#241C3A',
  wandtief:  '#171029',
  innen:     '#3A2A3F',
  rand:      '#6B4A52',
  randlicht: '#C08A6A',
  warm:      '#FFC98A',
  glut:      '#FF9E3D',
  matratze:  '#E8D5C0',
  matratze2: '#CDB49C',
  nacht:     '#0E1430',
  nachtfern: '#1B2550',
  fenster:   '#2A3566',
};

/* FNV-1a: die einfache Zeichensumme liefert bei kurzen, ähnlichen
   Namen fast dieselbe Zahl. */
function streuung(text){
  let h = 2166136261;
  for (let i = 0; i < text.length; i++){
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function streuFolge(saat){
  let h = streuung(String(saat));
  return () => { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 4294967296; };
}

function maleStadt(ctx, s, x, y, b, h){
  px(ctx, s, x, y, b, h, NISCHE.nacht);
  const zufall = streuFolge('stadt');
  // Zwei Reihen Häuser: die hintere blasser, das gibt Tiefe.
  for (const [tief, farbe] of [[true, NISCHE.nachtfern], [false, '#0A0E22']]){
    let hx = x;
    while (hx < x + b){
      const hb = 5 + Math.floor(zufall() * 7);
      const hh = (tief ? 8 : 14) + Math.floor(zufall() * (tief ? 10 : 16));
      const hy = y + h - hh;
      px(ctx, s, hx, hy, Math.min(hb, x + b - hx), hh, farbe);
      if (!tief){
        for (let fy = hy + 2; fy < y + h - 2; fy += 4)
          for (let fx = hx + 1; fx < hx + hb - 1; fx += 3)
            if (zufall() > .45 && fx < x + b - 1)
              px(ctx, s, fx, fy, 1, 2, zufall() > .5 ? '#FFD166' : '#7FE6D3');
      }
      hx += hb + 1;
    }
  }
  // Regen: schräge Striche, wie in der Vorlage.
  const regen = streuFolge('regen');
  for (let i = 0; i < Math.round(b * h / 26); i++){
    const rx = x + Math.floor(regen() * b), ry = y + Math.floor(regen() * (h - 3));
    px(ctx, s, rx, ry, 1, 3, 'rgba(180,210,255,.45)');
  }
}

function maleRegal(ctx, s, x, y, b, h){
  const buchfarben = ['#FF4FA3','#4FA8FF','#4BE38A','#FFD166','#A65CFF','#30F3CF'];
  const zufall = streuFolge('regal');
  const boeden = 2;
  for (let i = 0; i < boeden; i++){
    const by = y + Math.round((i + 1) * h / (boeden + 1));
    px(ctx, s, x, by, b, 2, '#6B4A2E');
    px(ctx, s, x, by - 1, b, 1, '#9A6B3E');
    let bx = x + 2;
    while (bx < x + b - 4){
      const bb = 2 + Math.floor(zufall() * 2);
      const bh = 7 + Math.floor(zufall() * 4);
      px(ctx, s, bx, by - bh, bb, bh, buchfarben[Math.floor(zufall() * buchfarben.length)]);
      px(ctx, s, bx, by - bh, bb, 1, 'rgba(255,255,255,.35)');
      bx += bb + 1;
    }
  }
  // Lichterkette: Punkte mit Hof, über die ganze Breite gehängt.
  for (let i = 0; i < Math.round(b / 7); i++){
    const lx = x + 3 + i * 7, ly = y + 2 + ((i % 2) ? 2 : 0);
    px(ctx, s, lx - 1, ly - 1, 3, 3, 'rgba(255,201,138,.35)');
    px(ctx, s, lx, ly, 1, 1, NISCHE.warm);
  }
}

/* Reihenfolge ist hier alles: erst die Kissenwand, dann die Matratze
   davor, dann Bella darauf. Andersherum schweben die Kissen über dem
   Bett, statt dahinter zu liegen. */
function badFarben(){
  const z = BADEZUSAETZE[DATA.bad.zusatz] || BADEZUSAETZE.klar;
  return z;
}

/* ---------- Die beiden Nahansichten ----------
   Schlafzimmer und Bad sind keine ganzen Zimmer, sondern zwei Szenen:
   die Bettnische und die Wanne, herangezoomt. Das war so gewollt.

   Wichtig ist nur, dass die Szene **vollständig** ins Bild passt. Vorher
   hing sie am Maßstab des Zimmers: sobald das Zimmer breiter wurde, lief
   die Nische unten aus dem Bild. Deshalb bekommt jede Szene hier ihren
   eigenen Maßstab — ihre Breite in Zentimetern steht fest, und die
   Leinwand wird darauf eingestellt. Dadurch ist immer die ganze Szene zu
   sehen, egal wie groß der Bildschirm ist.

   Die Größenverhältnisse bleiben dieselben wie im Zimmer: Bellas Kopf
   ist hier wie dort 42 cm. Nur der Ausschnitt ist enger. */

const SZENE_CM = {
  nische: { breite: 210, minHoehe: 190 },
  wanne:  { breite: 190, minHoehe: 150 },
};

function szenenMasse(s, szene){
  /* Auf einem flachen, breiten Bildschirm reicht die feste Breite nicht:
     die Szene wäre niedriger als sie hoch ist und liefe oben und unten
     heraus. Dann wird der Ausschnitt breiter — mehr Umgebung statt einer
     angeschnittenen Szene. */
  const noetig = Math.ceil(szene.minHoehe * s.leinwandB / s.leinwandH);
  const b = Math.max(szene.breite, noetig);
  const mass = s.leinwandB / b;
  return { b, h: +(s.leinwandH / mass).toFixed(2),
           dpr: s.dpr, breiteCss: s.breiteCss, hoeheCss: s.hoeheCss,
           leinwandB: s.leinwandB, leinwandH: s.leinwandH, mass };
}

/* Wo die Nische und die Wanne liegen. Die Zeichnung fragt hier nach,
   und die Prüfung fragt dieselbe Stelle — so kann nicht wieder
   auseinanderlaufen, was gezeichnet und was geprüft wird. */
const NISCHE_OBEN = 6, NISCHE_UNTEN = 14;   // Luft über dem Bogen, Teppich davor

function nischeMasse(s){
  const mx = Math.round(s.b / 2), rx = Math.round(s.b * 0.47);
  /* Der Bogen darf oben nicht aus dem Bild laufen und unten nicht in
     den Teppich: die Höhe wird auf das eingepasst, was übrig ist. */
  const platz = s.h - NISCHE_OBEN - NISCHE_UNTEN;
  const ry = Math.round(Math.min(s.h * 0.46, platz / 2));
  const my = NISCHE_OBEN + ry;
  return { mx, rx, ry, my, oben: my - ry, unten: my + ry,
           links: mx - rx, rechts: mx + rx };
}

function wanneMasse(s){
  const mx = Math.round(s.b / 2), wy = Math.round(s.h * 0.30);
  const wb = s.b - 10, wh = s.h - wy - 10;
  const rx = Math.round(wb / 2), ry = Math.round(wh / 2), my = wy + ry;
  return { mx, wy, wb, wh, rx, ry, my, oben: my - ry, unten: my + ry,
           links: mx - rx, rechts: mx + rx };
}

/* ---------- Zonen ----------
   Zwei Stellen in den Nahansichten hängen nicht an einem Möbelstück,
   sondern an einer Fläche: wo Bella im Bett liegt, und wo in der Wanne
   Wasser ist. Malst du Bett oder Wanne selbst, stimmt meine gezeichnete
   Stelle nicht mehr — deshalb lassen sich beide im Platzierungs-Modus
   verschieben und in der Größe ändern, statt fest im Code zu stehen.

   Ohne eigene Grafik entsprechen sie dem, was gezeichnet wird; wer
   nichts hochlädt, merkt von den Zonen nichts. */
const ZONEN = {
  schlaf: { zone_liege:  { name: 'Liegefläche' } },
  bad:    { zone_wasser: { name: 'Wasserfläche' } },
};

function zoneDa(name){
  return Object.keys(ZONEN).some(r => ZONEN[r][name]);
}

/* Die Zone, wie sie gerade steht. `vorgabe` ist, was ohne eigene Werte
   gälte — die Stelle aus der gezeichneten Fassung. */
function zone(raum, name, vorgabe){
  const eigen = eigenerPlatz(raum, name);
  const eigenMass = (DATA.zonen || {})[name] || {};
  return {
    x:     eigen ? eigen.x : vorgabe.x,
    unten: eigen ? eigen.unten : vorgabe.unten,
    b:     eigenMass.b || vorgabe.b,
    h:     eigenMass.h || vorgabe.h,
  };
}

function maleKissenwand(ctx, s, mx, oberkante, rx, gross){
  const zufall = streuFolge('kissen');
  const toene = [['#D8A08A','#F0C4A8'], ['#C08070','#E0A48E'],
                 ['#E3C4A2','#F6E0C6'], ['#B5705C','#D29280']];
  const wie = Math.max(4, Math.round(rx / (gross * 1.3)));
  for (let i = 0; i < wie; i++){
    const kx = mx - rx + gross + (i * (rx * 2 - gross * 2) / (wie - 1));
    const ky = oberkante - Math.round(zufall() * gross * 0.4);
    const kr = gross * (0.8 + zufall() * 0.4);
    const [dunkel, hell] = toene[Math.floor(zufall() * toene.length)];
    ellipse(ctx, s, kx, ky, kr, kr * 0.8, dunkel);
    ellipse(ctx, s, kx, ky - 1, kr - 2, kr * 0.58, hell);
  }
}

/* Die Matratze bekommt ihre Höhe gesagt, statt sie zu erraten: sonst
   liegt in einer großen Nische eine flache Scheibe am unteren Rand. */
function maleMatratze(ctx, s, mx, unten, rx, hoch){
  const mitte = unten - hoch / 2;
  ellipse(ctx, s, mx, mitte + 1, rx + 1, hoch / 2 + 1, '#8A6B5C');
  ellipse(ctx, s, mx, mitte, rx, hoch / 2, NISCHE.matratze2);
  ellipse(ctx, s, mx, mitte - hoch * 0.12, rx - 3, hoch / 2 - 1, NISCHE.matratze);
  px(ctx, s, mx - rx + 5, unten - hoch + 1, (rx - 5) * 2, 1.2, 'rgba(255,255,255,.4)');
}

/* Bella im Bett: Kopf auf dem Kissen, der Körper als Hügel darunter.
   Ohne den Hügel läge nur ein Kopf auf der Matratze. Zugedeckt wechselt
   der Hügel die Farbe und bekommt einen umgeschlagenen Saum — daran
   sieht man, dass "Zudecken" etwas getan hat. */
function maleBellaImBett(ctx, s, mx, oberkante, rechtsBis){
  const stoff = stoffFarben();
  const zu = DATA.bella.zugedeckt;
  const lage = DATA.bella.schlaeft ? schlaflage() : SCHLAFLAGEN[0];
  const liegtCm = GROESSEN_CM.bella_liegt;
  const unten = oberkante + 8;
  const kopfX = mx - 30 + lage.dx, kopfY = unten - liegtCm + lage.dy;

  // Unbedeckt einen Ton dunkler als die Matratze, sonst verschwände der
  // Körper darin und es läge nur ein Kopf auf dem Bett.
  const huegel = zu ? stoff[1] : '#B99A82';
  const huegelHell = zu ? stoff[0] : '#D4B79C';
  // Der Hügel liegt auf der Seite, auf der sie nicht den Kopf hat.
  /* Der Hügel schließt an ihrer Schulter an und reicht bis ans Fußende.
     Als eigene Scheibe daneben sah er aus wie ein Kissen, nicht wie ihr
     Körper. */
  const vonX = kopfX + 44, bisX = mx + rechtsBis;
  const hx = (vonX + bisX) / 2, hr = Math.max(14, (bisX - vonX) / 2);
  ellipse(ctx, s, hx, unten - 5 + lage.dy, hr, 11, huegel);
  ellipse(ctx, s, hx, unten - 8 + lage.dy, hr - 3, 8, huegelHell);
  if (zu){
    // Umgeschlagener Saum am Kopfende: daran sieht man das Zudecken.
    px(ctx, s, vonX - 2, unten - 17 + lage.dy, 20, 6, stoff[0]);
    px(ctx, s, vonX - 2, unten - 11 + lage.dy, 20, 2.5, stoff[2]);
  }

  if (!maleBildNachMass(ctx, s, 'bella_liegt', kopfX, kopfY + liegtCm))
    maleBellaLiegend(ctx, s, kopfX, kopfY, liegtCm * 48 / 42, liegtCm,
                     { haar: HAARFARBE, spiegel: lage.spiegel });
}

function maleSchlafnische(ctx, s){
  const n = nischeMasse(s);
  const mx = n.mx, rx = n.rx, ry = n.ry, my = n.my, unten = n.unten;

  /* Ein einziges Bild für die ganze Nische: Bett, Wand, Fenster, alles
     zusammen. Liegt es vor, wird nichts davon mehr gezeichnet — nur
     Bella, die Decke und die Deko kommen darüber, und die lassen sich
     frei setzen.

     Für „Licht aus" gibt es einen zweiten Platz. Fehlt er, wird das
     helle Bild abgedunkelt; dann ist allerdings auch das Fenster dunkel,
     denn was darin Licht ist, weiß nur, wer es gemalt hat. */
  const dunkelPlatz = 'szene_nische_dunkel';
  const eigenesDunkel = !lichtAn() && bildDa(dunkelPlatz);
  const szenenPlatz = eigenesDunkel ? dunkelPlatz : 'szene_nische';
  const gemalteNische = maleFlaeche(ctx, s, szenenPlatz, 0, 0, s.b, s.h, true, s.b);
  if (gemalteNische){
    if (!lichtAn() && !eigenesDunkel) px(ctx, s, 0, 0, s.b, s.h, 'rgba(8,6,24,.62)');
    maleNischeninhalt(ctx, s, n);
    return;
  }

  px(ctx, s, 0, 0, s.b, s.h, NISCHE.wand);
  px(ctx, s, 0, s.h - 12, s.b, 12, NISCHE.wandtief);

  ellipse(ctx, s, mx, my, rx + 2, ry + 2, NISCHE.rand);
  ellipse(ctx, s, mx, my, rx, ry, NISCHE.innen);
  ellipsenRing(ctx, s, mx, my, rx + 2, ry + 2, 1, NISCHE.randlicht);

  /* Lichterkette am oberen Bogen — in der Vorlage ist sie das, was die
     Nische warm macht. Die Punkte sitzen auf der Ellipse selbst, damit
     sie der Rundung folgen statt auf einer Geraden zu hängen. Sie ist
     das Nachtlicht: sie bleibt an, wenn das Deckenlicht ausgeht. */
  const lichterkette = () => {
    for (let i = 0; i <= 14; i++){
      const w = Math.PI + (i / 14) * Math.PI;      // oberer Halbkreis
      const lx = Math.round(mx + Math.cos(w) * (rx - 3));
      const ly = Math.round(my + Math.sin(w) * (ry - 3));
      px(ctx, s, lx - 1.5, ly - 1.5, 4, 4, 'rgba(255,201,138,.30)');
      px(ctx, s, lx - 0.7, ly - 0.7, 1.6, 1.6, (i % 3) ? NISCHE.warm : '#FFF0D0');
    }
  };
  lichterkette();

  /* Regal und Hängepflanze sind fest eingebaute Wanddeko. Hängt eigene
     an der Wand, weichen sie: die Nische ist klein, und beides
     nebeneinander liegt übereinander. Wer nichts aufhängt, sieht die
     Nische wie gehabt. */
  const eigeneWanddeko = (DATA.raeume.schlaf.wanddeko || []).length > 0;

  if (!eigeneWanddeko){
    // Eine Hängepflanze, damit die Wand nicht leer bleibt.
    const px0 = mx - Math.round(rx * 0.52), py0 = my - Math.round(ry * 0.10);
    px(ctx, s, px0 - 4, py0, 9, 5, '#8A5B2E');
    px(ctx, s, px0 - 5, py0 - 2, 11, 2, '#A9743E');
    for (const [dx, dy, len] of [[-3, 5, 9], [0, 5, 13], [3, 5, 7], [-1, 5, 16]]){
      for (let k = 0; k < len; k++)
        px(ctx, s, px0 + dx + ((k % 4 < 2) ? 0 : 1), py0 + dy + k, 1, 1,
           (k % 3) ? '#4BE38A' : '#2FB86A');
    }
  }

  // Fenster links, Regal rechts — beide innerhalb der Nische.
  const fb = Math.round(rx * 0.72), fh = Math.round(ry * 0.92);
  const fx = mx - rx + Math.round(rx * 0.18), fy = my - ry + Math.round(ry * 0.22);
  const fenster = () => {
    px(ctx, s, fx - 2, fy - 2, fb + 4, fh + 4, '#4A3A38');
    maleStadt(ctx, s, fx, fy, fb, fh);
    px(ctx, s, fx + Math.round(fb / 2), fy, 2, fh, '#4A3A38');
    px(ctx, s, fx, fy + Math.round(fh / 2), fb, 2, '#4A3A38');
    // Vorhang am rechten Fensterrand
    px(ctx, s, fx + fb, fy - 2, 4, fh + 4, '#D8C3A5');
    px(ctx, s, fx + fb + 1, fy - 2, 1, fh + 4, '#EFE0C8');
  };
  fenster();

  if (!eigeneWanddeko){
    const gb = Math.round(rx * 0.62), gh = Math.round(ry * 0.78);
    const gx = mx + Math.round(rx * 0.16), gy = my - ry + Math.round(ry * 0.26);
    maleRegal(ctx, s, gx, gy, Math.min(gb, mx + rx - gx - 3), gh);
  }

  /* Das Bett füllt das untere Drittel der Nische. Vorher war es eine
     flache Scheibe am unteren Rand und Bella lag halb hinter der
     Sprechblase.

     Liegt eine gemalte Bettdatei vor, tritt sie an die Stelle von
     Kissenwand und Matratze. */
  const bettUnten = unten - 12, bettRx = rx - 6;
  const matratzeHoch = Math.max(12, Math.round(s.h * 0.085));
  const gemaltesBett = maleBildNachMass(ctx, s, 'bett_nische', mx - bettRx, bettUnten);
  if (!gemaltesBett){
    maleKissenwand(ctx, s, mx, bettUnten - matratzeHoch + 2, bettRx, Math.max(7, matratzeHoch * 0.55));
    maleMatratze(ctx, s, mx, bettUnten, bettRx, matratzeHoch);
  }

  maleNischeninhalt(ctx, s, n);

  /* Der warme Lichtsaum unter der Nischenkante — in der Vorlage ist er
     das, was den Raum gemütlich macht. Zwei Zeilen: die obere heller.
     Er hängt am Deckenlicht und geht mit ihm aus. */
  if (lichtAn()){
    px(ctx, s, mx - rx, unten, rx * 2, 1.5, NISCHE.warm);
    px(ctx, s, mx - rx + 4, unten + 1.5, rx * 2 - 8, 1.5, NISCHE.glut);
  }
  // Der Teppich davor, angedeutet als flache Ellipse.
  ellipse(ctx, s, mx, s.h - 4, Math.round(rx * 0.7), 5, '#4A3A42');
  ellipse(ctx, s, mx, s.h - 6, Math.round(rx * 0.62), 4, '#5C4750');

  /* Licht aus: eine ruhige dunkle Fläche über alles — kein Muster, das
     würde über der Pixelgrafik liegen. Fenster und Lichterkette werden
     danach wieder in voller Farbe gesetzt: sie sind die beiden
     Lichtquellen, die bleiben, und ohne sie wäre das Bild nur dunkel
     statt nächtlich. */
  if (!lichtAn()){
    px(ctx, s, 0, 0, s.b, s.h, 'rgba(8,6,24,.62)');
    fenster();
    lichterkette();
  }
}

/* Was in der Nische auf dem Hintergrund liegt: Wanddeko, Bella mit
   Decke, und was auf dem Bett abgelegt ist. Das ist derselbe Inhalt,
   ob die Nische gezeichnet oder gemalt ist — deshalb steht er hier für
   sich und nicht zweimal. */
function maleNischeninhalt(ctx, s, n){
  const mx = n.mx, rx = n.rx, unten = n.unten;
  const bettUnten = unten - 12, bettRx = rx - 6;
  const matratzeHoch = Math.max(12, Math.round(s.h * 0.085));
  const oberkante = bettUnten - matratzeHoch;

  /* Die Wanddeko hängt an der Wand; jedes Stück lässt sich im
     Platzierungs-Modus frei setzen. */
  (DATA.raeume.schlaf.wanddeko || []).slice(0, WANDDEKO_MAX).forEach(id => {
    if (!WANDDEKO[id]) return;
    const p = platzVon('schlaf', id, s);
    maleNachMass(ctx, s, id, null, p.x, p.unten, null);
    if (state.platzieren) rahmenUm(ctx, s, id, null, p, state.platzieren.was === id);
  });

  /* Wo Bella liegt, sagt die Zone — bei einem gemalten Hintergrund ist
     das die einzige Angabe, die die App nicht erraten kann. */
  const liege = zone('schlaf', 'zone_liege',
                     { x: mx - bettRx + 6, unten: oberkante, b: bettRx * 2 - 12, h: 46 });
  if (DATA.bella.ort === 'schlaf')
    maleBellaImBett(ctx, s, liege.x + liege.b / 2, liege.unten, liege.b / 2 - 16);
  if (state.platzieren)
    zonenRahmen(ctx, s, liege, state.platzieren.was === 'zone_liege');

  /* Was aus der Post auf dem Bett liegt: am rechten Bettende, nicht
     über Bella — sie liegt links mit dem Kopf am Kissen. */
  let dx = mx + bettRx - 10;
  (DATA.raeume.schlaf.deko || []).slice(0, 3).forEach(id => {
    const sp = KLEINKRAM[id];
    if (!sp) return;
    const breit = breiteCm(id, sp);
    dx -= breit;
    const eigen = eigenerPlatz('schlaf', id);
    if (!eigen && dx < mx + 18) return;    // näher an Bella wird nichts abgelegt
    const px0 = eigen ? eigen.x : dx;
    const py0 = eigen ? eigen.unten : oberkante + 4;
    maleNachMass(ctx, s, id, sp, px0, py0, null);
    if (state.platzieren)
      rahmenUm(ctx, s, id, sp, { x: px0, unten: py0 }, state.platzieren.was === id);
    dx -= 5;
  });
}

/* ---------- Die Badeszene ----------
   Auch hier nur die Wanne, herangezoomt: heller Raum, weiter Rand,
   getöntes Wasser, Blasen. Was im Wasser ist, kommt aus dem Badezusatz;
   was auf dem Rand steht, aus der Post. */

function maleBadeszene(ctx, s){
  const z = badFarben();
  const mx = Math.round(s.b / 2);
  const w = wanneMasse(s);
  const wy = w.wy, rx = w.rx, ry = w.ry, my = w.my;

  /* Wie im Schlafzimmer: ein einziges Bild für die ganze Szene — Wand,
     Fliesen, Wanne, Wasser, Blasen. Je Badezusatz eine eigene Fassung,
     weil sich damit die Farbe des Wassers ändert. Liegt sie vor, wird
     nichts davon mehr gezeichnet; darüber kommen nur noch Bella, der
     Schaum, die Dusche und das Spielzeug. */
  const szenenPlatz = 'szene_wanne_' + DATA.bad.zusatz;
  const gemalteSzene = maleFlaeche(ctx, s, szenenPlatz, 0, 0, s.b, s.h, true, s.b);

  if (!gemalteSzene){
    px(ctx, s, 0, 0, s.b, s.h, '#EFEAF0');
    // Fliesenfugen, nur angedeutet.
    for (let y = 0; y < Math.round(s.h * 0.32); y += 9) px(ctx, s, 0, y, s.b, 1, '#E2DAE6');
    for (let x = 0; x < s.b; x += 14) px(ctx, s, x, 0, 1, Math.round(s.h * 0.32), '#E2DAE6');
  }

  /* Je Badezusatz auch einzeln: nur die Wanne, auf mein Badezimmer
     gesetzt. Für alle, die nicht die ganze Szene malen wollen. */
  const gemalteWanne = gemalteSzene ||
    maleBildNachMass(ctx, s, 'wanne_' + DATA.bad.zusatz, mx - rx, my + ry);
  if (!gemalteWanne){
    ellipse(ctx, s, mx, my, rx, ry, '#C9C2CE');
    ellipse(ctx, s, mx, my - 1, rx - 1, ry - 1, '#FFFFFF');
    ellipse(ctx, s, mx, my + 1, rx - 7, ry - 6, z.wasser[2]);
    ellipse(ctx, s, mx, my, rx - 8, ry - 7, z.wasser[1]);
    ellipse(ctx, s, mx, my - 1, rx - 10, ry - 9, z.wasser[0]);
  }

  /* Wo Wasser ist, sagt die Zone. Bei der gezeichneten Wanne ist das die
     Ellipse; bei einer gemalten steht die Form nicht fest, deshalb lässt
     sich die Fläche im Platzierungs-Modus zurechtschieben. Daran hängen
     Blasen, Dampf, Spielzeug, Bella und das Planschen. */
  const wasser = zone('bad', 'zone_wasser',
                      { x: mx - rx + 14, unten: my + ry - 12, b: (rx - 14) * 2, h: (ry - 12) * 2 });
  const wmx = wasser.x + wasser.b / 2, wmy = wasser.unten - wasser.h / 2;
  const wrx = wasser.b / 2, wry = wasser.h / 2;

  /* Blasen. Eine gemalte Wanne bringt sie selbst mit — dort wird nichts
     darübergestreut. Wer trotzdem bewegte Blasen will, legt eine Datei
     `blase_<zusatz>` dazu; dann kommen sie wieder, aber als sein Bild. */
  const blasenPlatz = 'blase_' + DATA.bad.zusatz;
  const blasenZeichnen = !gemalteWanne || bildDa(blasenPlatz);
  // Auch der Dampf gehört zum Bild, wenn die ganze Szene gemalt ist.
  const dampfZeichnen = !gemalteSzene;
  const zufall = streuFolge('blasen' + DATA.bad.zusatz);
  for (let i = 0; blasenZeichnen && i < 14; i++){
    const winkel = zufall() * Math.PI * 2, r = Math.sqrt(zufall());
    const bx = wmx + Math.round(Math.cos(winkel) * wrx * r * 0.88);
    const by = wmy + Math.round(Math.sin(winkel) * wry * r * 0.88);
    const br = 3 + Math.round(zufall() * 4);
    if (bildDa(blasenPlatz)){
      maleBildNachMass(ctx, s, blasenPlatz, bx - br, by + br);
      continue;
    }
    ellipse(ctx, s, bx, by, br, br, z.blase);
    ellipse(ctx, s, bx, by, br - 1, br - 1, 'rgba(255,255,255,.55)');
    ellipse(ctx, s, bx, by, br - 2, br - 2, z.blaseHell);
    px(ctx, s, bx - br + 2, by - br + 2, 2, 1, '#FFFFFF');
    px(ctx, s, bx - br + 1, by - br + 3, 1, 1, '#FFFFFF');
  }

  // Dampf über dem Wasser.
  const dampf = streuFolge('dampf');
  for (let i = 0; dampfZeichnen && i < 3; i++){
    let dx = wmx - 16 + i * 16, dy = wmy - wry - 2;
    for (let k = 0; k < 8; k++){
      px(ctx, s, dx, dy - k * 3, 1, 2, 'rgba(255,255,255,.55)');
      dx += dampf() > .5 ? 1 : -1;
    }
  }

  /* Bella sitzt hinten in der Wanne, angelehnt — nicht mitten im Wasser.
     Ihr Kopf ist hier so groß wie im Zimmer, 42 cm; in diesem engeren
     Ausschnitt füllt er nur mehr Bild. */
  const inDerWanne = DATA.bella.ort === 'bad';
  const kopfHoch = GROESSEN_CM.bella * 0.247;
  const bellaB = breiteCm('bella', null);
  const bx = wmx - bellaB / 2, by = wmy - wry + 10;
  if (inDerWanne) maleBellaStehend(ctx, s, bx, by, state.schaum ? 'froh' : stimmung(), true);
  if (state.schaum && inDerWanne){
    // Schaumhaube und Schaumkragen, damit man das Einschäumen sieht.
    ellipse(ctx, s, wmx, by - kopfHoch + 4, 16, 8, '#FFFFFF');
    ellipse(ctx, s, wmx - 11, by - kopfHoch + 7, 7, 5, '#FFFFFF');
    ellipse(ctx, s, wmx + 11, by - kopfHoch + 7, 7, 5, '#FFFFFF');
    ellipse(ctx, s, wmx, by + 2, 21, 6, '#F4F0F8');
  }

  if (state.dusche && inDerWanne) maleDusche(ctx, s, wmx, by - kopfHoch);
  if (state.plansch && inDerWanne)
    malePlanschen(ctx, s, { mx: wmx, my: wmy, rx: wrx, ry: wry });

  /* Was auf dem Rand steht, muss dem Bogen der Wanne folgen — sonst
     schwebt die Kerze an der Wand. Die Höhe wird je Gegenstand aus der
     Ellipse ausgerechnet. */
  const randOben = x => {
    const t = 1 - ((x - wmx) / wrx) * ((x - wmx) / wrx);
    return t <= 0 ? wmy : wmy - Math.round(wry * Math.sqrt(t));
  };
  /* Die Plätze liegen links und rechts, nie in der Mitte: dort sitzt
     Bella, und ein Schiffchen vor ihrem Gesicht sieht nach Fehler aus. */
  const PLATZ = [-0.86, -0.58, 0.58, 0.86];
  const rand = ['sp_kerze'].concat((DATA.raeume.bad.deko || []).slice(0, 3));
  rand.forEach((id, i) => {
    const sp = KLEINKRAM[id];
    if (!sp) return;
    const breit = breiteCm(id, sp);
    const eigen = eigenerPlatz('bad', id);
    const x = eigen ? eigen.x : wmx + PLATZ[i % PLATZ.length] * wrx - breit / 2;
    const unten = eigen ? eigen.unten : randOben(x + breit / 2) + 4;
    maleNachMass(ctx, s, id, sp, x, unten, null);
    if (state.platzieren)
      rahmenUm(ctx, s, id, sp, { x, unten }, state.platzieren.was === id);
  });

  if (state.platzieren) zonenRahmen(ctx, s, wasser, state.platzieren.was === 'zone_wasser');
}

/* Ein Wesen oder Gegenstand: liegt eine gelieferte Grafik für den Platz
   vor, wird sie genommen; sonst der gezeichnete Platzhalter. */
/* Dasselbe Bild, aber groß — für die Kochszene, in der Zutat und
   Gericht die Hauptsache sind. Dort wird nicht nach Weltgröße
   gezeichnet, sondern nach Bildwirkung.

   `hochCm` sagt, wie hoch das Stück auf der Karte sein soll. Gelieferte
   Datei und Platzhalter bekommen dieselbe Höhe — vorher richtete sich
   der Platzhalter nach dem Faktor und die Datei nach ihrer eigenen
   Auflösung, und eine hochgeladene Zutat war halb so groß wie die
   gezeichnete daneben. */
function maleGross(ctx, s, platz, sprite, x, y, faktor, hochCm){
  const rows = sprite && (sprite.p || sprite);
  const hoch = hochCm || (rows ? rows.length * (faktor || 1) : 24);
  const b = BILDER[platz];
  if (b){
    const hp = Math.round(hoch * s.mass);
    ctx.drawImage(b.el, Math.round(x * s.mass), Math.round(y * s.mass),
                  Math.round(hp * b.b / b.h), hp);
    return;
  }
  if (!rows) return;
  for (let j = 0; j < rows.length; j++)
    for (let i = 0; i < rows[j].length; i++){
      const ch = rows[j][i];
      if (ch === '.') continue;
      const farbe = PALETTE[ch];
      if (!farbe) continue;
      ctx.fillStyle = farbe;
      ctx.fillRect(Math.round((x + i * (faktor || 1)) * s.mass),
                   Math.round((y + j * (faktor || 1)) * s.mass),
                   Math.ceil(s.mass * (faktor || 1)), Math.ceil(s.mass * (faktor || 1)));
    }
}

function maleFigur(ctx, s, platz, raster, x, y, plaetze){
  // Vereinfachte Fassung: eine Rasterzelle entspricht einem Zentimeter.
  const rows = Array.isArray(raster) ? raster : (raster && raster.p);
  if (maleBild(ctx, s, platz, x, y)) return;
  if (!rows) return;
  for (let j = 0; j < rows.length; j++)
    for (let i = 0; i < rows[j].length; i++){
      const ch = rows[j][i];
      if (ch === '.') continue;
      const nr = PLAETZE.indexOf(ch);
      const farbe = nr >= 0 ? (plaetze && plaetze[nr]) : PALETTE[ch];
      if (!farbe) continue;
      ctx.fillStyle = farbe;
      ctx.fillRect(Math.round((x + i) * s.mass), Math.round((y + j) * s.mass),
                   Math.ceil(s.mass), Math.ceil(s.mass));
    }
}

/* ---------- Kochen: drei Bilder nacheinander ----------
   Erst die Zutaten auf der Arbeitsfläche mit dem Werkzeug, dann das
   fertige Gericht, dann Bella beim Essen. Die Essensbewegung ist für
   jedes Gericht dieselbe — sie zeigt das Essen, nicht das Gericht. */

/* Nur das Kochen bekommt die eigene Ansicht. Gegessen wird wieder in
   der Küche, bei Bella — sie soll dabei zu sehen sein, nicht auf einer
   Karte ohne Raum. */
const KOCHSCHRITTE = [
  { phase: 'zutaten', dauer: 2000 },
  { phase: 'gericht', dauer: 1800 },
];

/* So lange isst sie danach in der Küche. */
const ESSEN_DAUER = 3000;

function kochszeneStarten(rezept){
  state.szene = { art: 'kochen', rezept, schritt: 0, bis: Date.now() + KOCHSCHRITTE[0].dauer };
}

function kochszeneWeiter(){
  const sz = state.szene;
  if (!sz) return false;
  sz.schritt++;
  if (sz.schritt >= KOCHSCHRITTE.length){
    state.szene = null;
    return true;                       // fertig: jetzt wird in der Küche gegessen
  }
  sz.bis = Date.now() + KOCHSCHRITTE[sz.schritt].dauer;
  return false;
}

function kochszenePhase(){
  return state.szene ? KOCHSCHRITTE[state.szene.schritt].phase : null;
}

/* Der Rahmen wie auf einer aufgelegten Karte: heller Rand, dunkle
   Fläche darin. */
function maleKarte(ctx, s){
  px(ctx, s, 0, 0, s.b, s.h, '#1A2018');
  const r = 4;
  px(ctx, s, r, r, s.b - 2 * r, s.h - 2 * r, '#F4EFE4');
  px(ctx, s, r + 3, r + 3, s.b - 2 * r - 6, s.h - 2 * r - 6, '#2A3326');
  return { x: r + 3, y: r + 3, b: s.b - 2 * r - 6, h: s.h - 2 * r - 6 };
}

function maleArbeitsflaeche(ctx, s, rezept){
  const k = maleKarte(ctx, s);
  if (!maleBild(ctx, s, 'szene_arbeitsflaeche', k.x, k.y)){
    // Laub oben, Erde, davor der Tisch — der Aufbau aus der Vorlage.
    px(ctx, s, k.x, k.y, k.b, Math.round(k.h * 0.22), '#1E3A22');
    const laub = streuFolge('laub');
    for (let i = 0; i < Math.round(k.b / 3); i++){
      const lx = k.x + Math.floor(laub() * k.b);
      const ly = k.y + Math.floor(laub() * k.h * 0.2);
      px(ctx, s, lx, ly, 2, 2, laub() > .5 ? '#2F5C33' : '#3E7A42');
    }
    px(ctx, s, k.x, k.y + Math.round(k.h * 0.22), k.b, k.h, '#4A3A2C');
    const ty = k.y + Math.round(k.h * 0.34);
    px(ctx, s, k.x + 2, ty, k.b - 4, k.h - (ty - k.y) - 8, '#B9814A');
    px(ctx, s, k.x + 2, ty, k.b - 4, 3, '#D8A467');
    px(ctx, s, k.x + 2, ty + 3, k.b - 4, 1, '#8A5B2E');
    for (let x = k.x + 4; x < k.x + k.b - 4; x += 7)
      px(ctx, s, x, ty + 5, 1, k.h - (ty - k.y) - 14, '#A3703F');
  }

  // Die beiden Zutaten und das Werkzeug darauf, doppelt so groß — sie
  // sind der Grund, warum man auf dieses Bild schaut.
  const mitte = Math.round(s.b / 2), zy = Math.round(s.h * 0.50);
  maleGross(ctx, s, 'brett', KOCHZEUG.brett, mitte - 30, zy + 16, 2);
  maleGross(ctx, s, 'messer', KOCHZEUG.messer, mitte + 4, zy + 24, 2);
  rezept.aus.forEach((z, i) => {
    const platz = 'zutat_' + z;
    maleGross(ctx, s, platz, KOCHZEUG[platz], mitte - 28 + i * 32, zy - 12, 2);
  });
  schrift(ctx, s, rezept.name.toUpperCase(), Math.round(s.h * 0.14));
}

function maleGerichtszene(ctx, s, rezept){
  const k = maleKarte(ctx, s);
  px(ctx, s, k.x, k.y, k.b, k.h, '#2A3326');
  px(ctx, s, k.x, k.y + Math.round(k.h * 0.5), k.b, k.h, '#4A3A2C');
  const mitte = Math.round(s.b / 2), ty = Math.round(s.h * 0.52);
  px(ctx, s, k.x + 2, ty, k.b - 4, k.h - (ty - k.y) - 8, '#B9814A');
  px(ctx, s, k.x + 2, ty, k.b - 4, 3, '#D8A467');

  const platz = 'gericht_' + rezept.id;
  if (bildDa(platz)){
    maleGross(ctx, s, platz, null, mitte - 24, ty - 28, 2, 30);
  } else {
    // Platzhalter: Teller mit einem Hügel in der Farbe des Rezepts.
    maleGross(ctx, s, 'teller', KOCHZEUG.teller, mitte - 28, ty - 8, 2);
    const farbe = zutatFarbe(rezept.aus[0]), farbe2 = zutatFarbe(rezept.aus[1]);
    ellipse(ctx, s, mitte, ty - 5, 16, 8, farbe);
    ellipse(ctx, s, mitte - 4, ty - 9, 9, 5, farbe2);
    px(ctx, s, mitte - 8, ty - 12, 3, 2, '#FFFFFF');
  }
  schrift(ctx, s, rezept.name.toUpperCase(), Math.round(s.h * 0.14));
}

/* Bella isst in der Küche: Teller vor ihr, Löffel zum Mund, dieselbe
   Bewegung für jedes Gericht. */
function maleBellaIsst(ctx, s, bx, by, mitte, unten){
  const takt = Math.floor(Date.now() / 220) % 4;
  const rezept = state.essen ? state.essen.rezept : null;
  maleFigur(ctx, s, 'teller', KOCHZEUG.teller, mitte - 14, unten - 6, null);
  if (rezept) ellipse(ctx, s, mitte, unten - 4, 8, 4, zutatFarbe(rezept.aus[0]));
  const ly = takt >= 2 ? by + 12 : unten - 6;
  px(ctx, s, mitte + 9, ly, 2, 6, '#D8D2E0');
  ellipse(ctx, s, mitte + 10, ly - 1, 2, 2, '#EFEAF0');
  if (takt === 3){
    px(ctx, s, bx - 4, by + 4, 2, 2, '#FFD166');
    px(ctx, s, bx + 26, by + 2, 2, 2, '#FF8AC4');
  }
  return takt;
}

function maleEssszene(ctx, s, rezept){
  const k = maleKarte(ctx, s);
  px(ctx, s, k.x, k.y, k.b, k.h, '#3A2E3F');
  px(ctx, s, k.x, k.y + Math.round(k.h * 0.62), k.b, k.h, '#5C4634');

  const mitte = Math.round(s.b / 2);
  const unten = k.y + Math.round(k.h * 0.62);
  // Tisch vor Bella
  px(ctx, s, k.x + 2, unten, k.b - 4, 6, '#B9814A');
  px(ctx, s, k.x + 2, unten, k.b - 4, 2, '#D8A467');

  /* Die Essensbewegung: Bella beugt sich um einen Pixel vor und der
     Löffel wandert zum Mund. Vier Takte, für jedes Gericht gleich. */
  const takt = Math.floor(Date.now() / 220) % 4;
  const neigung = (takt === 1 || takt === 2) ? 1 : 0;
  const plaetze = outfitPlaetze();
  const bx = mitte - 12, by = unten - 30 + neigung;
  const kopfHoch = GROESSEN_CM.bella * 0.247;
  maleBellaStehend(ctx, s, bx, by + kopfHoch, takt === 2 ? 'satt' : 'froh', true);

  maleFigur(ctx, s, 'teller', KOCHZEUG.teller, mitte - 14, unten - 4, null);
  const farbe = zutatFarbe(rezept.aus[0]);
  ellipse(ctx, s, mitte, unten - 2, 8, 4, farbe);

  // Der Löffel: unten am Teller, oben am Mund.
  const ly = takt >= 2 ? by + 12 : unten - 4;
  px(ctx, s, mitte + 9, ly, 2, 6, '#D8D2E0');
  ellipse(ctx, s, mitte + 10, ly - 1, 2, 2, '#EFEAF0');
  if (takt === 3){
    px(ctx, s, mitte - 16, by + 4, 2, 2, '#FFD166');
    px(ctx, s, mitte + 16, by + 2, 2, 2, '#FF8AC4');
  }
  schrift(ctx, s, 'MHM!', Math.round(s.h * 0.14));
}

/* Ein kurzer Text in der Szene. Gezeichnet mit der Pixelschrift des
   Browsers — in der Bühne gibt es kein DOM. */
function schrift(ctx, s, text, y){
  ctx.save();
  ctx.font = Math.round(7 * s.mass) + "px 'Silkscreen', monospace";
  ctx.textAlign = 'center';
  ctx.fillStyle = '#2B1B3D';
  ctx.fillText(text, (s.b / 2) * s.mass + s.mass, y * s.mass + s.mass);
  ctx.fillStyle = '#F4EFE4';
  ctx.fillText(text, (s.b / 2) * s.mass, y * s.mass);
  ctx.restore();
}

function maleKochszene(ctx, s){
  const sz = state.szene;
  const phase = KOCHSCHRITTE[sz.schritt].phase;
  if (phase === 'zutaten') maleArbeitsflaeche(ctx, s, sz.rezept);
  else maleGerichtszene(ctx, s, sz.rezept);
}

function maleRaum(ctx, s, jetzt){
  if (state.szene && state.szene.art === 'kochen'){ maleKochszene(ctx, s); return; }
  if (state.raum === 'schlaf') maleSchlafnische(ctx, szenenMasse(s, SZENE_CM.nische));
  else if (state.raum === 'bad') maleBadeszene(ctx, szenenMasse(s, SZENE_CM.wanne));
  else maleZimmer(ctx, s, state.raum);
}

/* ---------- Erinnerungen ----------
   Getrennt in zwei Teile: `erinnerungsPlan` rechnet nur aus, wann was
   fällig wäre — das lässt sich prüfen, ohne ein Handy zu haben. Erst
   `erinnerungenStellen` spricht mit Android.

   Alles wird auf dem Gerät geplant. Es geht nichts nach draußen, und
   ohne die Erlaubnis der Nutzerin passiert gar nichts. */

const ERINNERUNG = {
  hunger:   { id: 11, titel: 'Hunger', schwelle: 28, wert: 'satt',
              text: n => n + ' hat Hunger.' },
  waesche:  { id: 12, titel: 'Badezeit', schwelle: 25, wert: 'sauber',
              text: n => n + ' würde gern baden.' },
  wach:     { id: 13, titel: 'Guten Morgen', text: n => n + ' ist aufgewacht.' },
  vermisst: { id: 14, titel: 'Vermisst dich', text: n => n + ' hat lange niemanden gesehen.' },
};

/* Nie öfter als das — eine Pflege-App, die einen jagt, ist das Gegenteil
   von dem, was diese hier sein soll. */
const FRUEHESTENS_MIN = 90;

/* Abstand zur Aufwach-Meldung, damit nicht zwei auf einmal kommen. */
const NACH_DEM_WECKEN_MIN = 20;

function naechsteUhrzeit(jetzt, hhmm){
  const d = new Date(jetzt);
  const [h, m] = hhmm.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  if (d <= jetzt) d.setDate(d.getDate() + 1);
  return d;
}

/* Wann fällt ein Wert unter seine Schwelle? Gerechnet mit derselben
   Zehrung wie im Spiel, damit Meldung und Anzeige nicht auseinandergehen. */
function faelligAb(jetzt, wert, stand, schwelle){
  if (stand <= schwelle) return null;         // schon drunter, nicht nachtreten
  const stunden = (stand - schwelle) / ZEHRUNG[wert];
  return new Date(jetzt.getTime() + stunden * 3600000);
}

function erinnerungsPlan(jetzt){
  const nun = jetzt || new Date();
  if (!DATA.erinnerungen) return [];
  const n = DATA.bella.name;
  const plan = [];

  ['hunger', 'waesche'].forEach(art => {
    const e = ERINNERUNG[art];
    let wann = faelligAb(nun, e.wert, DATA.bella[e.wert], e.schwelle);
    if (!wann) return;
    /* Fällt es in ihre Nacht, wird es nicht verworfen, sondern auf nach
       dem Aufwachen geschoben — sonst bekäme man bei vollen Werten nie
       eine Meldung, weil der Zeitpunkt zwölf Stunden später und damit
       regelmäßig im Schlaffenster läge. Der Versatz hält sie von der
       Aufwach-Meldung getrennt. */
    if (istSchlafzeit(wann)){
      wann = new Date(naechsteUhrzeit(wann, DATA.zeiten.aufwachen).getTime() + NACH_DEM_WECKEN_MIN * 60000);
    }
    if (wann - nun < FRUEHESTENS_MIN * 60000) return;
    plan.push({ id: e.id, wann, titel: e.titel, text: e.text(n) });
  });

  plan.push({ id: ERINNERUNG.wach.id, wann: naechsteUhrzeit(nun, DATA.zeiten.aufwachen),
              titel: ERINNERUNG.wach.titel, text: ERINNERUNG.wach.text(n) });

  plan.push({ id: ERINNERUNG.vermisst.id, wann: new Date(nun.getTime() + 3 * 86400000),
              titel: ERINNERUNG.vermisst.titel, text: ERINNERUNG.vermisst.text(n) });

  return plan.sort((a, b) => a.wann - b.wann);
}

function meldedienst(){
  const C = typeof window !== 'undefined' ? window.Capacitor : null;
  return (C && C.Plugins && C.Plugins.LocalNotifications) || null;
}

/* Vor jedem Stellen wird abgeräumt: sonst stapeln sich Meldungen aus
   Werten, die längst wieder oben sind. */
async function erinnerungenStellen(){
  const LN = meldedienst();
  if (!LN) return 'kein Dienst';
  const ids = Object.values(ERINNERUNG).map(e => ({ id: e.id }));
  try { await LN.cancel({ notifications: ids }); } catch (e){ /* nichts gestellt */ }
  const plan = erinnerungsPlan();
  if (!plan.length) return 'nichts zu stellen';
  try {
    await LN.schedule({ notifications: plan.map(p => ({
      id: p.id, title: p.titel, body: p.text, schedule: { at: p.wann },
      smallIcon: 'ic_stat_icon_config_sample',
    })) });
    return plan.length + ' gestellt';
  } catch (e){ return 'abgelehnt'; }
}

async function erinnerungenSchalten(an){
  const LN = meldedienst();
  if (an && LN){
    try {
      const erlaubt = await LN.requestPermissions();
      if (erlaubt && erlaubt.display && erlaubt.display !== 'granted') an = false;
    } catch (e){ an = false; }
  }
  DATA.erinnerungen = !!an;
  await persist();
  await erinnerungenStellen();
  return DATA.erinnerungen;
}

/* ---------- DOM ---------- */

function h(tag, attrs, ...kinder){
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})){
    if (v === null || v === undefined || v === false) continue;
    if (k === 'text') el.textContent = v;
    else if (k === 'onclick') el.onclick = v;
    else if (k === 'oninput') el.oninput = v;
    else if (k === 'onchange') el.onchange = v;
    else if (k === 'style') el.setAttribute('style', v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  kinder.flat().forEach(kind => {
    if (kind === null || kind === undefined || kind === false) return;
    el.appendChild(typeof kind === 'string' ? document.createTextNode(kind) : kind);
  });
  return el;
}

function taste(text, bei, art){
  return h('button', { class: 'taste' + (art ? ' ' + art : ''), text, onclick: bei });
}

function sagen(text, dauer){
  state.blase = text;
  state.blaseBis = Date.now() + (dauer || 3600);
  blaseZeigen();
}

function blaseZeigen(){
  const el = document.getElementById('blase');
  if (!el) return;
  // Während einer Szene stört die Blase nur — sie verdeckt das Bild,
  // auf das man gerade schauen soll.
  const an = !state.szene && state.blase && Date.now() < state.blaseBis;
  el.hidden = !an;
  if (an) el.textContent = state.blase;
}

/* Die Bühne bekommt ihre Höhe vom Bild, nicht umgekehrt: sonst hinge
   das Bild an einer Höhe, die es selbst erzeugt. */
function zeichnen(){
  const c = document.getElementById('bild');
  if (!c || !c.getContext) return;
  const s = buehneMasse();
  /* Die Rückseite des Canvas läuft in **Gerätepunkten**, die Anzeige in
     CSS-Punkten. Nur so steht der Detailgrad zur Verfügung, den die
     gelieferten Grafiken haben. */
  const bp = s.leinwandB, hp = s.leinwandH;
  if (c.width !== bp || c.height !== hp){
    c.width = bp; c.height = hp;
    c.style.width = s.breiteCss + 'px';
    c.style.height = s.hoeheCss + 'px';
    c.dataset.cmB = s.b; c.dataset.cmH = s.h; c.dataset.dpr = s.dpr;
    const buehne = document.getElementById('buehne');
    if (buehne) buehne.style.height = s.hoeheCss + 'px';
  }
  const ctx = c.getContext('2d');
  if (!ctx) return;
  if ('imageSmoothingEnabled' in ctx) ctx.imageSmoothingEnabled = false;
  maleRaum(ctx, s, new Date());
}

/* ---------- Bildchen in den Listen ----------
   Vorrat, Kochen, Bestellen und Snacks zeigten bisher ein Farbkästchen.
   Damit ließ sich nichts austauschen. Hier hängt jeder Eintrag an einem
   Bildplatz: liegt dafür eine Datei in www/bilder/, wird sie gezeigt —
   unverändert, nur mittig in das Kästchen eingepasst. Sonst der
   gezeichnete Platzhalter, sonst ein Klecks in der Farbe des Stücks.

   Eingepasst wird mit ganzen Vielfachen, solange die Datei kleiner ist
   als das Kästchen: ein gemalter Punkt bleibt so ein Quadrat. Erst wenn
   sie größer ist, wird verkleinert. */
const LISTENBILD = 40;

function listenBild(platz, sprite, farbe){
  const c = h('canvas', { width: LISTENBILD, height: LISTENBILD,
                          class: 'listenbild', 'aria-hidden': 'true' });
  const ctx = c.getContext && c.getContext('2d');
  if (!ctx) return h('span', { class:'farbe', style:'background:' + farbe });
  if ('imageSmoothingEnabled' in ctx) ctx.imageSmoothingEnabled = false;

  const b = BILDER[platz];
  if (b){
    const passt = Math.min(LISTENBILD / b.b, LISTENBILD / b.h);
    const f = passt >= 1 ? Math.floor(passt) : passt;
    const bb = Math.round(b.b * f), hh = Math.round(b.h * f);
    ctx.drawImage(b.el, Math.round((LISTENBILD - bb) / 2), Math.round((LISTENBILD - hh) / 2), bb, hh);
    return c;
  }

  const rows = sprite && (sprite.p || sprite);
  if (rows && rows.length){
    const zug = Math.max(1, Math.floor(LISTENBILD / Math.max(rows.length, rows[0].length)));
    const x = Math.round((LISTENBILD - rows[0].length * zug) / 2);
    const y = Math.round((LISTENBILD - rows.length * zug) / 2);
    maleRaster(ctx, rows, x / zug, y / zug, zug, null);
    return c;
  }

  /* Ohne Platzhalter ein runder Klecks statt eines Balkens: er sagt
     „hier fehlt noch ein Bild", ohne wie ein Bedienelement auszusehen. */
  const m = LISTENBILD / 2, r = LISTENBILD * 0.34;
  for (let j = -r; j <= r; j++){
    const halb = Math.round(Math.sqrt(Math.max(0, r * r - j * j)));
    if (!halb) continue;
    ctx.fillStyle = j < -r * 0.35 ? aufhellen(farbe) : farbe;
    ctx.fillRect(Math.round(m - halb), Math.round(m + j), halb * 2, 1);
  }
  return c;
}

/* Ein Ton heller, für den Lichtrand am Klecks. */
function aufhellen(farbe){
  const m = /^#([0-9a-f]{6})$/i.exec(farbe || '');
  if (!m) return farbe;
  const n = parseInt(m[1], 16);
  const hell = v => Math.min(255, Math.round(v + (255 - v) * 0.35));
  return 'rgb(' + hell(n >> 16) + ',' + hell((n >> 8) & 255) + ',' + hell(n & 255) + ')';
}

/* Die Kantenlänge der Icon-Leinwand. 64 statt 44, damit ein gemaltes
   Icon von 30 Punkten glatt verdoppelt hineinpasst und mein gezeichnetes
   von 16 glatt vervierfacht — bei 44 ginge beides nicht auf. */
const ICON_PUNKTE = 64;

function maleIcon(name, platz){
  const c = h('canvas', { width: ICON_PUNKTE, height: ICON_PUNKTE, 'aria-hidden': 'true' });
  if (!c.getContext) return c;
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  if ('imageSmoothingEnabled' in ctx) ctx.imageSmoothingEnabled = false;

  /* Ein geliefertes Icon wird mittig gesetzt und nur um ganze Vielfache
     vergrößert — sonst verlöre es beim Skalieren die harten Kanten. */
  const b = platz && BILDER[platz];
  if (b && ctx.drawImage){
    const passt = Math.min(ICON_PUNKTE / b.b, ICON_PUNKTE / b.h);
    const f = passt >= 1 ? Math.floor(passt) : passt;
    const bb = Math.round(b.b * f), hh = Math.round(b.h * f);
    ctx.drawImage(b.el, Math.round((ICON_PUNKTE - bb) / 2), Math.round((ICON_PUNKTE - hh) / 2), bb, hh);
    return c;
  }
  if (ICONS[name]) maleSprite(ctx, ICONS[name], 0, 0, ICON_PUNKTE / 16, null);
  return c;
}

/* ---------- Pflege ----------
   Jede Handlung geht durch diese eine Stelle: sie hebt Werte, weckt
   Bella nicht versehentlich und schreibt weg. */
async function pflegen({ satt = 0, sauber = 0, ausgeruht = 0, laune = 0, sagt }){
  const b = DATA.bella;
  b.satt = begrenzen(b.satt + satt);
  b.sauber = begrenzen(b.sauber + sauber);
  b.ausgeruht = begrenzen(b.ausgeruht + ausgeruht);
  b.laune = begrenzen(b.laune + laune);
  if (sagt) sagen(sagt);
  await persist();
  render();
}

/* ---------- Gespräche ----------
   Bella sagt etwas, du antwortest. Keine Antwort ist falsch; sie
   unterscheiden sich darin, was sie ihr gibt. */

const GESPRAECHE = [
  { id:'wetter', sagt:'Schau mal, wie das Licht heute steht.',
    antworten:[ {text:'Wunderschön.', laune:9}, {text:'Wollen wir raus?', laune:6, ausgeruht:3} ] },
  { id:'traum', sagt:'Ich hab geträumt, ich könnte fliegen.',
    antworten:[ {text:'Erzähl mehr!', laune:10}, {text:'Wohin bist du geflogen?', laune:8} ] },
  { id:'hunger', sagt:'Mein Bauch macht Geräusche.',
    antworten:[ {text:'Ich koch dir was.', laune:7}, {text:'Gleich, versprochen.', laune:3} ] },
  { id:'lied', sagt:'Kennst du ein Lied für heute?',
    antworten:[ {text:'Ich summ dir eins.', laune:11}, {text:'Sing du eins.', laune:8} ] },
  { id:'still', sagt:'Können wir einfach kurz still sein?',
    antworten:[ {text:'Klar.', laune:9, ausgeruht:4}, {text:'Ich bleib da.', laune:10} ] },
  { id:'kleid', sagt:'Steht mir das eigentlich?',
    antworten:[ {text:'Sehr.', laune:10}, {text:'Such dir was Neues aus!', laune:7} ] },
  { id:'vermisst', sagt:'Du warst lange weg.',
    antworten:[ {text:'Tut mir leid.', laune:8}, {text:'Jetzt bin ich da.', laune:11} ] },
  { id:'fenster', sagt:'Am Fenster sitzen ist auch schon was.',
    antworten:[ {text:'Finde ich auch.', laune:9}, {text:'Setz dich, ich auch.', laune:10} ] },
  { id:'plan', sagt:'Was machen wir heute?',
    antworten:[ {text:'Nichts. Ist erlaubt.', laune:8, ausgeruht:5}, {text:'Aufräumen!', laune:5, sauber:4} ] },
  { id:'regen', sagt:'Ich mag das Geräusch von Regen.',
    antworten:[ {text:'Ich auch.', laune:9}, {text:'Dann hören wir zu.', laune:10, ausgeruht:3} ] },
];

function naechstesGespraech(){
  const offen = GESPRAECHE.filter(g => !DATA.gesprochen.includes(g.id));
  const topf = offen.length ? offen : GESPRAECHE;
  return topf[Math.floor(Math.random() * topf.length)];
}

const AKTIVITAETEN = [
  { id:'musik',   name:'Musik hören',    laune:9,  ausgeruht:4, sagt:'Das ist mein Lieblingsstück!' },
  { id:'lesen',   name:'Vorlesen',       laune:8,  ausgeruht:7, sagt:'Lies noch ein Kapitel.' },
  { id:'schauen', name:'Fenster',        laune:6,  ausgeruht:6, sagt:'Da läuft eine Katze.' },
  { id:'tanzen',  name:'Tanzen',         laune:13, ausgeruht:-6, sagt:'Ich bin außer Puste!' },
];

/* ---------- Post ----------
   Geschenke kommen von selbst, wenn es Bella eine Weile gut geht. Das
   ist das Freischalten ohne Münzen: man pflegt nicht, um etwas zu
   bekommen, man bekommt etwas, weil man gepflegt hat. */

const POST_SCHWELLE = 70;

function alleGaben(){
  const gaben = [];
  Object.keys(KLEIDER).forEach(k => { if (!DATA.besitz.kleider.includes(k))
    gaben.push({ art:'kleid', was:k, text:'Ein Kleid in ' + KLEIDER[k].name + '!' }); });
  Object.keys(KLEIDUNG).forEach(k => { if (!DATA.besitz.stuecke.includes(k))
    gaben.push({ art:'stueck', was:k, text:'Ein neues Kleidungsstück: ' + KLEIDUNG[k].name + '.' }); });
  Object.keys(FRISUREN).forEach(k => { if (!DATA.besitz.frisuren.includes(k))
    gaben.push({ art:'frisur', was:k, text:'Eine neue Frisur: ' + FRISUREN[k].name + '.' }); });
  Object.keys(SCHUHE).forEach(k => { if (!DATA.besitz.schuhe.includes(k))
    gaben.push({ art:'schuh', was:k, text:'Schuhe: ' + SCHUHE[k].name + '.' }); });
  Object.keys(ACCESSOIRES).forEach(k => { if (!DATA.besitz.accessoires.includes(k))
    gaben.push({ art:'accessoire', was:k, text:'Ein Accessoire: ' + ACCESSOIRES[k].name + '.' }); });
  Object.keys(WANDFARBEN).forEach(k => { if (!DATA.besitz.waende.includes(k))
    gaben.push({ art:'wand', was:k, text:'Tapete in ' + WANDFARBEN[k].name + '.' }); });
  Object.keys(BODENFARBEN).forEach(k => { if (!DATA.besitz.boeden.includes(k))
    gaben.push({ art:'boden', was:k, text:'Ein Boden in ' + BODENFARBEN[k].name + '.' }); });
  Object.keys(BETTZEUG).forEach(k => { if (!DATA.besitz.bett.includes(k))
    gaben.push({ art:'bett', was:k, text:BETTZEUG[k].name + ' fürs Bett.' }); });
  Object.keys(WANDDEKO).forEach(k => { if (!DATA.besitz.wanddeko.includes(k))
    gaben.push({ art:'wanddeko', was:k, text:WANDDEKO[k].name + ' für die Wand.' }); });
  Object.keys(BADSPIELZEUG).forEach(k => { if (!DATA.besitz.bad.includes(k))
    gaben.push({ art:'bad', was:k, text:BADSPIELZEUG[k].name + ' für die Wanne.' }); });
  Object.keys(BADEZUSAETZE).forEach(k => { if (!DATA.besitz.zusaetze.includes(k))
    gaben.push({ art:'zusatz', was:k, text:'Badezusatz ' + BADEZUSAETZE[k].name + '.' }); });
  return gaben;
}

/* Alle sechs Stunden gut versorgt gibt einen Anlauf auf ein Geschenk. */
function postPruefen(vergangeneMinuten){
  if (gesamtwohl() < POST_SCHWELLE) return;
  const anlaeufe = Math.floor(Math.min(vergangeneMinuten, NACHHOLGRENZE * 60) / 360);
  for (let i = 0; i < anlaeufe; i++){
    if (DATA.post.length >= 3) break;
    const offen = alleGaben().filter(g => !DATA.post.some(p => p.art === g.art && p.was === g.was));
    /* Snacks kommen immer wieder, auch wenn schon alles freigeschaltet
       ist — sie sind Verbrauchsgut, kein Sammelstück. */
    if (!offen.length || Math.random() < .45){
      const namen = Object.keys(SNACKS);
      const sn = namen[Math.floor(Math.random() * namen.length)];
      DATA.post.push({ art:'snack', was:sn, text:'Ein Päckchen ' + SNACKS[sn].name + '.' });
      continue;
    }
    DATA.post.push(offen[Math.floor(Math.random() * offen.length)]);
  }
}

async function postAnnehmen(i){
  const p = DATA.post[i];
  if (!p) return;
  DATA.post.splice(i, 1);
  if (p.art === 'kleid' && !DATA.besitz.kleider.includes(p.was)) DATA.besitz.kleider.push(p.was);
  if (p.art === 'stueck' && !DATA.besitz.stuecke.includes(p.was))  DATA.besitz.stuecke.push(p.was);
  if (p.art === 'frisur' && !DATA.besitz.frisuren.includes(p.was)) DATA.besitz.frisuren.push(p.was);
  if (p.art === 'schuh' && !DATA.besitz.schuhe.includes(p.was)) DATA.besitz.schuhe.push(p.was);
  if (p.art === 'accessoire' && !DATA.besitz.accessoires.includes(p.was))
    DATA.besitz.accessoires.push(p.was);
  if (p.art === 'wand'  && !DATA.besitz.waende.includes(p.was))  DATA.besitz.waende.push(p.was);
  if (p.art === 'boden' && !DATA.besitz.boeden.includes(p.was))  DATA.besitz.boeden.push(p.was);
  if (p.art === 'bett'  && !DATA.besitz.bett.includes(p.was))    DATA.besitz.bett.push(p.was);
  if (p.art === 'wanddeko' && !DATA.besitz.wanddeko.includes(p.was)) DATA.besitz.wanddeko.push(p.was);
  if (p.art === 'bad'   && !DATA.besitz.bad.includes(p.was))     DATA.besitz.bad.push(p.was);
  if (p.art === 'zusatz'&& !DATA.besitz.zusaetze.includes(p.was))DATA.besitz.zusaetze.push(p.was);
  if (p.art === 'zutat') DATA.vorrat[p.was] = Math.min(99, (DATA.vorrat[p.was] || 0) + 3);
  if (p.art === 'snack') DATA.snacks[p.was] = Math.min(99, (DATA.snacks[p.was] || 0) + 2);
  await pflegen({ laune: 5, sagt: 'Oh! ' + p.text });
  if (state.offen === 'post') fensterPost();
}

/* ---------- Fenster ---------- */

function fensterOeffnen(titel, aufbau){
  const modal = document.getElementById('modal');
  const blatt = document.getElementById('modalblatt');
  blatt.textContent = '';
  blatt.appendChild(h('div', { class:'modalkopf' },
    h('h2', { text: titel }),
    h('button', { class:'schliessen', text:'X', 'aria-label':'Schließen', onclick: fensterSchliessen })));
  aufbau(blatt);
  modal.hidden = false;
  modal.onclick = ev => { if (ev.target === modal) fensterSchliessen(); };
}

function fensterSchliessen(){
  state.offen = null;
  state.platzieren = null;
  state.auswahl = [];
  document.getElementById('modal').hidden = true;
  render();
}

function fensterWerte(){
  state.offen = 'werte';
  fensterOeffnen('WIE GEHT ES ' + DATA.bella.name.toUpperCase() + '?', blatt => {
    const b = DATA.bella;
    [['Satt', b.satt], ['Sauber', b.sauber], ['Ausgeruht', b.ausgeruht], ['Laune', b.laune]]
      .forEach(([name, wert]) => {
        blatt.appendChild(h('div', { class:'wert' },
          h('span', { text: name }), h('span', { text: Math.round(wert) + '%' })));
        blatt.appendChild(h('div', { class:'balken' + (wert < 30 ? ' warn' : '') },
          h('i', { style:'width:' + Math.round(wert) + '%' })));
      });
    const tage = Math.max(0, Math.floor((Date.now() - new Date(b.geboren)) / 86400000));
    blatt.appendChild(h('div', { class:'leer',
      text: b.name + ' ist seit ' + tage + ' Tag' + (tage === 1 ? '' : 'en') + ' bei dir. '
          + 'Sie schläft von ' + DATA.zeiten.einschlafen + ' bis ' + DATA.zeiten.aufwachen + '.' }));
    blatt.appendChild(h('div', { class:'leer',
      text: 'Ihr kann nichts passieren. Wenn du lange nicht da bist, wird sie traurig — mehr nicht.' }));
  });
}

function fensterPost(){
  state.offen = 'post';
  fensterOeffnen('BRIEFKASTEN', blatt => {
    if (!DATA.post.length){
      blatt.appendChild(h('div', { class:'leer',
        text: 'Nichts da. Wenn es ' + DATA.bella.name + ' eine Weile gut geht, kommt etwas an.' }));
      return;
    }
    DATA.post.forEach((p, i) => {
      blatt.appendChild(h('div', { class:'block' },
        h('div', { class:'blockkopf', text: p.text }),
        h('button', { class:'taste haupt', text:'AUSPACKEN', onclick: () => postAnnehmen(i) })));
    });
  });
}

function fensterKochen(){
  state.offen = 'kochen';
  fensterOeffnen('KOCHEN', blatt => {
    blatt.appendChild(h('div', { class:'leer', text:'Zwei Zutaten aussuchen.' }));
    const gitter = h('div', { class:'gitter', id:'zutaten' });
    Object.entries(ZUTATEN).forEach(([id, z]) => {
      const da = DATA.vorrat[id] || 0;
      const an = state.auswahl.includes(id);
      gitter.appendChild(h('button', {
        class:'stueck' + (an ? ' an' : '') + (da ? '' : ' aus'),
        'data-zutat': id,
        disabled: da ? null : true,
        onclick: () => {
          if (!da) return;
          if (an) state.auswahl = state.auswahl.filter(x => x !== id);
          else if (state.auswahl.length < 2) state.auswahl = state.auswahl.concat(id);
          fensterKochen();
        },
      }, z.name, listenBild('zutat_' + id, KOCHZEUG['zutat_' + id], zutatFarbe(id)), 'x' + da));
    });
    blatt.appendChild(gitter);

    const r = state.auswahl.length === 2 ? rezeptFuer(state.auswahl[0], state.auswahl[1]) : null;
    blatt.appendChild(h('div', { class:'zeile' },
      h('button', {
        class:'taste haupt' + (r ? '' : ' aus'), id:'kochen',
        disabled: r ? null : true,
        text: r ? 'KOCHEN: ' + r.name.toUpperCase() : 'ZWEI ZUTATEN WÄHLEN',
        onclick: () => r && kochen(r),
      })));

    if (DATA.kochbuch.length){
      blatt.appendChild(h('div', { class:'block' },
        h('div', { class:'blockkopf', text:'KOCHBUCH ' + DATA.kochbuch.length + '/' + REZEPTE.length }),
        h('div', { class:'leer', text: DATA.kochbuch
          .map(id => REZEPTE.find(x => x.id === id).name).join(' · ') })));
    }
  });
}

function zutatFarbe(id){
  return { erdbeere:'#FF4FA3', milch:'#FFF8FF', mehl:'#FFD166',
           honig:'#FF9E3D', beere:'#A65CFF', ei:'#FFF06A' }[id] || '#FFF8FF';
}

async function kochen(r){
  if (DATA.bella.schlaeft){ sagen(DATA.bella.name + ' schläft.'); render(); return; }
  r.aus.forEach(z => { DATA.vorrat[z] = Math.max(0, (DATA.vorrat[z] || 0) - 1); });
  if (!DATA.kochbuch.includes(r.id)) DATA.kochbuch.push(r.id);
  state.auswahl = [];
  state.blase = null;
  fensterSchliessen();
  kochszeneStarten(r);
  await persist();
  render();
}

/* Am Ende der Essensbewegung wirkt das Gericht. Vorher wäre Bella
   satt, während sie noch die Zutaten vor sich liegen hat. */
/* Nach den beiden Karten geht es zurück in die Küche: dort isst sie,
   und erst danach zählt das Gericht. */
async function kochszeneAbschliessen(rezept){
  state.raum = 'kueche';
  DATA.bella.ort = 'kueche';
  state.essen = { rezept, bis: Date.now() + ESSEN_DAUER };
  await persist();
}

/* ---------- Abbrausen ----------
   Eine Hand mit dem Duschkopf fährt über Bella und wäscht den Schaum
   weg. Erst danach zählt das Bad. */
const DUSCHE_DAUER = 2200;

function duscheStarten(){
  state.dusche = { bis: Date.now() + DUSCHE_DAUER };
}

function duscheAnteil(){
  if (!state.dusche) return 0;
  const rest = state.dusche.bis - Date.now();
  return Math.max(0, Math.min(1, 1 - rest / DUSCHE_DAUER));
}

/* ---------- Planschen ----------
   Wie das Abbrausen eine Bewegung, kein Knopfdruck mit sofortiger
   Wirkung: Bella schlägt mit den Händen aufs Wasser, es spritzt, und
   erst wenn sie fertig ist, wirkt es auf ihre Werte. */
const PLANSCH_DAUER = 1900;
const PLANSCH_SCHLAEGE = 3;

function planschStarten(){
  state.plansch = { bis: Date.now() + PLANSCH_DAUER };
}

function planschAnteil(){
  if (!state.plansch) return 0;
  const rest = state.plansch.bis - Date.now();
  return Math.max(0, Math.min(1, 1 - rest / PLANSCH_DAUER));
}

/* Die Wanne ist von oben zu sehen: die ganze Ellipse ist Wasser, und
   Bella sitzt an ihrem oberen Rand. Die Hände gehören deshalb links und
   rechts **neben** sie, ein Stück weiter in die Wanne hinein — nicht auf
   die Höhe ihres Kopfes, dort wäre der Wannenrand.

   `w` ist das Maß der Wanne aus wanneMasse. */
function malePlanschen(ctx, s, w){
  const t = planschAnteil();
  // Drei Schläge nacheinander; `schlag` geht je Schlag von 0 bis 1.
  const takt = t * PLANSCH_SCHLAEGE;
  const schlag = takt % 1;
  // Die Hände heben sich und kommen herunter: unten ist der Aufschlag.
  const hoch = Math.sin(schlag * Math.PI) * 13;
  const spanne = w.rx * 0.34;
  const wasserY = w.my - w.ry * 0.42;          // im Wasser, unter Bella

  /* Beim Aufschlag laufen Ringe über das Wasser und Tropfen fliegen im
     Bogen weg. Kurz nach dem Aufschlag ist am meisten los. Die Ringe
     liegen unter den Händen, also zuerst. */
  const nachSchlag = schlag < 0.42 ? 0 : (schlag - 0.42) / 0.58;
  if (nachSchlag > 0){
    [-1, 1].forEach(seite => {
      const hx = w.mx + seite * spanne;
      for (let r = 0; r < 3; r++){
        const gross = 5 + nachSchlag * 22 + r * 6;
        if (gross > w.rx * 0.8) continue;
        const staerke = Math.max(0, 0.7 - nachSchlag * 0.5 - r * 0.15);
        ellipsenRing(ctx, s, hx, wasserY + 2, gross, gross * 0.4, 1.2,
                     'rgba(255,255,255,' + staerke.toFixed(2) + ')');
      }
    });
  }

  /* Die Tropfen: feste Bahnen je Schlag, damit sie nicht bei jedem Bild
     neu würfeln und flimmern. Die Wurfhöhe kommt aus der Parabel. */
  const zufall = streuFolge('plansch' + Math.floor(takt));
  for (let i = 0; i < 26; i++){
    const seite = i % 2 ? 1 : -1;
    const weite = (0.3 + zufall() * 0.7) * spanne * 1.6;
    const hoehe = 12 + zufall() * 22;
    const eigen = Math.min(1, nachSchlag + zufall() * 0.25);
    if (!(eigen > 0)) continue;
    const tx = w.mx + seite * (spanne * 0.5 + weite * eigen);
    const ty = wasserY - hoehe * 4 * eigen * (1 - eigen);
    if (Math.abs(tx - w.mx) > w.rx * 0.9) continue;
    px(ctx, s, tx, ty, 1.4, 3, 'rgba(240,250,255,.95)');
  }

  // Die Hände zuletzt, damit sie vor Ringen und Tropfen liegen.
  [-1, 1].forEach(seite => {
    const hx = w.mx + seite * spanne;
    const hy = wasserY - hoch;
    ellipse(ctx, s, hx, hy, 5, 4.5, HAUT.schatten);
    ellipse(ctx, s, hx, hy - 1, 4.2, 3.6, HAUT.flaeche);
    ellipse(ctx, s, hx - seite * 1.2, hy - 1.6, 2.6, 2, HAUT.licht);
    /* Der Arm, der aus Bellas Schulter dorthin führt. Dicht genug
       gesetzt, dass daraus ein Arm wird und keine Perlenkette. */
    const ax = w.mx + seite * 9, ay = w.my - w.ry + 14;
    const schritte = Math.max(8, Math.round(Math.abs(hx - ax) + Math.abs(hy - ay)));
    for (let k = 0; k <= schritte; k++){
      const p = k / schritte;
      ellipse(ctx, s, ax + (hx - ax) * p, ay + (hy - ay) * p, 3.4, 3,
              p > 0.5 ? HAUT.flaeche : HAUT.schatten);
    }
  });
}

function maleDusche(ctx, s, mx, kopfY){
  const t = duscheAnteil();
  // Die Hand wandert von links nach rechts und wieder zurück.
  const schwung = Math.sin(t * Math.PI * 2.5);
  const hx = Math.round(mx + schwung * 16);
  const hy = Math.round(kopfY - 20);
  maleFigur(ctx, s, 'hand_dusche', KOCHZEUG.hand_dusche, hx - 7, hy, null);

  // Der Strahl: Tropfen in Spalten unter dem Kopf.
  const tropfen = streuFolge('dusche');
  for (let i = 0; i < 26; i++){
    const dx = hx - 5 + Math.floor(tropfen() * 11);
    const dy = hy + 14 + Math.floor(tropfen() * 26);
    px(ctx, s, dx, dy, 1, 3, 'rgba(200,232,255,.85)');
  }
  // Schaumflocken, die weggespült werden.
  for (let i = 0; i < 8; i++){
    const fx = mx - 14 + Math.floor(tropfen() * 28);
    const fy = kopfY + 6 + Math.round(t * 22) + Math.floor(tropfen() * 6);
    ellipse(ctx, s, fx, fy, 2, 2, 'rgba(255,255,255,' + (1 - t).toFixed(2) + ')');
  }
}

function fensterReden(){
  state.offen = 'reden';
  const g = state.gespraech || (state.gespraech = naechstesGespraech());
  fensterOeffnen('REDEN', blatt => {
    blatt.appendChild(h('div', { class:'block' }, h('div', { class:'blockkopf', text: g.sagt })));
    g.antworten.forEach(a => {
      blatt.appendChild(h('div', { class:'zeile' },
        h('button', { class:'taste haupt', text: a.text, onclick: async () => {
          if (!DATA.gesprochen.includes(g.id)) DATA.gesprochen.push(g.id);
          DATA.gesprochen = DATA.gesprochen.slice(-40);
          state.gespraech = null;
          fensterSchliessen();
          await pflegen({ laune: a.laune || 0, ausgeruht: a.ausgeruht || 0,
                          sauber: a.sauber || 0, sagt: 'Schön, dass du da bist.' });
        } })));
    });
  });
}

function fensterEinstellungen(){
  state.offen = 'einstellungen';
  fensterOeffnen('EINSTELLUNGEN', blatt => {
    const name = h('input', { id:'namefeld', maxlength:'14', value: DATA.bella.name });
    name.onchange = async () => {
      DATA.bella.name = (name.value || '').trim().slice(0, 14) || 'Bella';
      await persist(); render();
    };
    blatt.appendChild(h('div', { class:'feld' }, h('label', { text:'NAME' }), name));

    [['einschlafen', 'SCHLÄFT EIN UM'], ['aufwachen', 'WACHT AUF UM']].forEach(([k, be]) => {
      const f = h('input', { id: k + 'feld', type:'time', value: DATA.zeiten[k] });
      f.onchange = async () => {
        DATA.zeiten[k] = uhrzeit(f.value, DATA.zeiten[k]);
        f.value = DATA.zeiten[k];
        DATA.bella.schlaeft = istSchlafzeit(new Date());
        await persist(); render();
      };
      blatt.appendChild(h('div', { class:'feld' }, h('label', { text: be }), f));
    });

    blatt.appendChild(h('div', { class:'leer',
      text:'Voreingestellt ist 02:30 bis 10:30 — ' + DATA.bella.name + ' ist eine Nachteule.' }));

    blatt.appendChild(h('div', { class:'block' },
      h('div', { class:'blockkopf', text:'ERINNERUNGEN' }),
      h('button', {
        class:'taste' + (DATA.erinnerungen ? ' haupt' : ''), id:'erinnerungbtn',
        text: DATA.erinnerungen ? 'AN' : 'AUS',
        onclick: async () => {
          const an = await erinnerungenSchalten(!DATA.erinnerungen);
          fensterEinstellungen();
          if (!an && !meldedienst()) sagen('Erinnerungen gibt es nur in der Handy-App.');
        },
      }),
      h('div', { class:'leer', text: DATA.erinnerungen
        ? 'Höchstens vier Meldungen: Hunger, Badezeit, Aufwachen und wenn drei Tage niemand da war. '
          + 'Nie in ' + DATA.bella.name + 's Nacht.'
        : 'Aus. ' + DATA.bella.name + ' meldet sich nicht von selbst.' })));
  });
}

/* ---------- Die Tasten am Gerät, je Raum ---------- */

function tastenFuer(raum){
  const b = DATA.bella;
  if (state.szene) return [ taste('WEITER', szeneWeiter, 'haupt breit') ];
  if (state.dusche || state.essen || state.plansch) return [ taste('…', () => {}, 'aus breit') ];

  const schlaeft = b.schlaeft;
  const daheim = b.ort === raum;
  /* Was Bella braucht, geht nur, wenn sie da ist — und nicht, während
     sie schläft. Statt dessen steht der Ruf-Knopf da. */
  const braucht = (text, bei, art) => {
    if (!daheim) return taste(text, () => {
      sagen(b.name + ' ist nicht hier. Ruf sie.'); render();
    }, 'aus');
    if (schlaeft) return taste(text, () => {
      sagen(b.name + ' schläft.'); render();
    }, 'aus');
    return taste(text, bei, art);
  };
  const ruf = rufKnopf();

  if (raum === 'schlaf'){
    return [
      ruf,
      schlaeft
        ? taste('AUFWECKEN', async () => {
            // Wecken ist erlaubt, kostet aber Laune — sonst wäre der
            // Schlafrhythmus eine Zierde ohne Gewicht.
            DATA.zeiten.aufwachen = jetztAlsUhrzeit();
            b.schlaeft = false;
            await pflegen({ laune: -6, sagt: 'Hm… schon Morgen?' });
          }, 'haupt')
        : taste('SCHLAFEN', () => {
            sagen(b.name + ' schläft von selbst um ' + DATA.zeiten.einschlafen + '.'); render();
          }),
      daheim ? taste(b.zugedeckt ? 'AUFDECKEN' : 'ZUDECKEN', async () => {
        b.zugedeckt = !b.zugedeckt;
        await pflegen({ ausgeruht: b.zugedeckt ? 6 : 0, laune: b.zugedeckt ? 5 : -1,
                        sagt: b.zugedeckt ? (schlaeft ? '…' : 'Mmh, warm.') : 'Ah, Luft!' });
      }, b.zugedeckt ? '' : 'haupt') : null,
      /* Der Schalter schaltet wirklich: die Nische wird dunkel, nur
         Fenster und Lichterkette bleiben stehen, und im Dunkeln erholt
         sie sich schneller. */
      taste(lichtAn() ? 'LICHT AUS' : 'LICHT AN', async () => {
        DATA.raeume.schlaf.licht = !lichtAn();
        await pflegen({ ausgeruht: lichtAn() ? 0 : 4, laune: lichtAn() ? 1 : 2,
          sagt: schlaeft ? '…' : (lichtAn() ? 'Heller!' : 'Gute Nacht.') });
      }, lichtAn() ? '' : 'haupt'),
    ].filter(Boolean);
  }

  if (raum === 'kueche'){
    return [
      ruf,
      // Kochen geht auch ohne sie — gegessen wird, sobald sie da ist.
      taste('KOCHEN', fensterKochen, 'haupt'),
      braucht('SNACK' + (snacksDa() ? ' (' + snacksDa() + ')' : ''),
        snacksDa() ? fensterSnacks
          : () => { sagen('Keine Snacks da. Die kommen mit der Post.'); render(); },
        snacksDa() ? '' : 'aus'),
      taste(bestellRest() ? 'BESTELLEN' : 'HEUTE VOLL',
        bestellRest() ? fensterBestellen
          : () => { sagen('Heute schon ' + TAGESMENGE + ' Zutaten bestellt. Morgen wieder.'); render(); },
        bestellRest() ? '' : 'aus'),
    ].filter(Boolean);
  }

  if (raum === 'wohnen'){
    return [
      ruf,
      braucht('REDEN', fensterReden, 'haupt'),
      ...AKTIVITAETEN.slice(0, 2).map(a => braucht(a.name.toUpperCase(),
        () => pflegen({ laune:a.laune, ausgeruht:a.ausgeruht, sagt:a.sagt }))),
    ].filter(Boolean);
  }

  if (raum === 'bad'){
    /* Nur baden: einschäumen und abbrausen, in dieser Reihenfolge.
       Zähneputzen und Haarewaschen als eigene Knöpfe daneben machten aus
       der Wanne eine Knopfsammlung. */
    return [
      ruf,
      state.schaum
        ? braucht('ABBRAUSEN', () => { duscheStarten(); render(); }, 'haupt')
        : braucht('EINSCHÄUMEN', async () => {
            state.schaum = true;
            await pflegen({ laune: 6, sagt: 'Kitzelt!' });
          }, 'haupt'),
      taste('BADEZUSATZ', fensterBadezusatz),
      braucht('PLANSCHEN', () => { planschStarten(); render(); }),
    ].filter(Boolean);
  }

  return [
    ruf,
    braucht('ANZIEHEN', fensterAnziehen, 'haupt'),
    ...AKTIVITAETEN.slice(2, 4).map(a => braucht(a.name.toUpperCase(),
      () => pflegen({ laune:a.laune, ausgeruht:a.ausgeruht, sagt:a.sagt }))),
  ].filter(Boolean);
}

async function szeneWeiter(){
  const sz = state.szene;
  if (!sz) return;
  const rezept = sz.rezept;
  if (kochszeneWeiter()) await kochszeneAbschliessen(rezept);
  render();
}

/* Läuft eine Szene, das Essen oder die Dusche ab? Wird jeden Takt
   geprüft; jedes davon endet für sich. */
async function zeitgesteuertes(){
  if (state.szene && Date.now() >= state.szene.bis){
    await szeneWeiter();
    return true;
  }
  if (state.essen && Date.now() >= state.essen.bis){
    const r = state.essen.rezept;
    state.essen = null;
    await pflegen({ satt: r.satt, laune: r.laune, sagt: r.name + '! Danke.' });
    return true;
  }
  if (state.dusche && Date.now() >= state.dusche.bis){
    state.dusche = null;
    state.schaum = false;
    await pflegen({ sauber: 46, laune: 9, sagt: 'Blitzeblank!' });
    return true;
  }
  if (state.plansch && Date.now() >= state.plansch.bis){
    state.plansch = null;
    await pflegen({ laune: 8, sauber: 4, sagt: 'Platsch!' });
    return true;
  }
  return false;
}

/* In jedem Zimmer lässt sich Bella rufen. Schläft sie, kommt sie
   nicht — das ist der Sinn des Schlafrhythmus. */
function rufKnopf(){
  const b = DATA.bella;
  if (b.ort === state.raum) return null;
  if (b.schlaeft) return taste('RUFEN', () => {
    sagen(b.name + ' schläft und kommt nicht.');
    render();
  }, 'aus');
  return taste('RUFEN', async () => {
    b.ort = state.raum;
    await pflegen({ laune: 2, sagt: 'Ich komm!' });
  }, 'haupt');
}

function lieferText(){
  const offen = DATA.bestellung || [];
  if (!offen.length) return 'Nichts bestellt.';
  const stueck = offen.reduce((n, b) =>
    n + Object.values(b.waren).reduce((m, x) => m + x, 0), 0);
  return stueck + ' Zutat' + (stueck === 1 ? '' : 'en') + ' kommen morgen um '
       + LIEFERSTUNDE + ':00.';
}

function jetztAlsUhrzeit(){
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

/* ---------- Die Fläche unter dem Gerät ---------- */

function waehler(titel, eintraege, istAn, beiWahl){
  const block = h('div', { class:'block' }, h('div', { class:'blockkopf', text: titel }));
  const gitter = h('div', { class:'gitter' });
  eintraege.forEach(e => {
    gitter.appendChild(h('button', {
      class:'stueck' + (istAn(e.id) ? ' an' : ''), 'data-wahl': e.id,
      onclick: () => beiWahl(e.id),
    }, e.farbe ? h('span', { class:'farbe', style:'background:' + e.farbe }) : null, e.name));
  });
  block.appendChild(gitter);
  return block;
}

/* Unter den Tasten steht nur, was zum Raum gehört und was man ständig
   sehen will. Alles Gestalterische liegt hinter dem Stift oben rechts —
   sonst stünde unter jedem Zimmer dreimal dieselbe Farbtafel. */
function extraFuer(raum){
  if (raum !== 'kueche') return [];
  const vorrat = h('div', { class:'gitter' });
  Object.entries(ZUTATEN).forEach(([id, z]) => {
    vorrat.appendChild(h('div', { class:'stueck' + ((DATA.vorrat[id] || 0) ? '' : ' aus') },
      listenBild('zutat_' + id, KOCHZEUG['zutat_' + id], zutatFarbe(id)),
      z.name, h('br'), 'x' + (DATA.vorrat[id] || 0)));
  });
  return [h('div', { class:'block', id:'vorratblock' },
    h('div', { class:'blockkopf', text:'VORRAT' }), vorrat,
    h('div', { class:'leer', text: (DATA.bestellung ? lieferText() + ' ' : '')
      + 'Heute noch ' + bestellRest() + ' von ' + TAGESMENGE + ' Zutaten frei.' }))];
}

/* ---------- Fenster hinter den Kopfknöpfen ---------- */

function fensterEinrichten(){
  state.offen = 'einrichten';
  const r = DATA.raeume[state.raum];
  fensterOeffnen('EINRICHTEN — ' + RAUMNAME[state.raum].toUpperCase(), blatt => {
    if (state.raum === 'schlaf' || state.raum === 'bad'){
      const katalog = state.raum === 'schlaf' ? BETTZEUG : BADSPIELZEUG;
      const besitz = state.raum === 'schlaf' ? DATA.besitz.bett : DATA.besitz.bad;
      const wohin = state.raum === 'schlaf' ? 'aufs Bett' : 'auf den Wannenrand';
      blatt.appendChild(waehler('HÖCHSTENS DREI ' + wohin.toUpperCase(),
        besitz.map(id => ({ id, name: katalog[id].name })),
        id => r.deko.includes(id),
        async id => {
          if (r.deko.includes(id)) r.deko = r.deko.filter(x => x !== id);
          else if (r.deko.length < 3) r.deko = r.deko.concat(id);
          else r.deko = r.deko.slice(1).concat(id);   // das Älteste weicht
          await persist(); fensterEinrichten(); render();
        }));
      if (!besitz.length) blatt.appendChild(h('div', { class:'leer',
        text:'Noch nichts da — kommt mit der Post.' }));
    }
    /* Im Schlafzimmer kommt die Wand dazu: Lichterketten, Girlanden,
       Bilder, Traumfänger, Wandregale. Getrennt vom Bettzeug, weil es an
       einer anderen Stelle hängt und nicht dieselben drei Plätze
       belegt. */
    if (state.raum === 'schlaf'){
      r.wanddeko = r.wanddeko || [];
      blatt.appendChild(waehler('HÖCHSTENS ' + WANDDEKO_MAX + ' AN DIE WAND',
        DATA.besitz.wanddeko.map(id => ({ id, name: WANDDEKO[id].name })),
        id => r.wanddeko.includes(id),
        async id => {
          if (r.wanddeko.includes(id)) r.wanddeko = r.wanddeko.filter(x => x !== id);
          else if (r.wanddeko.length < WANDDEKO_MAX) r.wanddeko = r.wanddeko.concat(id);
          else r.wanddeko = r.wanddeko.slice(1).concat(id);
          await persist(); fensterEinrichten(); render();
        }));
      if (!DATA.besitz.wanddeko.length) blatt.appendChild(h('div', { class:'leer',
        text:'Noch keine Wanddeko — kommt mit der Post.' }));
    }
    blatt.appendChild(h('div', { class:'zeile' },
      h('button', { class:'taste haupt breit', id:'platzierenbtn', text:'GENAU PLATZIEREN',
                    onclick: fensterPlatzieren })));
    blatt.appendChild(waehler('TAPETE',
      DATA.besitz.waende.map(id => ({ id, name: WANDFARBEN[id].name, farbe: WANDFARBEN[id].farben[1] })),
      id => r.wand === id,
      async id => { r.wand = id; await persist(); fensterEinrichten(); render(); }));
    blatt.appendChild(waehler('MUSTER',
      ['wand_streifen','wand_punkte','wand_karo','wand_herzen'].map(id => ({
        id, name: { wand_streifen:'Streifen', wand_punkte:'Punkte', wand_karo:'Karo', wand_herzen:'Herzen' }[id],
        farbe: WANDFARBEN[r.wand].farben[2] })),
      id => r.wandmuster === id,
      async id => { r.wandmuster = id; await persist(); fensterEinrichten(); render(); }));
    blatt.appendChild(waehler('BODEN',
      DATA.besitz.boeden.map(id => ({ id, name: BODENFARBEN[id].name, farbe: BODENFARBEN[id].farben[0] })),
      id => r.boden === id,
      async id => { r.boden = id; await persist(); fensterEinrichten(); render(); }));
  });
}

/* ---------- Genau platzieren ----------
   Ein Gegenstand wird gewählt, dann tippt man auf die Bühne: dorthin
   kommt seine Unterkante, mittig unter den Finger. Die Pfeile schieben
   um einen Zentimeter. Alles in Zentimetern, weil das die Einheit ist,
   in der die Welt gemessen wird.

   Die Zahlen lassen sich ausgeben — so kannst du sie mir schicken, und
   ich trage sie fest ein. */

function dingeImRaum(raum){
  const liste = (EINRICHTUNG[raum] || []).map(m => ({ name: m.s, sprite: MOEBEL[m.s] }));
  if (raum === 'kueche') liste.push({ name: 'deko_pflanze', sprite: null });
  /* Im Schlafzimmer hängt Wanddeko, und in beiden Nahansichten gibt es
     eine Zone — die Liegefläche und die Wasserfläche. Beides lässt sich
     genauso verschieben wie ein Möbelstück. */
  if (raum === 'schlaf')
    (DATA.raeume.schlaf.wanddeko || []).forEach(id => liste.push({ name: id, sprite: null }));
  /* Kissen, Kuscheltiere und Badespielzeug auch: bei einer selbst
     gemalten Wanne oder einem gemalten Bett sitzt meine Vorgabe sonst
     auf einem Rand, den es dort gar nicht gibt. */
  ((DATA.raeume[raum] || {}).deko || []).forEach(id =>
    liste.push({ name: id, sprite: KLEINKRAM[id] }));
  if (raum === 'bad') liste.push({ name: 'sp_kerze', sprite: KLEINKRAM.sp_kerze });
  Object.keys(ZONEN[raum] || {}).forEach(id => liste.push({ name: id, sprite: null, zone: true }));
  return liste;
}

function platzVon(raum, name, s){
  const eigen = eigenerPlatz(raum, name);
  if (eigen) return eigen;
  /* Wanddeko hängt in der Nische, nicht im Zimmer: ihre Vorgabestelle
     rechnet sich aus dem Bogen, und die Stücke verteilen sich über die
     Breite, damit nicht alle übereinander hängen. */
  const wd = WANDDEKO[name];
  if (wd) return wanddekoVorgabe(name, wd, s);
  if (ZONEN[raum] && ZONEN[raum][name]) return zonenVorgabe(raum, name, s);
  if (KLEINKRAM[name] && (raum === 'schlaf' || raum === 'bad'))
    return kleinkramVorgabe(raum, name, s);
  const bodenY = s.h - bodenbandCm(s);
  const m = (EINRICHTUNG[raum] || []).find(x => x.s === name);
  if (m) return platzierenCm(m, s, bodenY, raum);
  return { x: s.b - breiteCm(name, null) - 30, unten: bodenY + 2 };
}

/* Wo ein Stück Wanddeko hängt, solange es nicht verschoben wurde.

   Oben in der Nische ist kein Platz: dort sind schon Fenster, Regal und
   die eingebaute Lichterkette. Frei ist der Streifen zwischen der
   Fensterunterkante und der Bettoberkante — dort hängt in einem
   Schlafzimmer ohnehin, was über dem Bett hängt. Breites geht quer über
   den Bogen, wo es nichts verdeckt. */
function wanddekoVorgabe(name, wd, s){
  return wanddekoPlaetze(s)[name] || { x: 0, unten: 0 };
}

/* Alle Vorgabestellen auf einmal, und zwar so, dass sich nichts deckt.

   Feste Plätze reichen nicht: die Nische ist eng, die Stücke sind
   verschieden breit, und bei vier gleichzeitig lag immer eines über dem
   anderen. Deshalb bekommt jedes seinen Wunschplatz und weicht nach
   unten aus, bis es frei steht. Das Ergebnis hängt nur an der Auswahl,
   nicht am Zufall — dieselbe Auswahl gibt immer dasselbe Bild. */
function wanddekoPlaetze(s){
  const n = nischeMasse(s);
  const bettOben = (n.unten - 12) - Math.max(12, Math.round(s.h * 0.085));
  const gewaehlt = (DATA.raeume.schlaf.wanddeko || []).filter(id => WANDDEKO[id]);

  /* Breites zuerst und weit oben, Schmales darunter — sonst schiebt sich
     eine 150 cm lange Kette zwischen zwei Bilder. */
  const reihenfolge = gewaehlt.slice().sort((a, b) =>
    (WANDDEKO[b].breit ? 1 : 0) - (WANDDEKO[a].breit ? 1 : 0));

  const gesetzt = [];
  const ergebnis = {};
  reihenfolge.forEach(id => {
    const breit = breiteCm(id, null), hoch = groesseCm(id) || 30;
    /* Gesucht wird die erste freie Stelle in einem Raster über die
       ganze Nische — beide Achsen, nicht nur ein paar feste Spalten.
       Mit festen Spalten gab es immer eine Auswahl, für die keine
       davon passte.

       Links oben ist das Fenster, dort darf nichts hängen; rechts ist
       die Wand frei, seit das eingebaute Regal der eigenen Deko weicht.
       Bevorzugt wird weit oben und weit außen; die Deckelung am Bett
       steckt schon im Raster, sonst zöge sie ein ausgewichenes Stück
       wieder ins Besetzte zurück. */
    const yBis = bettOben - hoch - 2;
    const xMitte = n.mx - breit / 2;
    const kandidaten = [];
    if (WANDDEKO[id].breit){
      for (let y = n.my - n.ry * 0.88; y <= yBis; y += 6) kandidaten.push({ x: xMitte, y });
    } else {
      const fensterRechts = n.mx - n.rx * 0.04;   // rechte Kante des Fensters
      const fensterUnten  = n.my + n.ry * 0.16;
      for (let y = n.my - n.ry * 0.74; y <= yBis; y += 6){
        const reihe = [];
        for (let x = n.links + 2; x + breit <= n.rechts - 2; x += 3){
          // Über dem Fenster hängt nichts.
          if (y < fensterUnten && x < fensterRechts) continue;
          reihe.push({ x, y, aussen: Math.abs(x + breit / 2 - n.mx) });
        }
        // In jeder Reihe zuerst weit außen: dort stört es am wenigsten.
        reihe.sort((p1, p2) => p2.aussen - p1.aussen);
        kandidaten.push(...reihe);
      }
    }
    /* Genommen wird die erste ganz freie Stelle. Findet sich keine — die
       Nische ist klein, drei große Stücke füllen sie —, dann die mit der
       kleinsten Überdeckung, statt blind in die Mitte zu legen. */
    const deckung = k => gesetzt.reduce((summe, g) => summe
      + Math.max(0, Math.min(k.x + breit, g.x + g.b) - Math.max(k.x, g.x))
      * Math.max(0, Math.min(k.y + hoch, g.y + g.h) - Math.max(k.y, g.y)), 0);
    let p = null, beste = Infinity;
    for (const k of kandidaten){
      const d = deckung(k);
      if (d === 0){ p = k; break; }
      if (d < beste){ beste = d; p = k; }
    }
    if (!p) p = { x: xMitte, y: Math.max(0, yBis) };
    gesetzt.push({ x: p.x, y: p.y, b: breit, h: hoch, breit: !!WANDDEKO[id].breit });
    ergebnis[id] = { x: p.x, unten: p.y + hoch };
  });
  return ergebnis;
}

/* Wo Kissen, Kuscheltiere und Badespielzeug liegen, solange sie nicht
   verschoben wurden — dieselbe Stelle, die die Szene ohne eigene Werte
   zeichnet. */
function kleinkramVorgabe(raum, name, s){
  const breit = breiteCm(name, KLEINKRAM[name]);
  if (raum === 'bad'){
    const w = wanneMasse(s);
    const wasser = zone('bad', 'zone_wasser', zonenVorgabe('bad', 'zone_wasser', s));
    const wmx = wasser.x + wasser.b / 2, wry = wasser.h / 2;
    const rand = ['sp_kerze'].concat((DATA.raeume.bad.deko || []).slice(0, 3));
    const i = Math.max(0, rand.indexOf(name));
    const PLATZ = [-0.86, -0.58, 0.58, 0.86];
    const x = wmx + PLATZ[i % PLATZ.length] * (wasser.b / 2) - breit / 2;
    return { x, unten: wasser.unten - wasser.h / 2 - wry * 0.55 };
  }
  const n = nischeMasse(s);
  const bettUnten = n.unten - 12, bettRx = n.rx - 6;
  const matratzeHoch = Math.max(12, Math.round(s.h * 0.085));
  const liste = (DATA.raeume.schlaf.deko || []);
  const i = Math.max(0, liste.indexOf(name));
  return { x: n.mx + bettRx - 10 - (i + 1) * (breit + 5),
           unten: bettUnten - matratzeHoch + 4 };
}

/* Wo eine Zone liegt, wenn sie noch nicht verschoben wurde: genau da,
   wo die gezeichnete Fassung sie hat. */
function zonenVorgabe(raum, name, s){
  if (name === 'zone_liege'){
    const n = nischeMasse(s);
    const bettUnten = n.unten - 12, bettRx = n.rx - 6;
    const matratzeHoch = Math.max(12, Math.round(s.h * 0.085));
    return { x: n.mx - bettRx + 6, unten: bettUnten - matratzeHoch,
             b: bettRx * 2 - 12, h: 46 };
  }
  if (name === 'zone_wasser'){
    const w = wanneMasse(s);
    return { x: w.mx - w.rx + 14, unten: w.my + w.ry - 12,
             b: (w.rx - 14) * 2, h: (w.ry - 12) * 2 };
  }
  return { x: 0, unten: 0, b: 40, h: 40 };
}

async function zoneSetzen(name, b, h){
  if (!zoneDa(name)) return;
  DATA.zonen = DATA.zonen || {};
  DATA.zonen[name] = { b: Math.max(10, Math.round(b)), h: Math.max(10, Math.round(h)) };
  await persist();
  render();
}

async function platzSetzen(raum, name, x, unten){
  if (!DATA.plaetze[raum]) DATA.plaetze[raum] = {};
  DATA.plaetze[raum][name] = { x: Math.round(x * 10) / 10, unten: Math.round(unten * 10) / 10 };
  await persist();
  render();
}

function buehneAngetippt(ev){
  if (!state.platzieren) return;
  const c = document.getElementById('bild');
  const kasten = c.getBoundingClientRect();
  const s = buehneMasse();
  // Vom Bildschirmpunkt zum Zentimeter.
  const xCm = (ev.clientX - kasten.left) / kasten.width * s.b;
  const yCm = (ev.clientY - kasten.top) / kasten.height * s.h;
  const name = state.platzieren.was;
  const b = breiteCm(name, MOEBEL[name] || null);
  platzSetzen(state.raum, name, xCm - b / 2, yCm);
}

function fensterPlatzieren(){
  state.offen = 'platzieren';
  const raum = state.raum;
  const dinge = dingeImRaum(raum);
  if (!dinge.length){
    fensterOeffnen('GENAU PLATZIEREN', blatt => {
      blatt.appendChild(h('div', { class:'leer',
        text:'In diesem Raum steht nichts, was sich verschieben ließe.' }));
    });
    return;
  }
  if (!state.platzieren) state.platzieren = { was: dinge[0].name };

  fensterOeffnen('GENAU PLATZIEREN', blatt => {
    blatt.appendChild(h('div', { class:'leer',
      text:'Gegenstand wählen, dann auf das Bild tippen — dorthin kommt seine Unterkante.' }));
    blatt.appendChild(waehler('WAS',
      dinge.map(d => ({ id: d.name, name: d.name })),
      id => state.platzieren.was === id,
      id => { state.platzieren = { was: id }; fensterPlatzieren(); render(); }));

    const s = buehneMasse();
    const was = state.platzieren.was;
    const p = platzVon(raum, was, s);
    const istZone = zoneDa(was);
    const masse = istZone ? zone(raum, was, zonenVorgabe(raum, was, s)) : null;
    blatt.appendChild(h('div', { class:'block' },
      h('div', { class:'blockkopf', id:'platzwert',
                 text: 'x ' + p.x.toFixed(1) + ' cm · unten ' + p.unten.toFixed(1) + ' cm'
                     + (istZone ? ' · ' + masse.b.toFixed(0) + ' × ' + masse.h.toFixed(0) + ' cm' : '') }),
      h('div', { class:'zeile' },
        ...[['←', -1, 0], ['→', 1, 0], ['↑', 0, -1], ['↓', 0, 1]].map(([z, dx, dy]) =>
          h('button', { class:'taste', text: z, 'data-schieb': z, onclick: async () => {
            const jetzt = platzVon(raum, was, buehneMasse());
            await platzSetzen(raum, was, jetzt.x + dx, jetzt.unten + dy);
            fensterPlatzieren();
          } })))));

    /* Eine Zone hat außer der Stelle auch eine Größe. Die braucht nur,
       wer Bett oder Wanne selbst gemalt hat — deshalb stehen diese
       Knöpfe nur bei einer Zone da. */
    if (istZone){
      blatt.appendChild(h('div', { class:'block' },
        h('div', { class:'blockkopf', text:'GRÖSSE DER FLÄCHE' }),
        h('div', { class:'zeile' },
          ...[['BREITER', 2, 0], ['SCHMALER', -2, 0], ['HÖHER', 0, 2], ['FLACHER', 0, -2]]
            .map(([z, db, dh]) =>
              h('button', { class:'taste', text: z, 'data-groesse': z, onclick: async () => {
                const jetzt = zone(raum, was, zonenVorgabe(raum, was, buehneMasse()));
                await zoneSetzen(was, jetzt.b + db, jetzt.h + dh);
                fensterPlatzieren();
              } })))));
    }

    blatt.appendChild(h('div', { class:'zeile' },
      h('button', { class:'taste', id:'platzzurueck', text:'ZURÜCKSETZEN', onclick: async () => {
        if (DATA.plaetze[raum]) delete DATA.plaetze[raum][state.platzieren.was];
        if (DATA.zonen) delete DATA.zonen[state.platzieren.was];
        await persist(); fensterPlatzieren(); render();
      } }),
      h('button', { class:'taste haupt', id:'platzausgeben', text:'ZAHLEN ZEIGEN', onclick: () => {
        const feld = document.getElementById('platzausgabe');
        if (feld) feld.textContent =
          JSON.stringify({ plaetze: DATA.plaetze, zonen: DATA.zonen }, null, 1);
      } })));
    blatt.appendChild(h('pre', { class:'ausgabe', id:'platzausgabe',
      text:'Hier erscheinen die Zahlen zum Weitergeben.' }));
  });
}

function fensterAnziehen(){
  state.offen = 'anziehen';
  fensterOeffnen('ANZIEHEN', blatt => {
    blatt.appendChild(waehler('KLEIDUNGSSTÜCK',
      DATA.besitz.stuecke.map(id => ({ id, name: KLEIDUNG[id].name })),
      id => DATA.outfit.stueck === id,
      async id => { DATA.outfit.stueck = id;
                    await pflegen({ laune: 3, sagt: KLEIDUNG[id].name + '! Steht mir, oder?' });
                    fensterAnziehen(); }));
    blatt.appendChild(waehler('STOFF',
      DATA.besitz.kleider.map(id => ({ id, name: KLEIDER[id].name, farbe: KLEIDER[id].farben[1] })),
      id => DATA.outfit.farbe === id,
      async id => { DATA.outfit.farbe = id; await pflegen({ laune: 2, sagt: 'Schöne Farbe.' });
                    fensterAnziehen(); }));
    blatt.appendChild(waehler('FRISUR',
      DATA.besitz.frisuren.map(id => ({ id, name: FRISUREN[id].name })),
      id => DATA.outfit.frisur === id,
      async id => { DATA.outfit.frisur = id; await pflegen({ laune: 3, sagt: 'Neue Frisur!' });
                    fensterAnziehen(); }));
    blatt.appendChild(waehler('SCHUHE',
      DATA.besitz.schuhe.map(id => ({ id, name: SCHUHE[id].name })),
      id => DATA.outfit.schuhe === id,
      async id => { DATA.outfit.schuhe = id;
                    await pflegen({ laune: 2, sagt: SCHUHE[id].name + '!' });
                    fensterAnziehen(); }));
    blatt.appendChild(waehler('ACCESSOIRE',
      DATA.besitz.accessoires.map(id => ({ id, name: ACCESSOIRES[id].name })),
      id => DATA.outfit.accessoire === id,
      async id => { DATA.outfit.accessoire = id;
                    await pflegen({ laune: 3, sagt: id === 'acc_keins' ? 'Ohne, lieber.'
                                                                        : ACCESSOIRES[id].name + '!' });
                    fensterAnziehen(); }));
    blatt.appendChild(h('div', { class:'leer',
      text:'Die Haarfarbe gehört zu ' + DATA.bella.name + ' — die bleibt.' }));
  });
}

function fensterBadezusatz(){
  state.offen = 'badezusatz';
  fensterOeffnen('BADEZUSATZ', blatt => {
    blatt.appendChild(waehler('INS WASSER',
      DATA.besitz.zusaetze.map(id => ({ id, name: BADEZUSAETZE[id].name,
                                        farbe: BADEZUSAETZE[id].wasser[1] })),
      id => DATA.bad.zusatz === id,
      async id => {
        DATA.bad.zusatz = id;
        await pflegen({ laune: 4, sagt: BADEZUSAETZE[id].name + ' — riecht gut!' });
        fensterBadezusatz();
      }));
    blatt.appendChild(h('div', { class:'leer',
      text:'Mehr Zusätze und Badespielzeug kommen mit der Post.' }));
  });
}

function snacksDa(){
  return Object.values(DATA.snacks).reduce((n, x) => n + x, 0);
}

function fensterSnacks(){
  state.offen = 'snacks';
  fensterOeffnen('SNACKS', blatt => {
    const gitter = h('div', { class:'gitter', id:'snackgitter' });
    let etwas = false;
    Object.entries(SNACKS).forEach(([id, sn]) => {
      const da = DATA.snacks[id] || 0;
      if (!da) return;
      etwas = true;
      gitter.appendChild(h('button', {
        class:'stueck', 'data-snack': id,
        onclick: () => snackEssen(id),
      }, listenBild('snack_' + id, null, sn.farbe),
         sn.name, h('br'), 'x' + da));
    });
    if (!etwas){
      blatt.appendChild(h('div', { class:'leer',
        text:'Nichts da. Snacks kommen fertig mit der Post — kochen musst du sie nicht.' }));
      return;
    }
    blatt.appendChild(gitter);
    blatt.appendChild(h('div', { class:'leer',
      text:'Fertig gekauft, kommen mit der Post. Machen weniger satt als ein gekochtes Gericht.' }));
  });
}

async function snackEssen(id){
  const sn = SNACKS[id];
  if (!sn || !(DATA.snacks[id] > 0)) return;
  DATA.snacks[id]--;
  fensterSchliessen();
  await pflegen({ satt: sn.satt, laune: sn.laune, sagt: sn.name + '! Mmh.' });
}

function fensterBestellen(){
  state.offen = 'bestellen';
  fensterOeffnen('BESTELLEN', blatt => {
    const rest = bestellRest();
    blatt.appendChild(h('div', { class:'leer',
      text:'Kostenlos. Heute noch ' + rest + ' von ' + TAGESMENGE + ' Zutaten frei. '
         + 'Geliefert wird am nächsten Tag um ' + LIEFERSTUNDE + ':00.' }));
    const gitter = h('div', { class:'gitter', id:'bestellgitter' });
    Object.entries(ZUTATEN).forEach(([id, z]) => {
      const wie = state.bestellwahl.filter(x => x === id).length;
      gitter.appendChild(h('button', {
        class:'stueck' + (wie ? ' an' : ''), 'data-bestell': id,
        onclick: () => {
          // Am Tageslimit tut ein weiterer Tipp nichts. Vorher leerte er
          // den Korb — das sah aus wie ein Fehlgriff.
          if (state.bestellwahl.length >= rest) return;
          state.bestellwahl = state.bestellwahl.concat(id);
          fensterBestellen();
        },
      }, listenBild('zutat_' + id, KOCHZEUG['zutat_' + id], zutatFarbe(id)),
         z.name, wie ? h('br') : null, wie ? '+' + wie : null));
    });
    blatt.appendChild(gitter);
    blatt.appendChild(h('div', { class:'zeile' },
      h('button', {
        class:'taste haupt' + (state.bestellwahl.length ? '' : ' aus'),
        id:'bestellen', disabled: state.bestellwahl.length ? null : true,
        text: state.bestellwahl.length ? 'BESTELLEN (' + state.bestellwahl.length + ')' : 'NICHTS GEWÄHLT',
        onclick: bestellen,
      }),
      state.bestellwahl.length ? h('button', {
        class:'taste', id:'korbleeren', text:'LEEREN',
        onclick: () => { state.bestellwahl = []; fensterBestellen(); },
      }) : null));
  });
}

async function bestellen(){
  const menge = Math.min(state.bestellwahl.length, bestellRest());
  if (!menge) return;
  const waren = {};
  state.bestellwahl.slice(0, menge).forEach(id => { waren[id] = (waren[id] || 0) + 1; });
  const neu = { liefert: lieferzeit(new Date()).toISOString(), waren };
  DATA.bestellung = (DATA.bestellung || []).concat(neu);
  bestellungVermerken(menge);
  state.bestellwahl = [];
  fensterSchliessen();
  await pflegen({ laune: 3, sagt: 'Bestellt! ' + lieferText() });
}

/* ---------- Zeichnen der Oberfläche ---------- */

function render(){
  const b = DATA.bella;
  const wohl = gesamtwohl();
  document.getElementById('wohlzahl').textContent = wohl;
  document.getElementById('wohlbtn').classList.toggle('schlecht', wohl < 40);
  document.getElementById('postpunkt').hidden = DATA.post.length === 0;

  const tasten = document.getElementById('tasten');
  tasten.textContent = '';
  tastenFuer(state.raum).forEach(t => tasten.appendChild(t));

  const extra = document.getElementById('extra');
  extra.textContent = '';
  extraFuer(state.raum).forEach(t => extra.appendChild(t));

  document.querySelectorAll('#nav .tab').forEach(t => t.classList.toggle('on', t.dataset.raum === state.raum));
  zeichnen();
  blaseZeigen();
}

function navBauen(){
  const nav = document.getElementById('nav');
  const icons = { schlaf:'ic_bett', kueche:'ic_herd', wohnen:'ic_sofa', bad:'ic_wanne', schrank:'ic_kleid' };
  const kurz = { schlaf:'BETT', kueche:'KÜCHE', wohnen:'SOFA', bad:'BAD', schrank:'SCHRANK' };
  RAEUME.forEach(r => {
    nav.appendChild(h('button', {
      class:'tab', 'data-raum': r, 'aria-label': RAUMNAME[r],
      onclick: () => {
        // Schaum und Planschen bleiben nicht am Raumwechsel hängen.
        if (state.raum === 'bad' && r !== 'bad'){ state.schaum = false; state.plansch = null; }
        state.raum = r; state.blase = null; render();
      },
    }, maleIcon(icons[r], 'icon_' + r), h('span', { text: kurz[r] })));
  });
}

/* ---------- Start ---------- */

/* Jede Zutat und jedes Gericht bekommt seinen Bildplatz, damit ein
   neues Rezept nicht an zwei Stellen eingetragen werden muss. */
function bildplaetzeAnmelden(){
  /* Je Tapete und je Boden ein Platz: eine gemalte Wand ersetzt die
     gewählte Tapete, nicht das ganze Zimmer — sonst ließen sich Wand
     und Boden nicht mehr einzeln wechseln. */
  Object.keys(WANDFARBEN).forEach(w => bildplatzAnlegen('wand_' + w));
  Object.keys(BODENFARBEN).forEach(b => bildplatzAnlegen('boden_' + b));
  Object.keys(ZUTATEN).forEach(z => bildplatzAnlegen('zutat_' + z));
  Object.keys(SNACKS).forEach(sn => bildplatzAnlegen('snack_' + sn));
  REZEPTE.forEach(r => bildplatzAnlegen('gericht_' + r.id));
  /* Die Möbel hießen hier einmal `moebel_herd`, gezeichnet wird aber
     unter `herd`. Eine hochgeladene Möbeldatei wäre damit nie
     angekommen — der Platz stand in der Liste, gesucht wurde ein
     anderer. */
  Object.keys(MOEBEL).forEach(m => bildplatzAnlegen(m));
  Object.keys(KLEINKRAM).forEach(k => bildplatzAnlegen(k));
  Object.keys(WANDDEKO).forEach(w => bildplatzAnlegen(w));
  // Das Bett in der Nische: eigener Platz, weil es nicht das
  // Zimmermöbel `bett` ist, sondern die Nahansicht.
  bildplatzAnlegen('bett_nische');
  // Die fünf Zimmer-Icons in der Fußzeile.
  RAEUME.forEach(r => bildplatzAnlegen('icon_' + r));
  /* Je Badezusatz eine gemalte Wanne — das Wasser ist darin schon
     gemalt. Dazu je Zusatz eine Blase, falls die auch von Hand kommen
     soll; fehlt sie, wird weiter die gezeichnete genommen. */
  Object.keys(BADEZUSAETZE).forEach(z => {
    bildplatzAnlegen('szene_wanne_' + z);
    bildplatzAnlegen('wanne_' + z);
    bildplatzAnlegen('blase_' + z);
  });
}

/* Nur für die Vorschau im Chat: alles freigeschaltet und der Vorrat
   voll, damit sich jedes einzelne Stück ansehen lässt. In der Handy-App
   ist diese Marke nicht gesetzt — dort kommt alles mit der Post. */
function allesFreischalten(){
  DATA.besitz.kleider  = Object.keys(KLEIDER);
  DATA.besitz.stuecke  = Object.keys(KLEIDUNG);
  DATA.besitz.frisuren = Object.keys(FRISUREN);
  DATA.besitz.schuhe   = Object.keys(SCHUHE);
  DATA.besitz.accessoires = Object.keys(ACCESSOIRES);
  DATA.besitz.waende   = Object.keys(WANDFARBEN);
  DATA.besitz.boeden   = Object.keys(BODENFARBEN);
  DATA.besitz.bett     = Object.keys(BETTZEUG);
  DATA.besitz.wanddeko = Object.keys(WANDDEKO);
  DATA.besitz.bad      = Object.keys(BADSPIELZEUG);
  DATA.besitz.zusaetze = Object.keys(BADEZUSAETZE);
  Object.keys(ZUTATEN).forEach(z => { DATA.vorrat[z] = 9; });
  Object.keys(SNACKS).forEach(z => { DATA.snacks[z] = 3; });
  DATA.kochbuch = REZEPTE.map(r => r.id);
  if (!DATA.raeume.bad.deko.length) DATA.raeume.bad.deko = Object.keys(BADSPIELZEUG).slice(0, 2);
}

async function start(){
  bildplaetzeAnmelden();
  try { await bilderLaden(); } catch (e){ /* ohne gelieferte Bilder geht es auch */ }
  try { DATA = adoptVault(await Store.loadVault()); } catch (e){ DATA = leererVault(); }

  if (typeof window !== 'undefined' && window.BELLAGOTCHI_VORSCHAU) allesFreischalten();

  const weg = (Date.now() - new Date(DATA.letzterBesuch)) / 60000;
  const minuten = standFortschreiben();
  postPruefen(minuten);
  const geliefert = lieferungPruefen();
  DATA.letzterBesuch = new Date().toISOString();
  await persist();

  navBauen();
  document.getElementById('wohlbtn').onclick = fensterWerte;
  document.getElementById('postbtn').onclick = fensterPost;
  document.getElementById('einrichtenbtn').onclick = fensterEinrichten;
  const bild = document.getElementById('bild');
  if (bild) bild.onclick = buehneAngetippt;
  document.getElementById('settingsbtn').onclick = fensterEinstellungen;

  if (geliefert) sagen('Die Lieferung ist da: '
    + Object.entries(geliefert).map(([id, n]) => n + '× ' + ZUTATEN[id].name).join(', '), 6000);
  else if (weg > 60 * 20) sagen('Du warst lange weg. Schön, dass du da bist.', 6000);
  else if (DATA.bella.schlaeft) sagen(DATA.bella.name + ' schläft. Zzz…', 5000);
  else if (gesamtwohl() < 40) sagen('Mir ist ein bisschen flau.', 5000);
  else sagen('Hallo!', 3500);

  render();

  erinnerungenStellen();

  /* Beim Weglegen neu planen: dann stimmen die Werte, aus denen sich die
     Zeitpunkte ergeben, und danach rechnet niemand mehr nach. */
  const App = typeof window !== 'undefined' && window.Capacitor
           && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (App && App.addListener){
    App.addListener('pause', () => {
      DATA.letzterBesuch = new Date().toISOString();
      persist().then(erinnerungenStellen);
    });
  }

  /* Ein Takt alle 200 ms. Bewegung braucht das — mit einem Takt je
     Sekunde ruckelte die Essensbewegung und die Dusche stand still.
     Die Werte werden weiter nur einmal je Minute fortgeschrieben. */
  const TAKT_MS = 200, TAKTE_JE_MINUTE = 300;
  let takt = 0;
  setInterval(async () => {
    state.bildzaehler++;
    takt++;
    if (takt % TAKTE_JE_MINUTE === 0){
      standFortschreiben();
      if (lieferungPruefen()) sagen('Die Lieferung ist angekommen!', 5000);
      persist();
      render();
      return;
    }
    if (await zeitgesteuertes()) return;
    zeichnen();
    blaseZeigen();
  }, TAKT_MS);

  window.addEventListener('resize', () => zeichnen());
}

/* Wird das Skript erst nach dem Aufbau der Seite eingehängt, ist
   DOMContentLoaded längst vorbei — dann sofort starten. */
if (typeof document !== 'undefined'){
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}
