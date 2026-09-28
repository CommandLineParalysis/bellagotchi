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
      schlaeft: false,
    },
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
              boeden: ['eiche','perle','beere'] },
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
  bildzaehler: 0,     // treibt die Zappel-Animation
};

function vaultPayload(){
  const v = {};
  for (const k of ['bella','outfit','zeiten','raeume','besitz','vorrat','kochbuch',
                   'post','gesprochen','erinnerungen','stand','letzterBesuch','modus',
                   'backup']) v[k] = DATA[k];
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
  };
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
  };
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

/* ---------- Die Räume ----------
   Ein Raum ist eine Liste von Möbeln mit Platz. Der Fußboden liegt bei
   BODEN_Y, alles steht mit der Unterkante bei 66 darauf. */

const EINRICHTUNG = {
  schlaf: [ {s:'fenster', x:12, y:18}, {s:'nachttisch', x:44, y:56},
            {s:'bett', x:58, y:48}, {s:'lampe', x:108, y:50} ],
  kueche: [ {s:'fenster', x:52, y:16}, {s:'herd', x:6, y:50},
            {s:'kuehlschrank', x:32, y:44}, {s:'tisch', x:84, y:54} ],
  wohnen: [ {s:'fenster', x:74, y:14}, {s:'regal', x:4, y:42},
            {s:'sofa', x:56, y:52}, {s:'pflanze', x:108, y:50} ],
  bad:    [ {s:'spiegel', x:62, y:22}, {s:'wanne', x:8, y:50},
            {s:'waschbecken', x:58, y:54} ],
  schrank:[ {s:'stange', x:46, y:16}, {s:'schrank', x:4, y:38},
            {s:'spiegel', x:104, y:24} ],
};

const BELLA_PLATZ = { schlaf:{x:14,y:46}, kueche:{x:54,y:46}, wohnen:{x:24,y:46},
                      bad:{x:88,y:46}, schrank:{x:76,y:46} };

/* Wo Bella schläft: im Bett, nicht daneben. */
const BETT_PLATZ = { x:68, y:50 };

/* Tageszeit als Rasterpunkt-Überzug. Ein weicher Verlauf wäre hier
   falsch — er würde die harten Pixel weichzeichnen. Stattdessen ein
   4×4-Muster: je dunkler die Stunde, desto mehr Punkte. */
const BAYER = [ [0,8,2,10], [12,4,14,6], [3,11,1,9], [15,7,13,5] ];

function tageszeit(d){
  const h = (d || new Date()).getHours();
  if (h >= 8  && h < 17) return { farbe:null,      dichte:0,  deckung:0   };
  if (h >= 5  && h < 8)  return { farbe:'#FF9E3D', dichte:5, deckung:.24 };
  if (h >= 17 && h < 20) return { farbe:'#FF5C5C', dichte:6, deckung:.26 };
  // Nicht 8 von 16: genau die Hälfte ergibt ein regelmäßiges
  // Schachbrett, das sich über das Wandmuster legt und flimmert.
  if (h >= 20 || h < 2)  return { farbe:'#2C2A82', dichte:6, deckung:.55 };
  return { farbe:'#1B1040', dichte:7, deckung:.62 };
}

/* Gedeckt wird mit Rasterpunkten und halber Deckkraft zugleich. Nur
   Punkte bei voller Deckkraft löschen die Hälfte des Bildes aus; nur
   Deckkraft ohne Punkte sähe nach Weichzeichner aus. Beides zusammen
   liest sich als Nacht und lässt jeden Pixel ein Pixel bleiben. */
