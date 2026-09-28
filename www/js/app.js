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
    },
    bad: { zusatz: 'klar' },
    bestellung: null,
    outfit: { kleid: 'rosenrot', haar: 'beere' },
    zeiten: { einschlafen: '02:30', aufwachen: '10:30' },
    raeume: {
      schlaf:  { wand:'flieder', wandmuster:'wand_punkte',   boden:'eiche', bodenmuster:'boden_diele' },
      kueche:  { wand:'butter',  wandmuster:'wand_karo',     boden:'perle', bodenmuster:'boden_fliese' },
      wohnen:  { wand:'minze',   wandmuster:'wand_streifen', boden:'eiche', bodenmuster:'boden_diele' },
      bad:     { wand:'himmel',  wandmuster:'wand_karo',     boden:'perle', bodenmuster:'boden_fliese' },
      schrank: { wand:'rosa',    wandmuster:'wand_herzen',   boden:'beere', bodenmuster:'boden_teppich' },
    },
    besitz: { kleider: ['rosenrot', 'himmelblau'], haare: ['beere', 'honig'],
              waende: ['flieder','butter','minze','himmel','rosa'],
              boeden: ['eiche','perle','beere'],
              bett: ['kissen_a'], bad: [], zusaetze: ['klar'] },
    vorrat: { erdbeere: 3, milch: 2, mehl: 2, honig: 1, beere: 2, ei: 2 },
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
  bildzaehler: 0,     // treibt die Zappel-Animation
};

function vaultPayload(){
  const v = {};
  for (const k of ['bella','bad','bestellung','outfit','zeiten','raeume','besitz','vorrat',
                   'kochbuch','post','gesprochen','erinnerungen','stand','letzterBesuch',
                   'modus','backup']) v[k] = DATA[k];
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
  };
  v.bad = { zusatz: BADEZUSAETZE[(saved.bad || {}).zusatz] ? saved.bad.zusatz : 'klar' };
  const be = saved.bestellung;
  v.bestellung = (be && typeof be.liefert === 'string' && be.waren && typeof be.waren === 'object')
    ? { liefert: be.liefert, waren: be.waren } : null;
  const o = saved.outfit || {};
  v.outfit = { kleid: KLEIDER[o.kleid] ? o.kleid : 'rosenrot',
               haar:  HAARE[o.haar]   ? o.haar  : 'beere' };
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
    };
  });

  const bs = saved.besitz || {};
  const gefiltert = (liste, quelle, standard) => {
    const echt = (Array.isArray(liste) ? liste : []).filter(x => quelle[x]);
    return echt.length ? [...new Set(echt)] : standard;
  };
  v.besitz = {
    kleider: gefiltert(bs.kleider, KLEIDER, ['rosenrot','himmelblau']),
    haare:   gefiltert(bs.haare,   HAARE,   ['beere','honig']),
    waende:  gefiltert(bs.waende,  WANDFARBEN, ['flieder','butter','minze','himmel','rosa']),
    boeden:  gefiltert(bs.boeden,  BODENFARBEN, ['eiche','perle','beere']),
    bett:    (Array.isArray(bs.bett) ? bs.bett : []).filter(x => BETTZEUG[x]),
    bad:     (Array.isArray(bs.bad)  ? bs.bad  : []).filter(x => BADSPIELZEUG[x]),
    zusaetze: gefiltert(bs.zusaetze, BADEZUSAETZE, ['klar']),
  };
  if (!v.besitz.zusaetze.includes(v.bad.zusatz)) v.besitz.zusaetze.push(v.bad.zusatz);
  // Was man trägt, muss man auch besitzen.
  if (!v.besitz.kleider.includes(v.outfit.kleid)) v.besitz.kleider.push(v.outfit.kleid);
  if (!v.besitz.haare.includes(v.outfit.haar)) v.besitz.haare.push(v.outfit.haar);

  v.vorrat = {};
  Object.keys(ZUTATEN).forEach(k => {
    v.vorrat[k] = zahl((saved.vorrat || {})[k], 0, 0, 99);
  });
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
const BESTELLMENGE = 3;

function lieferzeit(jetzt){
  const d = new Date(jetzt);
  d.setDate(d.getDate() + 1);
  d.setHours(LIEFERSTUNDE, 0, 0, 0);
  return d;
}