function maleDaemmerung(ctx, mass, jetzt){
  const t = tageszeit(jetzt);
  if (!t.farbe || !t.dichte) return;
  const vorher = ctx.globalAlpha;
  ctx.globalAlpha = t.deckung;
  ctx.fillStyle = t.farbe;
  for (let y = 0; y < SCHIRM_H; y++){
    for (let x = 0; x < SCHIRM_B; x++){
      if (BAYER[y & 3][x & 3] < t.dichte) ctx.fillRect(x * mass, y * mass, mass, mass);
    }
  }
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

/* Zappeln: Bella hebt sich alle paar Takte um ein Pixel. Ein Pixel
   reicht — zwei sehen aus, als würde sie hüpfen. */
function zappel(){
  if (DATA.bella.schlaeft) return 0;
  const s = stimmung();
  if (s === 'froh') return (state.bildzaehler % 20 < 10) ? -1 : 0;
  if (s === 'traurig') return 0;
  return (state.bildzaehler % 40 < 20) ? 0 : -1;
}

function maleRaum(ctx, mass, jetzt){
  const raum = state.raum;
  const f = raumFarben(raum);

  ctx.fillStyle = f.wand[0];
  ctx.fillRect(0, 0, SCHIRM_B * mass, SCHIRM_H * mass);
  maleKachel(ctx, f.wandmuster, 0, 0, SCHIRM_B, BODEN_Y, mass, f.wand);
  maleKachel(ctx, f.bodenmuster, 0, BODEN_Y, SCHIRM_B, SCHIRM_H - BODEN_Y, mass, f.boden);

  // Die Fußleiste trennt Wand und Boden, sonst schwebt der Raum.
  ctx.fillStyle = PALETTE.K;
  ctx.fillRect(0, (BODEN_Y - 2) * mass, SCHIRM_B * mass, 2 * mass);

  const stoff = KLEIDER[DATA.outfit.kleid].farben;
  EINRICHTUNG[raum].forEach(m => {
    maleSprite(ctx, MOEBEL[m.s], m.x, m.y, mass, [stoff[0], stoff[1], stoff[2]]);
  });

  const plaetze = outfitPlaetze();
  if (DATA.bella.schlaeft && raum === 'schlaf'){
    maleRaster(ctx, BELLA_LIEGT, BETT_PLATZ.x, BETT_PLATZ.y, mass, plaetze);
  } else {
    const p = BELLA_PLATZ[raum];
    const y = p.y + zappel();
    maleRaster(ctx, BELLA_STEHT, p.x, y, mass, plaetze);
    maleRaster(ctx, GESICHTER[stimmung()], p.x + GESICHT_X, y + GESICHT_Y, mass, plaetze);
  }

  maleDaemmerung(ctx, mass, jetzt);
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

/* Der Maßstab kommt aus der gemessenen Breite, damit ein Pixel auf
   jedem Gerät ein ganzes Vielfaches bleibt. Krumme Vielfache sehen
   ausgefranst aus. jsdom misst nicht wirklich — dort gilt 2. */
/* Gemessen wird am Gehäuse, nicht am Schirmrahmen: der Rahmen legt
   sich um das Bild, und das Bild richtet sich nach ihm — das ginge im
   Kreis und bliebe beim kleinsten Maßstab stehen.
   RAHMENWERK ist, was Gehäusepolster (2×9), Rahmenlinie (2×4) und
   Innenabstand (2×3) zusammen wegnehmen. */
const RAHMENWERK = 32;

function massstab(){
  const geraet = document.querySelector('.geraet');
  const frei = geraet ? geraet.clientWidth - RAHMENWERK : 0;
  if (!(frei > 40)) return 2;
  return Math.max(1, Math.min(4, Math.floor(frei / SCHIRM_B)));
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

function zeichnen(){
  const c = document.getElementById('bild');
  if (!c || !c.getContext) return;
  const mass = massstab();
  if (c.width !== SCHIRM_B * mass){
    c.width = SCHIRM_B * mass;
    c.height = SCHIRM_H * mass;
    c.style.width = (SCHIRM_B * mass) + 'px';
    c.style.height = (SCHIRM_H * mass) + 'px';
  }
  const ctx = c.getContext('2d');
  if (!ctx) return;
  if ('imageSmoothingEnabled' in ctx) ctx.imageSmoothingEnabled = false;
  maleRaum(ctx, mass, new Date());
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
        : taste('SCHLAFEN', () => { sagen(b.name + ' schläft von selbst um ' + DATA.zeiten.einschlafen + '.'); render(); }),
      taste('ZUDECKEN', () => pflegen({ ausgeruht: 6, laune: 4,
        sagt: schlaeft ? '…' : 'Mmh, warm.' })),
      taste('LICHT AUS', () => pflegen({ ausgeruht: 5, laune: 2, sagt: schlaeft ? '…' : 'Gute Nacht.' })),
    ];
  }
  if (raum === 'kueche'){
    return [
      taste('KOCHEN', schlaeft ? wach('Später.') : fensterKochen, 'haupt'),
      taste('NASCHEN', schlaeft ? wach('Später.') : () => pflegen({ satt: 8, laune: 4, sagt: 'Nur ein kleines.' })),
      taste('VORRAT', () => { state.raum = 'kueche'; render(); }),
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
    return [
      taste('BADEN', schlaeft ? wach('Morgen.') : () => pflegen({ sauber: 42, laune: 7, ausgeruht: -3,
        sagt: 'Das Wasser ist genau richtig.' }), 'haupt'),
      taste('HAARE', schlaeft ? wach('Morgen.') : () => pflegen({ sauber: 14, laune: 5, sagt: 'Kitzelt.' })),
      taste('ZÄHNE', schlaeft ? wach('Morgen.') : () => pflegen({ sauber: 9, laune: 2, sagt: 'Blitzeblank.' })),
    ];
  }
  return [
    taste('ANZIEHEN', () => { state.raum = 'schrank'; render(); }, 'haupt'),
    ...AKTIVITAETEN.slice(2, 4).map(a => taste(a.name.toUpperCase(),
      schlaeft ? wach('Pst.') : () => pflegen({ laune:a.laune, ausgeruht:a.ausgeruht, sagt:a.sagt }))),
  ];
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
    }, h('span', { class:'farbe', style:'background:' + e.farbe }), e.name));
  });
  block.appendChild(gitter);
  return block;
}