/* Ist die Lieferung fällig, wandert sie in den Vorrat. */
function lieferungPruefen(jetzt){
  const b = DATA.bestellung;
  if (!b) return null;
  if (new Date(jetzt || Date.now()) < new Date(b.liefert)) return null;
  const geliefert = {};
  Object.entries(b.waren).forEach(([id, n]) => {
    if (!ZUTATEN[id]) return;
    DATA.vorrat[id] = Math.min(99, (DATA.vorrat[id] || 0) + n);
    geliefert[id] = n;
  });
  DATA.bestellung = null;
  return geliefert;
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

const BADSPIELZEUG = {
  sp_ente:   { name:'Ente' },
  sp_schiff: { name:'Schiffchen' },
  sp_stern:  { name:'Seestern' },
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
const ERHOLUNG = 11;

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
  b.ausgeruht = begrenzen(b.ausgeruht - ZEHRUNG.ausgeruht * wach / 60 + ERHOLUNG * schlaf / 60);

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

const BUEHNE_ANTEIL = 0.46;     // Anteil der Fensterhöhe
const MASS_MIN = 2, MASS_MAX = 4;
const SCHIRM_MIN_B = 96, SCHIRM_MAX_B = 260;
const SCHIRM_MIN_H = 88, SCHIRM_MAX_H = 200;

function buehneMasse(){
  const el = typeof document !== 'undefined' ? document.getElementById('buehne') : null;
  const breite = el ? el.clientWidth : 0;
  const hoehe = typeof window !== 'undefined' ? Math.round(window.innerHeight * BUEHNE_ANTEIL) : 0;
  if (!(breite > 60) || !(hoehe > 60)) return { b: 148, h: 112, mass: 2 };  // jsdom misst nicht
  const mass = Math.max(MASS_MIN, Math.min(MASS_MAX, Math.floor(hoehe / 118)));
  const klemm = (x, min, max) => Math.max(min, Math.min(max, x));
  return {
    b: klemm(Math.floor(breite / mass), SCHIRM_MIN_B, SCHIRM_MAX_B),
    h: klemm(Math.floor(hoehe / mass), SCHIRM_MIN_H, SCHIRM_MAX_H),
    mass,
  };
}

/* Ein Rechteck in Spielpixeln. Alles Gezeichnete geht hier durch, damit
   nirgends versehentlich ein halber Pixel entsteht. */
function px(ctx, s, x, y, b, h, farbe){
  if (!farbe) return;
  ctx.fillStyle = farbe;
  ctx.fillRect(Math.round(x) * s.mass, Math.round(y) * s.mass,
               Math.max(0, Math.round(b)) * s.mass, Math.max(0, Math.round(h)) * s.mass);
}

/* Eine gefüllte Ellipse, zeilenweise aus Rechtecken — so bekommt sie
   die stufige Kante, die zur Pixelgrafik gehört, statt einer glatten. */
function ellipse(ctx, s, mx, my, rx, ry, farbe){
  for (let y = -ry; y <= ry; y++){
    const t = 1 - (y * y) / (ry * ry);
    if (t <= 0) continue;
    const halb = Math.round(rx * Math.sqrt(t));
    px(ctx, s, mx - halb, my + y, halb * 2 + 1, 1, farbe);
  }
}

/* Ein Ellipsenring: außen gefüllt, innen wieder frei. */
function ellipsenRing(ctx, s, mx, my, rx, ry, dicke, farbe){
  for (let y = -ry; y <= ry; y++){
    const t = 1 - (y * y) / (ry * ry);
    if (t <= 0) continue;
    const aussen = Math.round(rx * Math.sqrt(t));
    const ti = 1 - (y * y) / ((ry - dicke) * (ry - dicke));
    const innen = ti > 0 ? Math.round((rx - dicke) * Math.sqrt(ti)) : -1;
    if (innen < 0){ px(ctx, s, mx - aussen, my + y, aussen * 2 + 1, 1, farbe); continue; }
    px(ctx, s, mx - aussen, my + y, aussen - innen, 1, farbe);
    px(ctx, s, mx + innen + 1, my + y, aussen - innen, 1, farbe);
  }
}

/* ---------- Tageszeit ---------- */

const BAYER = [ [0,8,2,10], [12,4,14,6], [3,11,1,9], [15,7,13,5] ];

function tageszeit(d){
  const h = (d || new Date()).getHours();
  if (h >= 8  && h < 17) return { farbe:null,      dichte:0, deckung:0   };
  if (h >= 5  && h < 8)  return { farbe:'#FF9E3D', dichte:5, deckung:.24 };
  if (h >= 17 && h < 20) return { farbe:'#FF5C5C', dichte:6, deckung:.26 };
  // Nicht 8 von 16: genau die Hälfte ergibt ein regelmäßiges Schachbrett,
  // das sich über das Wandmuster legt und flimmert.
  if (h >= 20 || h < 2)  return { farbe:'#2C2A82', dichte:6, deckung:.55 };
  return { farbe:'#1B1040', dichte:7, deckung:.62 };
}

/* Gedeckt wird mit Rasterpunkten und halber Deckkraft zugleich. Nur
   Punkte löschen die Hälfte des Bildes aus, nur Deckkraft sähe nach
   Weichzeichner aus. */
function maleDaemmerung(ctx, s, jetzt){
  const t = tageszeit(jetzt);
  if (!t.farbe || !t.dichte) return;
  const vorher = ctx.globalAlpha;
  ctx.globalAlpha = t.deckung;
  ctx.fillStyle = t.farbe;
  for (let y = 0; y < s.h; y++)
    for (let x = 0; x < s.b; x++)
      if (BAYER[y & 3][x & 3] < t.dichte) ctx.fillRect(x * s.mass, y * s.mass, s.mass, s.mass);
  ctx.globalAlpha = vorher;
}

function raumFarben(raum){
  const r = DATA.raeume[raum];
  return { wand: WANDFARBEN[r.wand].farben, boden: BODENFARBEN[r.boden].farben,
           wandmuster: KACHELN[r.wandmuster], bodenmuster: KACHELN[r.bodenmuster] };
}

function outfitPlaetze(){
  const k = KLEIDER[DATA.outfit.kleid].farben;
  const h = HAARE[DATA.outfit.haar].farben;
  return [k[0], k[1], k[2], h[0], h[1], h[2]];
}

/* Zappeln: ein Pixel reicht — zwei sehen aus, als würde sie hüpfen. */
function zappel(){
  if (DATA.bella.schlaeft) return 0;
  const st = stimmung();
  if (st === 'froh') return (state.bildzaehler % 20 < 10) ? -1 : 0;
  if (st === 'traurig') return 0;
  return (state.bildzaehler % 40 < 20) ? 0 : -1;
}

/* ---------- Die Zimmer mit Wand, Boden und Möbeln ----------
   Gilt für Küche, Wohnzimmer und Kleiderschrank. Schlafzimmer und Bad
   sind herangezoomte Szenen und werden eigens gezeichnet. */

const BODENBAND = 34;

const EINRICHTUNG = {
  kueche: [ {s:'fenster', von:'mitte', x:-6, y:14},
            {s:'herd', von:'links', x:6, steht:true},
            {s:'kuehlschrank', von:'links', x:30, steht:true},
            {s:'tisch', von:'rechts', x:6, steht:true} ],
  wohnen: [ {s:'fenster', von:'mitte', x:16, y:10},
            {s:'regal', von:'links', x:4, steht:true},
            {s:'sofa', von:'mitte', x:10, steht:true},
            {s:'pflanze', von:'rechts', x:4, steht:true} ],
  schrank:[ {s:'stange', von:'mitte', x:-4, y:8},
            {s:'schrank', von:'links', x:4, steht:true},
            {s:'spiegel', von:'rechts', x:6, y:16} ],
};

const BELLA_STELLE = { kueche:'mitte', wohnen:'links', schrank:'rechts' };

function platzieren(m, s, bodenY){
  const sp = MOEBEL[m.s];
  const x = m.von === 'rechts' ? s.b - sp.b - m.x
          : m.von === 'mitte'  ? Math.round((s.b - sp.b) / 2) + (m.x || 0)
          : m.x;
  const y = m.steht ? bodenY + 4 - sp.h : m.y;
  return { x, y };
}

function maleZimmer(ctx, s, raum){
  const f = raumFarben(raum);
  const bodenY = s.h - BODENBAND;

  px(ctx, s, 0, 0, s.b, s.h, f.wand[0]);
  maleKachel(ctx, f.wandmuster, 0, 0, s.b, bodenY, s.mass, f.wand);
  maleKachel(ctx, f.bodenmuster, 0, bodenY, s.b, s.h - bodenY, s.mass, f.boden);
  px(ctx, s, 0, bodenY - 2, s.b, 2, PALETTE.K);

  const stoff = KLEIDER[DATA.outfit.kleid].farben;
  EINRICHTUNG[raum].forEach(m => {
    const p = platzieren(m, s, bodenY);
    maleSprite(ctx, MOEBEL[m.s], p.x, p.y, s.mass, [stoff[0], stoff[1], stoff[2]]);
  });

  const wo = BELLA_STELLE[raum];
  const bx = wo === 'links' ? Math.round(s.b * 0.16)
           : wo === 'rechts' ? Math.round(s.b * 0.72)
           : Math.round(s.b * 0.44);
  const by = bodenY + 10 - 32 + zappel();
  const plaetze = outfitPlaetze();
  maleRaster(ctx, BELLA_STEHT, bx, by, s.mass, plaetze);
  maleRaster(ctx, GESICHTER[stimmung()], bx + GESICHT_X, by + GESICHT_Y, s.mass, plaetze);
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

/* Immer dieselbe Stadt, immer dieselben Lichter: ein fester Startwert
   statt Math.random, sonst flackerte die Skyline bei jedem Neuzeichnen
   — und neu gezeichnet wird jede Sekunde. FNV-1a, weil die einfache
   Zeichensumme bei kurzen, ähnlichen Namen fast dieselbe Zahl liefert. */
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
function maleKissenwand(ctx, s, mx, unten, rx){
  const zufall = streuFolge('kissen');
  const toene = [['#D8A08A','#F0C4A8'], ['#C08070','#E0A48E'],
                 ['#E3C4A2','#F6E0C6'], ['#B5705C','#D29280']];
  const wie = Math.max(4, Math.round(rx / 9));
  for (let i = 0; i < wie; i++){
    const kx = mx - rx + 6 + Math.round(i * (rx * 2 - 12) / (wie - 1));
    const ky = unten - 12 - Math.round(zufall() * 4);
    const kr = 7 + Math.round(zufall() * 3);
    const [dunkel, hell] = toene[Math.floor(zufall() * toene.length)];
    ellipse(ctx, s, kx, ky, kr, Math.round(kr * 0.8), dunkel);
    ellipse(ctx, s, kx, ky - 1, kr - 2, Math.round(kr * 0.58), hell);
  }
}

function maleMatratze(ctx, s, mx, unten, rx){
  ellipse(ctx, s, mx, unten - 6, rx + 1, 11, '#8A6B5C');
  ellipse(ctx, s, mx, unten - 6, rx, 10, NISCHE.matratze2);
  ellipse(ctx, s, mx, unten - 8, rx - 2, 9, NISCHE.matratze);
  px(ctx, s, mx - rx + 4, unten - 13, (rx - 4) * 2, 1, 'rgba(255,255,255,.4)');
}

/* Bella im Bett: Kopf auf dem Kissen, der Körper als Hügel darunter.
   Ohne den Hügel läge nur ein Kopf auf der Matratze. Zugedeckt wechselt
   der Hügel die Farbe und bekommt einen umgeschlagenen Saum — daran
   sieht man, dass "Zudecken" etwas getan hat. */
function maleBellaImBett(ctx, s, mx, unten){
  const plaetze = outfitPlaetze();
  const stoff = KLEIDER[DATA.outfit.kleid].farben;
  const zu = DATA.bella.zugedeckt;
  const kopfX = mx - 20, kopfY = unten - 22;

  // Unbedeckt einen Ton dunkler als die Matratze, sonst verschwände der
  // Körper darin und es läge nur ein Kopf auf dem Bett.
  const huegel = zu ? stoff[1] : '#B99A82';
  const huegelHell = zu ? stoff[0] : '#D4B79C';
  ellipse(ctx, s, mx + 9, unten - 12, 20, 7, huegel);
  ellipse(ctx, s, mx + 9, unten - 13, 18, 5, huegelHell);
  if (zu){
    px(ctx, s, mx - 11, unten - 18, 8, 3, stoff[0]);
    px(ctx, s, mx - 11, unten - 15, 8, 1, stoff[2]);
  }

  maleRaster(ctx, BELLA_LIEGT, kopfX, kopfY, s.mass, plaetze);
}

function maleSchlafnische(ctx, s){
  const mx = Math.round(s.b / 2);
  const rx = Math.round(s.b * 0.47);
  const ry = Math.round(s.h * 0.46);
  const my = Math.round(s.h * 0.44);
  const unten = my + ry;

  px(ctx, s, 0, 0, s.b, s.h, NISCHE.wand);
  px(ctx, s, 0, s.h - 12, s.b, 12, NISCHE.wandtief);

  ellipse(ctx, s, mx, my, rx + 2, ry + 2, NISCHE.rand);
  ellipse(ctx, s, mx, my, rx, ry, NISCHE.innen);
  ellipsenRing(ctx, s, mx, my, rx + 2, ry + 2, 1, NISCHE.randlicht);

  /* Lichterkette am oberen Bogen — in der Vorlage ist sie das, was die
     Nische warm macht. Die Punkte sitzen auf der Ellipse selbst, damit
     sie der Rundung folgen statt auf einer Geraden zu hängen. */
  for (let i = 0; i <= 14; i++){
    const w = Math.PI + (i / 14) * Math.PI;      // oberer Halbkreis
    const lx = Math.round(mx + Math.cos(w) * (rx - 3));
    const ly = Math.round(my + Math.sin(w) * (ry - 3));
    px(ctx, s, lx - 1, ly - 1, 3, 3, 'rgba(255,201,138,.30)');
    px(ctx, s, lx, ly, 1, 1, (i % 3) ? NISCHE.warm : '#FFF0D0');
  }

  // Eine Hängepflanze, damit die Wand nicht leer bleibt.
  const px0 = mx - Math.round(rx * 0.52), py0 = my - Math.round(ry * 0.10);
  px(ctx, s, px0 - 4, py0, 9, 5, '#8A5B2E');
  px(ctx, s, px0 - 5, py0 - 2, 11, 2, '#A9743E');
  for (const [dx, dy, len] of [[-3, 5, 9], [0, 5, 13], [3, 5, 7], [-1, 5, 16]]){
    for (let k = 0; k < len; k++)
      px(ctx, s, px0 + dx + ((k % 4 < 2) ? 0 : 1), py0 + dy + k, 1, 1,
         (k % 3) ? '#4BE38A' : '#2FB86A');
  }

  // Fenster links, Regal rechts — beide innerhalb der Nische.
  const fb = Math.round(rx * 0.72), fh = Math.round(ry * 0.92);
  const fx = mx - rx + Math.round(rx * 0.18), fy = my - ry + Math.round(ry * 0.22);
  px(ctx, s, fx - 2, fy - 2, fb + 4, fh + 4, '#4A3A38');
  maleStadt(ctx, s, fx, fy, fb, fh);
  px(ctx, s, fx + Math.round(fb / 2), fy, 2, fh, '#4A3A38');
  px(ctx, s, fx, fy + Math.round(fh / 2), fb, 2, '#4A3A38');
  // Vorhang am rechten Fensterrand
  px(ctx, s, fx + fb, fy - 2, 4, fh + 4, '#D8C3A5');
  px(ctx, s, fx + fb + 1, fy - 2, 1, fh + 4, '#EFE0C8');

  const gb = Math.round(rx * 0.62), gh = Math.round(ry * 0.78);
  const gx = mx + Math.round(rx * 0.16), gy = my - ry + Math.round(ry * 0.26);
  maleRegal(ctx, s, gx, gy, Math.min(gb, mx + rx - gx - 3), gh);

  const bettUnten = unten - 4, bettRx = rx - 4;
  maleKissenwand(ctx, s, mx, bettUnten, bettRx);
  maleMatratze(ctx, s, mx, bettUnten, bettRx);
  maleBellaImBett(ctx, s, mx, bettUnten);

  // Was aus der Post auf dem Bett liegt: rechts neben Bella, auf der
  // Matratze, nicht in der Luft.
  const abgelegt = DATA.besitz.bett || [];
  abgelegt.slice(0, 3).forEach((id, i) => {
    const sp = KLEINKRAM[id];
    if (!sp) return;
    const x = mx + bettRx - 12 - i * 16;
    maleSprite(ctx, sp, x - Math.round(sp.b / 2), bettUnten - 10 - sp.h, s.mass, null);
  });

  /* Der warme Lichtsaum unter der Nischenkante — in der Vorlage ist er
     das, was den Raum gemütlich macht. Zwei Zeilen: die obere heller. */
  px(ctx, s, mx - rx, unten, rx * 2, 1, NISCHE.warm);
  px(ctx, s, mx - rx + 4, unten + 1, rx * 2 - 8, 1, NISCHE.glut);
  // Der Teppich davor, angedeutet als flache Ellipse.
  ellipse(ctx, s, mx, s.h - 3, Math.round(rx * 0.7), 4, '#4A3A42');
  ellipse(ctx, s, mx, s.h - 4, Math.round(rx * 0.62), 3, '#5C4750');
}

/* ---------- Die Badeszene ----------
   Auch hier nur die Wanne, herangezoomt: heller Raum, weiter Rand,
   getöntes Wasser, Blasen. Was im Wasser ist, kommt aus dem Badezusatz;
   was auf dem Rand steht, aus der Post. */

function badFarben(){
  const z = BADEZUSAETZE[DATA.bad.zusatz] || BADEZUSAETZE.klar;
  return z;
}

function maleBadeszene(ctx, s){
  const z = badFarben();
  const mx = Math.round(s.b / 2);

  px(ctx, s, 0, 0, s.b, s.h, '#EFEAF0');
  // Fliesenfugen, nur angedeutet.
  for (let y = 0; y < Math.round(s.h * 0.34); y += 9) px(ctx, s, 0, y, s.b, 1, '#E2DAE6');
  for (let x = 0; x < s.b; x += 14) px(ctx, s, x, 0, 1, Math.round(s.h * 0.34), '#E2DAE6');

  const wy = Math.round(s.h * 0.30);
  const wb = s.b - 6, wh = s.h - wy - 2;
  const rx = Math.round(wb / 2), ry = Math.round(wh / 2);
  const my = wy + ry;

  ellipse(ctx, s, mx, my, rx, ry, '#C9C2CE');
  ellipse(ctx, s, mx, my - 1, rx - 1, ry - 1, '#FFFFFF');
  ellipse(ctx, s, mx, my + 1, rx - 7, ry - 6, z.wasser[2]);
  ellipse(ctx, s, mx, my, rx - 8, ry - 7, z.wasser[1]);
  ellipse(ctx, s, mx, my - 1, rx - 10, ry - 9, z.wasser[0]);

  /* Blasen: ein Ring in der Zusatzfarbe, innen heller, ein Glanzpunkt
     oben links. Kleine Tupfer allein sähen aus wie Schmutz. */
  const zufall = streuFolge('blasen' + DATA.bad.zusatz);
  for (let i = 0; i < 14; i++){
    const w = zufall() * Math.PI * 2, r = Math.sqrt(zufall());
    const bx = mx + Math.round(Math.cos(w) * (rx - 16) * r);
    const by = my + Math.round(Math.sin(w) * (ry - 14) * r);
    const br = 3 + Math.round(zufall() * 4);
    ellipse(ctx, s, bx, by, br, br, z.blase);
    ellipse(ctx, s, bx, by, br - 1, br - 1, 'rgba(255,255,255,.55)');
    ellipse(ctx, s, bx, by, br - 2, br - 2, z.blaseHell);
    px(ctx, s, bx - br + 2, by - br + 2, 2, 1, '#FFFFFF');
    px(ctx, s, bx - br + 1, by - br + 3, 1, 1, '#FFFFFF');
  }

  // Dampf über dem Wasser.
  const dampf = streuFolge('dampf');
  for (let i = 0; i < 3; i++){
    let dx = mx - 16 + i * 16, dy = wy - 2;
    for (let k = 0; k < 8; k++){
      px(ctx, s, dx, dy - k * 3, 1, 2, 'rgba(255,255,255,.55)');
      dx += dampf() > .5 ? 1 : -1;
    }
  }

  // Bella sitzt hinten in der Wanne, angelehnt — nicht mitten im Wasser.
  const plaetze = outfitPlaetze();
  const bx = mx - 12, by = my - ry + 6;
  maleRaster(ctx, BELLA_STEHT.slice(0, 17), bx, by, s.mass, plaetze);
  maleRaster(ctx, GESICHTER[state.schaum ? 'froh' : stimmung()],
             bx + GESICHT_X, by + GESICHT_Y, s.mass, plaetze);
  if (state.schaum){
    // Schaumhaube und Schaumkragen, damit man das Einschäumen sieht.
    ellipse(ctx, s, mx, by + 1, 10, 5, '#FFFFFF');
    ellipse(ctx, s, mx - 6, by - 1, 4, 3, '#FFFFFF');
    ellipse(ctx, s, mx + 6, by - 1, 4, 3, '#FFFFFF');
    ellipse(ctx, s, mx, by + 17, 13, 4, '#F4F0F8');
  }

  /* Was auf dem Rand steht, muss dem Bogen der Wanne folgen — sonst
     schwebt die Kerze an der Wand. Die Höhe wird je Gegenstand aus der
     Ellipse ausgerechnet. */
  const randOben = x => {
    const t = 1 - ((x - mx) / rx) * ((x - mx) / rx);
    return t <= 0 ? my : my - Math.round(ry * Math.sqrt(t));
  };
  const rand = ['sp_kerze'].concat((DATA.besitz.bad || []).slice(0, 3));
  rand.forEach((id, i) => {
    const sp = KLEINKRAM[id];
    if (!sp) return;
    const spanne = Math.round(rx * 1.3);
    const x = mx - Math.round(spanne / 2)
            + (rand.length > 1 ? Math.round(i * spanne / (rand.length - 1)) : Math.round(spanne / 2))
            - Math.round(sp.b / 2);
    maleSprite(ctx, sp, x, randOben(x + sp.b / 2) - sp.h + 3, s.mass, null);
  });
}

function maleRaum(ctx, s, jetzt){
  if (state.raum === 'schlaf') maleSchlafnische(ctx, s);
  else if (state.raum === 'bad') maleBadeszene(ctx, s);
  else maleZimmer(ctx, s, state.raum);
  maleDaemmerung(ctx, s, jetzt);
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
  const an = state.blase && Date.now() < state.blaseBis;
  el.hidden = !an;
  if (an) el.textContent = state.blase;
}

/* Die Bühne bekommt ihre Höhe vom Bild, nicht umgekehrt: sonst hinge
   das Bild an einer Höhe, die es selbst erzeugt. */
function zeichnen(){
  const c = document.getElementById('bild');
  if (!c || !c.getContext) return;
  const s = buehneMasse();
  const bp = s.b * s.mass, hp = s.h * s.mass;
  if (c.width !== bp || c.height !== hp){
    c.width = bp; c.height = hp;
    c.style.width = bp + 'px';
    c.style.height = hp + 'px';
    const buehne = document.getElementById('buehne');
    if (buehne) buehne.style.height = hp + 'px';
  }
  const ctx = c.getContext('2d');
  if (!ctx) return;
  if ('imageSmoothingEnabled' in ctx) ctx.imageSmoothingEnabled = false;
  maleRaum(ctx, s, new Date());
}

function maleIcon(name){
  const c = h('canvas', { width: 44, height: 44, 'aria-hidden': 'true' });
  if (c.getContext){
    const ctx = c.getContext('2d');
    if (ctx){
      if ('imageSmoothingEnabled' in ctx) ctx.imageSmoothingEnabled = false;
      maleSprite(ctx, ICONS[name], 0, 0, 2.75, null);
    }
  }
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
  Object.keys(HAARE).forEach(k => { if (!DATA.besitz.haare.includes(k))
    gaben.push({ art:'haar', was:k, text:'Eine Haarfarbe: ' + HAARE[k].name + '.' }); });
  Object.keys(WANDFARBEN).forEach(k => { if (!DATA.besitz.waende.includes(k))
    gaben.push({ art:'wand', was:k, text:'Tapete in ' + WANDFARBEN[k].name + '.' }); });
  Object.keys(BODENFARBEN).forEach(k => { if (!DATA.besitz.boeden.includes(k))
    gaben.push({ art:'boden', was:k, text:'Ein Boden in ' + BODENFARBEN[k].name + '.' }); });
  Object.keys(BETTZEUG).forEach(k => { if (!DATA.besitz.bett.includes(k))
    gaben.push({ art:'bett', was:k, text:BETTZEUG[k].name + ' fürs Bett.' }); });
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
    if (!offen.length){
      const z = Object.keys(ZUTATEN)[Math.floor(Math.random() * Object.keys(ZUTATEN).length)];
      DATA.post.push({ art:'zutat', was:z, text:'Ein Körbchen ' + ZUTATEN[z].name + '.' });
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
  if (p.art === 'haar'  && !DATA.besitz.haare.includes(p.was))   DATA.besitz.haare.push(p.was);
  if (p.art === 'wand'  && !DATA.besitz.waende.includes(p.was))  DATA.besitz.waende.push(p.was);
  if (p.art === 'boden' && !DATA.besitz.boeden.includes(p.was))  DATA.besitz.boeden.push(p.was);
  if (p.art === 'bett'  && !DATA.besitz.bett.includes(p.was))    DATA.besitz.bett.push(p.was);
  if (p.art === 'bad'   && !DATA.besitz.bad.includes(p.was))     DATA.besitz.bad.push(p.was);
  if (p.art === 'zusatz'&& !DATA.besitz.zusaetze.includes(p.was))DATA.besitz.zusaetze.push(p.was);
  if (p.art === 'zutat') DATA.vorrat[p.was] = Math.min(99, (DATA.vorrat[p.was] || 0) + 3);
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
      }, z.name, h('span', { class:'farbe', style:'background:' + zutatFarbe(id) }), 'x' + da));
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
  fensterSchliessen();
  await pflegen({ satt: r.satt, laune: r.laune, sagt: r.name + '! Danke.' });
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
  const schlaeft = b.schlaeft;
  const wach = text => () => { sagen(b.name + ' schläft. ' + text); render(); };

  if (raum === 'schlaf'){
    return [
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
      taste(b.zugedeckt ? 'AUFDECKEN' : 'ZUDECKEN', async () => {
        b.zugedeckt = !b.zugedeckt;
        await pflegen({ ausgeruht: b.zugedeckt ? 6 : 0, laune: b.zugedeckt ? 5 : -1,
                        sagt: b.zugedeckt ? (schlaeft ? '…' : 'Mmh, warm.') : 'Ah, Luft!' });
      }, b.zugedeckt ? '' : 'haupt'),
      taste('LICHT AUS', () => pflegen({ ausgeruht: 5, laune: 2,
        sagt: schlaeft ? '…' : 'Gute Nacht.' })),
    ];
  }

  if (raum === 'kueche'){
    return [
      taste('KOCHEN', schlaeft ? wach('Später.') : fensterKochen, 'haupt'),
      taste('NASCHEN', schlaeft ? wach('Später.') : () =>
        pflegen({ satt: 8, laune: 4, sagt: 'Nur ein kleines.' })),
      taste(DATA.bestellung ? 'BESTELLT' : 'BESTELLEN',
        DATA.bestellung ? () => { sagen(lieferText()); render(); } : fensterBestellen),
    ];
  }

  if (raum === 'wohnen'){
    return [
      taste('REDEN', schlaeft ? wach('Pst.') : fensterReden, 'haupt'),
      ...AKTIVITAETEN.slice(0, 2).map(a => taste(a.name.toUpperCase(),
        schlaeft ? wach('Pst.') : () => pflegen({ laune:a.laune, ausgeruht:a.ausgeruht, sagt:a.sagt }))),
    ];
  }

  if (raum === 'bad'){
    /* Nur baden: einschäumen und abbrausen, in dieser Reihenfolge.
       Zähneputzen und Haarewaschen als eigene Knöpfe daneben machten aus
       der Wanne eine Knopfsammlung. */
    return [
      state.schaum
        ? taste('ABBRAUSEN', async () => {
            state.schaum = false;
            await pflegen({ sauber: 46, laune: 9, sagt: 'Blitzeblank!' });
          }, 'haupt')
        : taste('EINSCHÄUMEN', schlaeft ? wach('Morgen.') : async () => {
            state.schaum = true;
            await pflegen({ laune: 6, sagt: 'Kitzelt!' });
          }, 'haupt'),
      taste('BADEZUSATZ', fensterBadezusatz),
      taste('PLANSCHEN', schlaeft ? wach('Morgen.') : () =>
        pflegen({ laune: 8, sauber: 4, sagt: 'Platsch!' })),
    ];
  }

  return [
    taste('ANZIEHEN', fensterAnziehen, 'haupt'),
    ...AKTIVITAETEN.slice(2, 4).map(a => taste(a.name.toUpperCase(),
      schlaeft ? wach('Pst.') : () => pflegen({ laune:a.laune, ausgeruht:a.ausgeruht, sagt:a.sagt }))),
  ];
}

function lieferText(){
  if (!DATA.bestellung) return 'Nichts bestellt.';
  const d = new Date(DATA.bestellung.liefert);
  return 'Die Lieferung kommt morgen um ' + String(d.getHours()).padStart(2,'0') + ':00.';
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
      h('span', { class:'farbe', style:'background:' + zutatFarbe(id) }),
      z.name, h('br'), 'x' + (DATA.vorrat[id] || 0)));
  });
  return [h('div', { class:'block', id:'vorratblock' },
    h('div', { class:'blockkopf', text:'VORRAT' }), vorrat,
    h('div', { class:'leer', text: DATA.bestellung ? lieferText()
      : 'Zutaten kannst du kostenlos bestellen — sie kommen am nächsten Tag.' }))];
}

/* ---------- Fenster hinter den Kopfknöpfen ---------- */

function fensterEinrichten(){
  state.offen = 'einrichten';
  const r = DATA.raeume[state.raum];
  fensterOeffnen('EINRICHTEN — ' + RAUMNAME[state.raum].toUpperCase(), blatt => {
    if (state.raum === 'schlaf' || state.raum === 'bad'){
      blatt.appendChild(h('div', { class:'leer', text:
        state.raum === 'schlaf'
          ? 'Die Nische richtest du über das ein, was aus der Post kommt — Kissen und Kuscheltiere liegen von selbst auf dem Bett.'
          : 'Die Wanne richtest du über Badezusätze und Spielzeug aus der Post ein.' }));
    }
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

function fensterAnziehen(){
  state.offen = 'anziehen';
  fensterOeffnen('ANZIEHEN', blatt => {
    blatt.appendChild(waehler('KLEID',
      DATA.besitz.kleider.map(id => ({ id, name: KLEIDER[id].name, farbe: KLEIDER[id].farben[1] })),
      id => DATA.outfit.kleid === id,
      async id => { DATA.outfit.kleid = id; await pflegen({ laune: 3, sagt: 'Steht mir, oder?' });
                    fensterAnziehen(); }));
    blatt.appendChild(waehler('HAARE',
      DATA.besitz.haare.map(id => ({ id, name: HAARE[id].name, farbe: HAARE[id].farben[1] })),
      id => DATA.outfit.haar === id,
      async id => { DATA.outfit.haar = id; await pflegen({ laune: 3, sagt: 'Neue Farbe!' });
                    fensterAnziehen(); }));
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

function fensterBestellen(){
  state.offen = 'bestellen';
  fensterOeffnen('BESTELLEN', blatt => {
    blatt.appendChild(h('div', { class:'leer',
      text:'Kostenlos, bis zu ' + BESTELLMENGE + ' Zutaten. Geliefert wird am nächsten Tag um '
         + LIEFERSTUNDE + ':00.' }));
    const gitter = h('div', { class:'gitter', id:'bestellgitter' });
    Object.entries(ZUTATEN).forEach(([id, z]) => {
      const wie = state.bestellwahl.filter(x => x === id).length;
      gitter.appendChild(h('button', {
        class:'stueck' + (wie ? ' an' : ''), 'data-bestell': id,
        onclick: () => {
          if (state.bestellwahl.length >= BESTELLMENGE) state.bestellwahl = [];
          state.bestellwahl = state.bestellwahl.concat(id);
          fensterBestellen();
        },
      }, h('span', { class:'farbe', style:'background:' + zutatFarbe(id) }),
         z.name, wie ? h('br') : null, wie ? '+' + wie : null));
    });
    blatt.appendChild(gitter);
    blatt.appendChild(h('div', { class:'zeile' },
      h('button', {
        class:'taste haupt breit' + (state.bestellwahl.length ? '' : ' aus'),
        id:'bestellen', disabled: state.bestellwahl.length ? null : true,
        text: state.bestellwahl.length ? 'BESTELLEN (' + state.bestellwahl.length + ')' : 'NICHTS GEWÄHLT',
        onclick: bestellen,
      })));
  });
}

async function bestellen(){
  if (!state.bestellwahl.length) return;
  const waren = {};
  state.bestellwahl.forEach(id => { waren[id] = (waren[id] || 0) + 1; });
  DATA.bestellung = { liefert: lieferzeit(new Date()).toISOString(), waren };
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
        // Schaum bleibt nicht am Raumwechsel hängen.
        if (state.raum === 'bad' && r !== 'bad') state.schaum = false;
        state.raum = r; state.blase = null; render();
      },
    }, maleIcon(icons[r]), h('span', { text: kurz[r] })));
  });
}

/* ---------- Start ---------- */

async function start(){
  try { DATA = adoptVault(await Store.loadVault()); } catch (e){ DATA = leererVault(); }

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

  // Ein Takt je Sekunde: Zappeln, Sprechblase, und jede Minute die Werte.
  let takt = 0;
  setInterval(() => {
    state.bildzaehler++;
    takt++;
    if (takt % 60 === 0){
      standFortschreiben();
      if (lieferungPruefen()) sagen('Die Lieferung ist angekommen!', 5000);
      persist();
    }
    if (takt % 60 === 0 || state.bildzaehler % 10 === 0) render();
    else { zeichnen(); blaseZeigen(); }
  }, 1000);

  window.addEventListener('resize', () => zeichnen());
}

/* Wird das Skript erst nach dem Aufbau der Seite eingehängt, ist
   DOMContentLoaded längst vorbei — dann sofort starten. */
if (typeof document !== 'undefined'){
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}