function extraFuer(raum){
  const teile = [];

  if (raum === 'kueche'){
    const vorrat = h('div', { class:'gitter' });
    Object.entries(ZUTATEN).forEach(([id, z]) => {
      vorrat.appendChild(h('div', { class:'stueck' + ((DATA.vorrat[id] || 0) ? '' : ' aus') },
        h('span', { class:'farbe', style:'background:' + zutatFarbe(id) }),
        z.name, h('br'), 'x' + (DATA.vorrat[id] || 0)));
    });
    teile.push(h('div', { class:'block', id:'vorratblock' },
      h('div', { class:'blockkopf', text:'VORRAT' }), vorrat,
      h('div', { class:'leer', text:'Zutaten kommen mit der Post, wenn es ' + DATA.bella.name + ' gut geht.' })));
  }

  if (raum === 'schrank'){
    teile.push(waehler('KLEID',
      DATA.besitz.kleider.map(id => ({ id, name: KLEIDER[id].name, farbe: KLEIDER[id].farben[1] })),
      id => DATA.outfit.kleid === id,
      async id => { DATA.outfit.kleid = id; await pflegen({ laune: 3, sagt: 'Steht mir, oder?' }); }));
    teile.push(waehler('HAARE',
      DATA.besitz.haare.map(id => ({ id, name: HAARE[id].name, farbe: HAARE[id].farben[1] })),
      id => DATA.outfit.haar === id,
      async id => { DATA.outfit.haar = id; await pflegen({ laune: 3, sagt: 'Neue Farbe!' }); }));
  }

  // Einrichten geht in jedem Raum — es ist ja jedes Mal ein anderer.
  const r = DATA.raeume[raum];
  teile.push(waehler('TAPETE',
    DATA.besitz.waende.map(id => ({ id, name: WANDFARBEN[id].name, farbe: WANDFARBEN[id].farben[1] })),
    id => r.wand === id,
    async id => { r.wand = id; await persist(); render(); }));
  teile.push(waehler('MUSTER',
    ['wand_streifen','wand_punkte','wand_karo','wand_herzen'].map(id => ({
      id, name: { wand_streifen:'Streifen', wand_punkte:'Punkte', wand_karo:'Karo', wand_herzen:'Herzen' }[id],
      farbe: WANDFARBEN[r.wand].farben[2] })),
    id => r.wandmuster === id,
    async id => { r.wandmuster = id; await persist(); render(); }));
  teile.push(waehler('BODEN',
    DATA.besitz.boeden.map(id => ({ id, name: BODENFARBEN[id].name, farbe: BODENFARBEN[id].farben[0] })),
    id => r.boden === id,
    async id => { r.boden = id; await persist(); render(); }));

  return teile;
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
      onclick: () => { state.raum = r; state.blase = null; render(); },
    }, maleIcon(icons[r]), h('span', { text: kurz[r] })));
  });
}

/* ---------- Start ---------- */

async function start(){
  try { DATA = adoptVault(await Store.loadVault()); } catch (e){ DATA = leererVault(); }

  const weg = (Date.now() - new Date(DATA.letzterBesuch)) / 60000;
  const minuten = standFortschreiben();
  postPruefen(minuten);
  DATA.letzterBesuch = new Date().toISOString();
  await persist();

  navBauen();
  document.getElementById('wohlbtn').onclick = fensterWerte;
  document.getElementById('postbtn').onclick = fensterPost;
  document.getElementById('settingsbtn').onclick = fensterEinstellungen;

  if (weg > 60 * 20) sagen('Du warst lange weg. Schön, dass du da bist.', 6000);
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
