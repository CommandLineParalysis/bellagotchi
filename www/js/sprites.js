/* ============================================================
   Bellagotchi — die Pixelgrafik.

   Jedes Bild steht als Textraster da: ein Zeichen je Pixel, die
   Zuordnung Zeichen → Farbe in PALETTE. Das ist der Grund, warum hier
   keine PNG liegen — die App lädt nichts nach, die Bilder stehen im
   Quelltext, und eine Farbe lässt sich an einer Stelle umstellen statt
   in zwanzig Dateien.

   Die Ziffern 1–6 sind keine festen Farben, sondern Plätze: Kleid und
   Haare bekommen ihre Farbe erst beim Zeichnen aus dem Outfit. Deshalb
   braucht ein neues Kleid kein neues Bild.
   ============================================================ */

const PALETTE = {
  '.': null,              // durchsichtig
  'K': '#2B1B3D',         // Umriss dunkel
  'L': '#4A3266',         // Umriss weich
  'W': '#FFF8FF',         // Weiß
  'w': '#DCC9EC',         // Grauweiß

  'h': '#FFD9BC',  'H': '#EDAE86',  'r': '#FF8AA8',      // Haut, Schatten, Wangen

  'p': '#FFC2E2',  'P': '#FF4FA3',  'q': '#C41E76',      // Rosa
  'o': '#FF9E3D',  'O': '#FF5C5C',  'e': '#C43030',      // Orange, Rot
  'y': '#FFF06A',  'Y': '#FFD166',  'z': '#D9A033',      // Gelb
  'g': '#9CF5B8',  'G': '#4BE38A',  'n': '#2FB86A',      // Grün
  't': '#7FE6D3',  'T': '#30F3CF',  'u': '#189E9B',      // Türkis
  'c': '#9AD0FF',  'C': '#4FA8FF',  'd': '#2C5FD6',      // Blau
  'v': '#C9A6FF',  'V': '#A65CFF',  'x': '#6B33B8',      // Lila
  'm': '#C98B5A',  'M': '#8A5B2E',  'N': '#5C3A1B',      // Holz
};

/* Die sechs Plätze, die das Outfit füllt. */
const PLAETZE = ['1', '2', '3', '4', '5', '6'];

/* Kleiderfarben: je drei Stufen, hell → voll → dunkel. Ein Eintrag hier
   ist ein Kleid; mehr braucht es nicht. */
const KLEIDER = {
  rosenrot:   { name: 'Rosenrot',   farben: ['#FFC2E2', '#FF4FA3', '#C41E76'] },
  himmelblau: { name: 'Himmelblau', farben: ['#C7E4FF', '#4FA8FF', '#2C5FD6'] },
  minzgruen:  { name: 'Minzgrün',   farben: ['#C4FBD8', '#4BE38A', '#2FB86A'] },
  sonnengelb: { name: 'Sonnengelb', farben: ['#FFF7B8', '#FFD166', '#D9A033'] },
  lavendel:   { name: 'Lavendel',   farben: ['#E2D2FF', '#A65CFF', '#6B33B8'] },
  korall:     { name: 'Korall',     farben: ['#FFD2C2', '#FF7A5C', '#C43030'] },
  tuerkis:    { name: 'Türkis',     farben: ['#BFF6EC', '#30F3CF', '#189E9B'] },
  mitternacht:{ name: 'Mitternacht',farben: ['#B9A9E8', '#6B4FD6', '#392A82'] },
};

const HAARE = {
  beere:    { name: 'Beere',    farben: ['#FF6FD8', '#C13BC9', '#7B2BA8'] },
  honig:    { name: 'Honig',    farben: ['#FFE08A', '#F0B44A', '#B87A22'] },
  kastanie: { name: 'Kastanie', farben: ['#D08A5A', '#9A5A2E', '#5C3418'] },
  nacht:    { name: 'Nacht',    farben: ['#7E7AA8', '#4A4470', '#26223D'] },
  mint:     { name: 'Mint',     farben: ['#A8F8DC', '#48D8B0', '#1E8F76'] },
  koralle:  { name: 'Koralle',  farben: ['#FFB0A0', '#FF6B52', '#B83A26'] },
};

/* ---------- Bella ----------
   24 × 32. Die Ziffern sind Plätze: 1–3 Kleid (hell/voll/dunkel),
   4–6 Haare. Drei Haltungen, sonst wirkt sie tot. */

const BELLA_STEHT = [
  '.......KKKKKKKKKK.......',
  '.....KK5555555555KK.....',
  '....K44444444444444K....',
  '...K4444444444444444K...',
  '...K4455555555555544K...',
  '...K455hhhhhhhhhh554K...',
  '...K45hhhhhhhhhhhh54K...',
  '...K45hhhhhhhhhhhh54K...',
  '...K45hKKhhhhhhKKh54K...',
  '...K45hKWhhhhhhKWh54K...',
  '...K45hrhhhhhhhhrh54K...',
  '...K45hhhhhKKhhhhh54K...',
  '...K455hhhhhhhhhh554K...',
  '....K55hhhhhhhhhh55K....',
  '.....K5hhhhhhhhhh5K.....',
  '.....K55hhHhhHhh55K.....',
  '....K5555HhhhhH5555K....',
  '...Khh222222222222hhK...',
  '..Khh22222222222222hhK..',
  '..Khh22222222222222hhK..',
  '.Khh2222222222222222hhK.',
  '.Khh2222222222222222hhK.',
  '.KhH2222222222222222HhK.',
  '.K22222222222222222222K.',
  'K2222222222222222222222K',
  'K1111111111111111111111K',
  'K1111111111111111111111K',
  '.KKKKKKKKKKKKKKKKKKKKKK.',
  '........hhh..hhh........',
  '........hhh..hhh........',
  '.......3333..3333.......',
  '.......KKKK..KKKK.......',
];

/* Gesichter als Flicken über dem Grundbild: 12 × 5 an der Stelle (6, 8).
   Eine eigene Haltung je Stimmung wäre viermal dasselbe Kleid. */
const GESICHT_X = 6, GESICHT_Y = 8;

const GESICHTER = {
  normal:  ['hKKhhhhhhKKh', 'hKWhhhhhhKWh', 'hrhhhhhhhhrh', 'hhhhhKKhhhhh', '5hhhhhhhhhh5'],
  froh:    ['hhKhhhhhhKhh', 'hKhKhhhhKhKh', 'hrhhhhhhhhrh', 'hhhhKPPKhhhh', '5hhhhKKhhhh5'],
  traurig: ['hKKhhhhhhKKh', 'hKWhhhhhhKWh', 'hChhhhhhhhrh', 'hChhhKKhhhhh', '5hhhhhhhhhh5'],
  schlaef: ['hhhhhhhhhhhh', 'hKKKhhhKKKhh', 'hhhhhhhhhhhh', 'hhhhhOhhhhhh', '5hhhhhhhhhh5'],
  satt:    ['hhKhhhhhhKhh', 'hKhKhhhhKhKh', 'hrhhhhhhhhrh', 'hhhKPPPPKhhh', '5hhhKOOKhhh5'],
};

/* Bella im Bett: eigene Haltung, weil eine gedrehte Stehende albern aussieht. */
const BELLA_LIEGT = [
  '..........KKKKKKKKKK....',
  '........KK4444444444KK..',
  '.......K4444444444444K..',
  '......K4455hhhhhh55444K.',
  '.....K455hhhhhhhhhh554K.',
  '.....K45hKKKhhhKKKhh54K.',
  '.....K45hhhhhhhhhhhh54K.',
  '.....K45hhhhOhhhhhhh54K.',
  '.....K455hhhhhhhhhh554K.',
  '......K55hhhhhhhhh555K..',
  '.......K5555hhh5555K....',
  '........KKKKKKKKKKK.....',
];

/* ---------- Kacheln ----------
   Wand und Boden werden gekachelt, nicht als ein großes Bild gezeichnet:
   ein 8 × 8-Muster reicht für eine ganze Wand und lässt sich über die
   Plätze 1–3 (Wand) bzw. 4–6 (Boden) umfärben. */

const KACHELN = {
  wand_streifen: ['11211112','11211112','11211112','11233112','11211112','11211112','11211112','11233112'],
  wand_punkte:   ['11111111','11211111','12321111','11211111','11111111','11111211','11112321','11111211'],
  wand_karo:     ['11112222','11112222','11112222','11112222','22221111','22221111','22221111','22221111'],
  wand_herzen:   ['11111111','11211211','12321321','12222221','11232311','11123111','11111111','11111111'],
  /* Boden wie Wand über die Plätze 1–3: beide werden getrennt gemalt
     und bekommen je ihre eigenen drei Farben. */
  boden_diele:   ['11111111','12222221','11111111','33333333','11111111','12222221','11111111','33333333'],
  boden_fliese:  ['11111113','12222223','12222223','12222223','12222223','12222223','11111113','33333333'],
  boden_teppich: ['12112112','21221221','11211211','12112112','21221221','11211211','12112112','21221221'],
};

const WANDFARBEN = {
  rosa:     { name: 'Rosa',     farben: ['#FFC2E2', '#FF8AC4', '#FF4FA3'] },
  himmel:   { name: 'Himmel',   farben: ['#C7E4FF', '#9AD0FF', '#4FA8FF'] },
  minze:    { name: 'Minze',    farben: ['#C4FBD8', '#9CF5B8', '#4BE38A'] },
  butter:   { name: 'Butter',   farben: ['#FFF7B8', '#FFF06A', '#FFD166'] },
  flieder:  { name: 'Flieder',  farben: ['#E2D2FF', '#C9A6FF', '#A65CFF'] },
  pfefferm: { name: 'Pfeffermz',farben: ['#BFF6EC', '#7FE6D3', '#30F3CF'] },
};

const BODENFARBEN = {
  eiche:    { name: 'Eiche',    farben: ['#C98B5A', '#DBA477', '#8A5B2E'] },
  kirsch:   { name: 'Kirsche',  farben: ['#B4654A', '#CE8168', '#7A3A28'] },
  perle:    { name: 'Perle',    farben: ['#EFE4F5', '#FFF8FF', '#DCC9EC'] },
  wiese:    { name: 'Wiese',    farben: ['#7ED89B', '#9CF5B8', '#2FB86A'] },
  beere:    { name: 'Beere',    farben: ['#E79AC6', '#FFC2E2', '#C41E76'] },
  see:      { name: 'See',      farben: ['#79B6EE', '#9AD0FF', '#2C5FD6'] },
};

/* ---------- Möbel ----------
   Aus Grundformen gebaut und als Raster abgelegt. Die Plätze 1–3
   nehmen den Bezugsstoff bzw. Stoffbezug auf, damit Bett und Sofa
   zur Wandfarbe passen können. */
const MOEBEL = {
  bett: { b:44, h:24, p:[
    'KKKKKKKK....................................',
    'KMMMMMMK....................................',
    'KMNNNNMK....................................',
    'KMNNNNMK....................................',
    'KMNNNNMK....................................',
    'KMNNNNMK.LLLLLLLLLLLLL......................',
    'KMNNNNMK.LwwwwwWWWWWWL......................',
    'KMNNNNMK.LwwwwwWWWWWWL......................',
    'KMNNNNKKKLwwwwwWWWWWWLKKKKKKKKKKKKKKKKKKKKKK',
    'KMNNNNKMMLwwwwwWWWWWWLM3333333333333333333MK',
    'KMNNNNKMWLLLLLLLLLLLLLW3111111111111111113MK',
    'KMNNNNKMWWWWWWWWWWWWWWW3111111111111111113MK',
    'KMNNNNKMWWWWWWWWWWWWWWW3111111111111111113MK',
    'KMNNNNKMWWWWWWWWWWWWWWW3222222222222222223MK',
    'KMNNNNKMWWWWWWWWWWWWWWW3222222222222221223MK',
    'KMNNNNKMWWWWWWWWWWWWWWW3222212222222222223MK',
    'KMNNNNKMWWWWWWWWWWWWWWW3222222222212222223MK',
    'KMMMMMKMWWWWWWWWWWWWWWW3222222222222222223MK',
    'KMMMMMKMMMMMMMMMMMMMMMM3333333333333333333MK',
    'KMMMMMKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
    'KMMMMMMK.NNN..........................NNN...',
    'KKKKKKKK.NNN..........................NNN...',
    '.........NNN..........................NNN...',
    '.........NNN..........................NNN...',
  ]},
  fenster: { b:24, h:20, p:[
    'KKKKKKKKKKKKKKKKKKKKKKKK',
    'KMMMMMMMMMMMMMMMMMMMMMMK',
    'KMCCCCCCCCCMMCCCCCCCCCMK',
    'KMCCCCCCCCCMMCCCCCCCCCMK',
    'KMCCCWWCCCCMMCCCCCCCCCMK',
    'KMCCCCWCCCCMMCCCCCCCCCMK',
    'KMCCCCCCCCCMMCCWWWCCCCMK',
    'KMCCCCCCCCCMMCCCWCCCCCMK',
    'KMcccccccccMMcccccccccMK',
    'KMMMMMMMMMMMMMMMMMMMMMMK',
    'KMMMMMMMMMMMMMMMMMMMMMMK',
    'KMcccccccccMMcccccccccMK',
    'KMcccccccWWMMcccccccccMK',
    'KMccccccccWMMcccccccccMK',
    'KMcccccccccMMcccccccccMK',
    'KMcccccccccMMcccccccccMK',
    'KMcccccccccMMcccccccccMK',
    'KMcccccccccMMcccccccccMK',
    'KMMMMMMMMMMMMMMMMMMMMMMK',
    'KKKKKKKKKKKKKKKKKKKKKKKK',
  ]},
  lampe: { b:12, h:22, p:[
    '.KKKKKKKKKK.',
    '.KyyyyyyyyK.',
    '.KyyyyyyyyK.',
    '.KyyyyyyyyK.',
    '.KYYYYYYYYK.',
    '.KYYYYYYYYK.',
    '.KKKKKKKKKK.',
    '.....LL.....',
    '.....LL.....',
    '.....LL.....',
    '.....LL.....',
    '.....LL.....',
    '.....LL.....',
    '.....LL.....',
    '.....LL.....',
    '.....LL.....',
    '.....LL.....',
    '.....LL.....',
    '..KKKKKKKK..',
    '..KMMMMMMK..',
    '..KKKKKKKK..',
    '............',
  ]},
  nachttisch: { b:14, h:16, p:[
    'KKKKKKKKKKKKKK',
    'KMMMMMMMMMMMMK',
    'KMMMMMMMMMMMMK',
    'KMNNNNNNNNNNMK',
    'KMNNNNNNNNNNMK',
    'KMNNNNYYNNNNMK',
    'KMNNNNNNNNNNMK',
    'KMMMMMMMMMMMMK',
    'KMMMMMMMMMMMMK',
    'KMNNNNNNNNNNMK',
    'KMNNNNNNNNNNMK',
    'KMNNNNYYNNNNMK',
    'KMNNNNNNNNNNMK',
    'KMMMMMMMMMMMMK',
    'KMMMMMMMMMMMMK',
    'KKKKKKKKKKKKKK',
  ]},
  herd: { b:22, h:22, p:[
    'KKKKKKKKKKKKKKKKKKKKKK',
    'KLLLLLLLLLLLLLLLLLLLLK',
    'KLLLKKKKKLLLLKKKKKLLLK',
    'KLLLKOOOKLLLLKOOOKLLLK',
    'KLLLKOOOKLLLLKOOOKLLLK',
    'KLLLKKKKKLLLLKKKKKLLLK',
    'KLLLLLLLLLLLLLLLLLLLLK',
    'KwwwwwwwwwwwwwwwwwwwwK',
    'KwKwwwwwwwwwwwwwwwwKwK',
    'KwKKKKKKKKKKKKKKKKKKwK',
    'KwKooooooooooooooooKwK',
    'KwKoeeeeeeeeeeeeeeoKwK',
    'KwKoeeeeeeeeeeeeeeoKwK',
    'KwKoeeeeeeeeeeeeeeoKwK',
    'KwKoeeeeeeeeeeeeeeoKwK',
    'KwKoeeeeeeeeeeeeeeoKwK',
    'KwKoeeeeeeeeeeeeeeoKwK',
    'KwKoeeeeeeeeeeeeeeoKwK',
    'KwKooooooooooooooooKwK',
    'KwKKKKKKKKKKKKKKKKKKwK',
    'KwwwwwwwwwwwwwwwwwwwwK',
    'KKKKKKKKKKKKKKKKKKKKKK',
  ]},
  kuehlschrank: { b:18, h:28, p:[
    'KKKKKKKKKKKKKKKKKK',
    'KWWWWWWWWWWWWWWWWK',
    'KWWWWWWWWWWWWWWWWK',
    'KWWWWWWWWWWWWLLWWK',
    'KWWWTTTWWWWWWLLWWK',
    'KWWWWWWWWWWWWLLWWK',
    'KWWWWWWWWWWWWLLWWK',
    'KWWWWWWWWWWWWLLWWK',
    'KWWWWWWWWWWWWLLWWK',
    'KWWWWWWWWWWWWWWWWK',
    'KKKKKKKKKKKKKKKKKK',
    'KWWWWWWWWWWWWWWWWK',
    'KWWWWWWWWWWWWWWWWK',
    'KWWWWWWWWWWWWLLWWK',
    'KWWWWWWWWWWWWLLWWK',
    'KWWWPPWWWWWWWLLWWK',
    'KWWWPPWWWWWWWLLWWK',
    'KWWWWWWWWWWWWLLWWK',
    'KWWWWWWWWWWWWLLWWK',
    'KWWWWWWWPPWWWLLWWK',
    'KWWWWWWWWWWWWLLWWK',
    'KWWWWWWWWWWWWWWWWK',
    'KWWWWWWWWWWWWWWWWK',
    'KWWWWWWWWWWWWWWWWK',
    'KWWWWWWWWWWWWWWWWK',
    'KWWWWWWWWWWWWWWWWK',
    'KWWWWWWWWWWWWWWWWK',
    'KKKKKKKKKKKKKKKKKK',
  ]},
  tisch: { b:28, h:18, p:[
    'KKKKKKKKKKKKKKKKKKKKKKKKKKKK',
    'KmmmmmmmmmmmmmmmmmmmmmmmmmmK',
    'KmmmmmmmmmmmmmmmmmmmmmmmmmmK',
    'KmmmmmmmmmmmmmmmmmmmmmmmmmmK',
    'KKKKKKKKKKKKKKKKKKKKKKKKKKKK',
    '...KKK................KKK...',
    '...KMK................KMK...',
    '...KMK................KMK...',
    '...KMK................KMK...',
    '...KMK................KMK...',
    '...KMK................KMK...',
    '...KMK................KMK...',
    '...KMK................KMK...',
    '...KMK................KMK...',
    '...KMK................KMK...',
    '...KMK................KMK...',
    '...KMK................KMK...',
    '...KKK................KKK...',
  ]},
  sofa: { b:42, h:20, p:[
    'KKKKKK..............................KKKKKK',
    'K3333K..............................K3333K',
    'K3333KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK3333K',
    'K3333K222222222222222222222222222222K3333K',
    'K3333K233333333333333333333333333332K3333K',
    'K3333K231111111111111111111111111132K3333K',
    'K3333K231111111111111111111111111132K3333K',
    'K3333K23111111111111WW11111111111132K3333K',
    'K3333K23111111111111WW11111111111132K3333K',
    'K3333K231111111111111111111111111132K3333K',
    'K3333K231111111111111111111111111132K3333K',
    'K3333K233333333333333333333333333332K3333K',
    'K3333K222222222222222222222222222222K3333K',
    'K3333K211111111111111111111111111112K3333K',
    'K3333K211111111111111111111111111112K3333K',
    'K3333K211111111111111111111111111112K3333K',
    'K3333K211111111111111111111111111112K3333K',
    'K3333K211111111111111111111111111112K3333K',
    'K3333K222222222222222222222222222222K3333K',
    'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
  ]},
  regal: { b:22, h:30, p:[
    'KKKKKKKKKKKKKKKKKKKKKK',
    'KMMMMMMMMMMMMMMMMMMMMK',
    'KMKKKMKKKMKKKMKKKMKKKK',
    'KMKPKMKOKMKTKMKVKMKGKK',
    'KMKPKMKOKMKTKMKVKMKGKK',
    'KMKPKMKOKMKTKMKVKMKGKK',
    'KMKPKMKOKMKTKMKVKMKGKK',
    'KMKPKMKOKMKTKMKVKMKGKK',
    'KMKKKMKKKMKKKMKKKMKKKK',
    'KNNNNNNNNNNNNNNNNNNNNK',
    'KMMMMMMMMMMMMMMMMMMMMK',
    'KMMMMMMMMMMMMMMMMMMMMK',
    'KMKKKMKKKMKKKMKKKMKKKK',
    'KMKCKMKGKMKYKMKPKMKVKK',
    'KMKCKMKGKMKYKMKPKMKVKK',
    'KMKCKMKGKMKYKMKPKMKVKK',
    'KMKCKMKGKMKYKMKPKMKVKK',
    'KMKCKMKGKMKYKMKPKMKVKK',
    'KMKKKMKKKMKKKMKKKMKKKK',
    'KNNNNNNNNNNNNNNNNNNNNK',
    'KMMMMMMMMMMMMMMMMMMMMK',
    'KMMMMMMMMMMMMMMMMMMMMK',
    'KMKKKMKKKMKKKMKKKMKKKK',
    'KMKVKMKTKMKOKMKCKMKPKK',
    'KMKVKMKTKMKOKMKCKMKPKK',
    'KMKVKMKTKMKOKMKCKMKPKK',
    'KMKVKMKTKMKOKMKCKMKPKK',
    'KMKVKMKTKMKOKMKCKMKPKK',
    'KMKKKMKKKMKKKMKKKMKKKK',
    'KNNNNNNNNNNNNNNNNNNNNK',
  ]},
  pflanze: { b:16, h:22, p:[
    '................',
    '....gGGG.gGGG...',
    '....GGGG.GGGG...',
    '....GGGG.GGGG...',
    '..gGGGGg.GGGgG..',
    '..GGGG....GGGG..',
    '..GGGG.nn.GGGG..',
    '..GGGg.nn.GGGg..',
    '......gGGG......',
    '.gGGG.GGGG......',
    '.GGGG.GGGG......',
    '.GGGG.GGGg......',
    '.GGGg..nn.......',
    '..KKKKKnnKKKKK..',
    '..KOOOOOOOOOOK..',
    '..KKKKKKKKKKKK..',
    '...KooooooooK...',
    '...KooooooooK...',
    '...KooooooooK...',
    '...KooooooooK...',
    '...KooooooooK...',
    '...KKKKKKKKKK...',
  ]},
  wanne: { b:42, h:22, p:[
    '...................................LLLLLL.',
    '...................................LLLLLL.',
    '......................................LLL.',
    '......................................LLL.',
    'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKLLLK',
    'KWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWK',
    'KWCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCWK',
    'KWCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCWK',
    'KWCCCCCCWWCCCCCCCCCCCCCCCCCCCCWCCCCCCCCCWK',
    'KWCCCCCCCCCCCCCCCCCCWWCCCCCCCCCCCCCCCCCCWK',
    'KWccccccccccccccccccccccccccccccccccccccWK',
    'KWccccccccccccccccccccccccccccccccccccccWK',
    'KWccccccccccccccccccccccccccccccccWcccccWK',
    'KWccccccccccccWcccccccccccccccccccccccccWK',
    'KWccccccccccccccccccccccccWcccccccccccccWK',
    'KWccccccccccccccccccccccccccccccccccccccWK',
    'KWccccccccccccccccccccccccccccccccccccccWK',
    'KWccccccccccccccccccccccccccccccccccccccWK',
    'KWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWK',
    'KWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWK',
    'KWLLLLWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWLLLLWK',
    'KKLLLLKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKLLLLKK',
  ]},
  waschbecken: { b:18, h:18, p:[
    '......LLLLL.......',
    '......LLLLL.......',
    '........LL........',
    '........LL........',
    'KKKKKKKKKKKKKKKKKK',
    'KWWWWWWWWWWWWWWWWK',
    'KWccccccccccccccWK',
    'KWccccccccccccccWK',
    'KWccccccccccccccWK',
    'KWccccccccccccccWK',
    'KWWWWWWWWWWWWWWWWK',
    'KKKKKKKKKKKKKKKKKK',
    '.......KKKK.......',
    '.......KwwK.......',
    '.......KwwK.......',
    '.......KwwK.......',
    '.......KwwK.......',
    '.......KKKK.......',
  ]},
  spiegel: { b:16, h:24, p:[
    'KKKKKKKKKKKKKKKK',
    'KYYYYYYYYYYYYYYK',
    'KYLLLLLLLLLLLLYK',
    'KYLccccccccccLYK',
    'KYLccccccccccLYK',
    'KYLcWWcccccccLYK',
    'KYLcWWcccccccLYK',
    'KYLccccccccccLYK',
    'KYLccccccccccLYK',
    'KYLccccccccccLYK',
    'KYLccccccccccLYK',
    'KYLccccccccccLYK',
    'KYLccccccccccLYK',
    'KYLccccccccccLYK',
    'KYLccccccccccLYK',
    'KYLcccccccWWcLYK',
    'KYLcccccccWWcLYK',
    'KYLccccccccccLYK',
    'KYLccccccccccLYK',
    'KYLccccccccccLYK',
    'KYLccccccccccLYK',
    'KYLLLLLLLLLLLLYK',
    'KYYYYYYYYYYYYYYK',
    'KKKKKKKKKKKKKKKK',
  ]},
  schrank: { b:30, h:34, p:[
    'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
    'KMMMMMMMMMMMMMNNMMMMMMMMMMMMMK',
    'KMMMMMMMMMMMMMNNMMMMMMMMMMMMMK',
    'KMNNNNNNNNNNNMNNMNNNNNNNNNNNMK',
    'KMNNNNNNNNNNNMNNMNNNNNNNNNNNMK',
    'KMNNNNNNNNNNNMNNMNNNNNNNNNNNMK',
    'KMNNNNNNNNNNNMNNMNNNNNNNNNNNMK',
    'KMNNNNNNNNNNNMNNMNNNNNNNNNNNMK',
    'KMNNNNNNNNNNNMNNMNNNNNNNNNNNMK',
    'KMNNNNNNNNNNNMNNMNNNNNNNNNNNMK',
    'KMNNNNNNNNNNNMNNMNNNNNNNNNNNMK',
    'KMNNNNNNNNNNNMNNMNNNNNNNNNNNMK',
    'KMNNNNNNNNNNNMNNMNNNNNNNNNNNMK',
    'KMNNNNNNNNNNNMNNMNNNNNNNNNNNMK',
    'KMNNNNNNNNNNNMNNMNNNNNNNNNNNMK',
    'KMNNNNNNNNNYYMNNMYYNNNNNNNNNMK',
    'KMNNNNNNNNNYYMNNMYYNNNNNNNNNMK',
    'KMNNNNNNNNNYYMNNMYYNNNNNNNNNMK',
    'KMNNNNNNNNNYYMNNMYYNNNNNNNNNMK',
    'KMNNNNNNNNNNNMNNMNNNNNNNNNNNMK',
    'KMNNNNNNNNNNNMNNMNNNNNNNNNNNMK',
    'KMNNNNNNNNNNNMNNMNNNNNNNNNNNMK',
    'KMNNNNNNNNNNNMNNMNNNNNNNNNNNMK',
    'KMMMMMMMMMMMMMNNMMMMMMMMMMMMMK',
    'KMMMMMMMMMMMMMNNMMMMMMMMMMMMMK',
    'KMMMMMMMMMMMMMNNMMMMMMMMMMMMMK',
    'KMNNNNNNNNNNNNNNNNNNNNNNNNNNMK',
    'KMNNNNNNNNNNNNNNNNNNNNNNNNNNMK',
    'KMNNNNNNNNNNNNNNNNNNNNNNNNNNMK',
    'KMNNNNNNNNNNNNNNNNNNNNNNNNNNMK',
    'KMNNNNNNNNNNNNNNNNNNNNNNNNNNMK',
    'KMMMMMMMMMMMMMNNMMMMMMMMMMMMMK',
    'KMMMMMMMMMMMMMNNMMMMMMMMMMMMMK',
    'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
  ]},
  stange: { b:28, h:16, p:[
    '............................',
    'LLLLLLLLLLLLLLLLLLLLLLLLLLLL',
    'LLLLLLLLLLLLLLLLLLLLLLLLLLLL',
    '....L......L......L.....L...',
    '....L......L......L.....L...',
    '....L......L......L.....L...',
    '...KKKKK..KKKKK..KKKKK.KKKKK',
    '...KPPPK..KTTTK..KYYYK.KVVVK',
    '...KPPPK..KTTTK..KYYYK.KVVVK',
    '...KPPPK..KTTTK..KYYYK.KVVVK',
    '...KPPPK..KTTTK..KYYYK.KVVVK',
    '...KPPPK..KTTTK..KYYYK.KVVVK',
    '...KPPPK..KTTTK..KYYYK.KVVVK',
    '...KKKKK..KKKKK..KKKKK.KKKKK',
    '............................',
    '............................',
  ]},
};

/* ---------- Zeichnen ----------
   Ein Raster wird Pixel für Pixel auf das Canvas gemalt. Kein
   Glätten, keine Zwischentöne: jedes Quadrat bleibt ein Quadrat, sonst
   sähe die Pixelgrafik auf einem hochauflösenden Handy verwaschen aus.

   `plaetze` füllt die Ziffern 1–6. Bella bekommt dort Kleid- und
   Haarfarben, eine Kachel Wand- oder Bodenfarben. */
function maleRaster(ctx, raster, x, y, mass, plaetze){
  for (let j = 0; j < raster.length; j++){
    const zeile = raster[j];
    for (let i = 0; i < zeile.length; i++){
      const ch = zeile[i];
      if (ch === '.') continue;
      const nr = PLAETZE.indexOf(ch);
      const farbe = nr >= 0 ? (plaetze && plaetze[nr]) : PALETTE[ch];
      if (!farbe) continue;
      ctx.fillStyle = farbe;
      ctx.fillRect((x + i) * mass, (y + j) * mass, mass, mass);
    }
  }
}

function maleSprite(ctx, sprite, x, y, mass, plaetze){
  maleRaster(ctx, sprite.p, x, y, mass, plaetze);
}

/* Eine Fläche kacheln. Wand und Boden bestehen aus demselben 8×8-Stück. */
function maleKachel(ctx, kachel, x, y, breite, hoehe, mass, plaetze){
  for (let j = 0; j < hoehe; j += 8){
    for (let i = 0; i < breite; i += 8){
      maleRaster(ctx, kachel, x + i, y + j, mass, plaetze);
    }
  }
}

/* Prüft jedes Raster auf gleiche Zeilenlängen und bekannte Zeichen.
   Ein Tippfehler im Bild fällt sonst erst auf, wenn ein Loch im Sofa
   klafft. */
function pruefeRaster(){
  const fehler = [];
  const erlaubt = new Set(Object.keys(PALETTE).concat(PLAETZE));
  const pruefe = (name, rows, breite) => {
    rows.forEach((r, j) => {
      if (breite && r.length !== breite) fehler.push(name + ' Zeile ' + j + ': ' + r.length + ' statt ' + breite);
      for (const ch of r) if (!erlaubt.has(ch)) fehler.push(name + ' Zeile ' + j + ': unbekannt ' + JSON.stringify(ch));
    });
  };
  pruefe('bella', BELLA_STEHT, 24);
  pruefe('bella_liegt', BELLA_LIEGT, 24);
  Object.entries(GESICHTER).forEach(([n, g]) => pruefe('gesicht_' + n, g, 12));
  Object.entries(KACHELN).forEach(([n, k]) => pruefe('kachel_' + n, k, 8));
  [MOEBEL, ICONS, KLEINKRAM].forEach(satz => Object.entries(satz).forEach(([n, m]) => {
    if (m.p.length !== m.h) fehler.push(n + ': ' + m.p.length + ' Zeilen statt ' + m.h);
    pruefe(n, m.p, m.b);
  }));
  return fehler;
}
const ICONS = {
  ic_bett: { b:16, h:16, p:[
    '................',
    '................',
    '................',
    '................',
    '..KKKKK.........',
    '..KpppK.........',
    '..KpppK.........',
    '.KKKKKKKKKKKKKK.',
    '.KWWWWWWWWWWWWK.',
    '.KWWWWWPPPPPPPK.',
    '.KWWWWWPPPPPPPK.',
    '.KWWWWWPPPPPPPK.',
    '.KWWWWWPPPPPPPK.',
    '.MMKKKKKKKKKKMM.',
    '.MM..........MM.',
    '.MM..........MM.',
  ]},
  ic_herd: { b:16, h:16, p:[
    '................',
    '................',
    '...KKKK..KKKK...',
    '...KOOK..KOOK...',
    '...KOOK..KOOK...',
    '...KKKK..KKKK...',
    '..KKKKKKKKKKKK..',
    '..KwwwwwwwwwwK..',
    '..KwwwwwwwwwwK..',
    '..KwwwwwwwwwwK..',
    '..KwwwwwwwwwwK..',
    '..KwwwwwwwwwwK..',
    '..KwwwwwwwwwwK..',
    '..KKKKKKKKKKKK..',
    '................',
    '................',
  ]},
  ic_sofa: { b:16, h:16, p:[
    '................',
    '................',
    '................',
    '................',
    'qqq..........qqq',
    'qqq..........qqq',
    'qqqKKKKKKKKKKqqq',
    'qqqPPPPPPPPPPqqq',
    'qqqppppppppppqqq',
    'qqqppppppppppqqq',
    'qqqppppppppppqqq',
    'qqqppppppppppqqq',
    'qqqPPPPPPPPPPqqq',
    'qqqKKKKKKKKKKqqq',
    '................',
    '................',
  ]},
  ic_wanne: { b:16, h:16, p:[
    '................',
    '................',
    '................',
    '.....c....c.....',
    '....c...........',
    '...........c....',
    '................',
    '.KKKKKKKKKKKKKK.',
    '.KWWWWWWWWWWWWK.',
    '.KWCCCCCCCCCCWK.',
    '.KWCCCCCCCCCCWK.',
    '.KWCCCCCCCCCCWK.',
    '.KWCCCCCCCCCCWK.',
    '.KKKKKKKKKKKKKK.',
    '................',
    '................',
  ]},
  ic_kleid: { b:16, h:16, p:[
    '................',
    '................',
    '.....KKKKKK.....',
    '.....KTTTTK.....',
    '.....KKKKKK.....',
    '...KKKKKKKKKK...',
    '...KTTTTTTTTK...',
    '...KTttttttTK...',
    '...KTttttttTK...',
    '...KTttttttTK...',
    '...KTttttttTK...',
    '...KTTTTTTTTK...',
    '...KKKKKKKKKK...',
    '................',
    '................',
    '................',
  ]},
};
const KLEINKRAM = {
  sp_ente: { b:14, h:12, p:[
    '..............',
    '.......KKKK...',
    '.......KYYK...',
    '.......KYKKOoo',
    '.......KYYKooO',
    '..KKKKKKKKK...',
    '..KyyyyyyyK...',
    '..KyyyyyyyK...',
    '..KyyyyyyyK...',
    '..KYYYYYYYK...',
    '..KKKKKKKKK...',
    '..............',
  ]},
  sp_schiff: { b:16, h:12, p:[
    '................',
    '.......MM.......',
    '.......MMLLLLL..',
    '.......MMLWWWL..',
    '.......MMLWWWL..',
    '.......MMLLLLL..',
    '.......MM.......',
    '.KKKKKKKKKKKKKK.',
    '.KooooooooooooK.',
    '.KooooooooooooK.',
    '.KKKKKKKKKKKKKK.',
    '................',
  ]},
  sp_stern: { b:12, h:12, p:[
    '.....KK.....',
    '....TTTT....',
    '....TttT....',
    '....TTTT....',
    '.TTTTTTTTTT.',
    '.TTTttttTTT.',
    '.TTTTTTTTTT.',
    '...TTTTTT...',
    '...TTTTTT...',
    '...TTTTTT...',
    '..TTT..TTT..',
    '..TTT..TTT..',
  ]},
  sp_kerze: { b:12, h:14, p:[
    '.....yy.....',
    '.....oo.....',
    '.....oo.....',
    '.....oo.....',
    '...KKKKKK...',
    '...KwwWWK...',
    '...KwwWWK...',
    '...KwwWWK...',
    '...KwwWWK...',
    '...KwwWWK...',
    '...KwwWWK...',
    '...KwwWWK...',
    '...KKKKKK...',
    '..MMMMMMMM..',
  ]},
  kissen_a: { b:16, h:11, p:[
    '................',
    '.KKKKKKKKKKKKKK.',
    '.KppppppppppppK.',
    '.KPppppppppppPK.',
    '.KPppppppppppPK.',
    '.KPPPPPPPPPPPPK.',
    '.KPPPPPPPPPPPPK.',
    '.KPPPPPPPPPPPPK.',
    '.KpPPPPPPPPPPpK.',
    '.KKKKKKKKKKKKKK.',
    '................',
  ]},
  kissen_b: { b:16, h:11, p:[
    '................',
    '.KKKKKKKKKKKKKK.',
    '.KccccccccccccK.',
    '.KCccccccccccCK.',
    '.KCccccccccccCK.',
    '.KCCCCCCCCCCCCK.',
    '.KCCCCCCCCCCCCK.',
    '.KCCCCCCCCCCCCK.',
    '.KcCCCCCCCCCCcK.',
    '.KKKKKKKKKKKKKK.',
    '................',
  ]},
  kissen_c: { b:16, h:11, p:[
    '................',
    '.KKKKKKKKKKKKKK.',
    '.KyyyyyyyyyyyyK.',
    '.KYyyyyyyyyyyYK.',
    '.KYyyyyyyyyyyYK.',
    '.KYYYYYYYYYYYYK.',
    '.KYYYYYYYYYYYYK.',
    '.KYYYYYYYYYYYYK.',
    '.KyYYYYYYYYYYyK.',
    '.KKKKKKKKKKKKKK.',
    '................',
  ]},
  ku_baer: { b:16, h:16, p:[
    '................',
    '.KKKK......KKKK.',
    '.KMMK......KMMK.',
    '.KMMK......KMMK.',
    '.KKKKKKKKKKKKKK.',
    '..KMMMMMMMMMMK..',
    '..KMMMMMMMMMMK..',
    '..KMMKKMMKKMMK..',
    '..KMMMMMMMMMMK..',
    '..KMMmmKKmmMMK..',
    '..KMMmmmmmmMMK..',
    '..KMMmmmmmmMMK..',
    '..KMMmmmmmmMMK..',
    '..KMMmmmmmmMMK..',
    '..KKKKKKKKKKKK..',
    '................',
  ]},
  ku_hase: { b:14, h:18, p:[
    '..............',
    '..............',
    '..KKK....KKK..',
    '..KpK....KpK..',
    '..KpK....KpK..',
    '..KWK....KWK..',
    '..KWK....KWK..',
    '..KKKKKKKKKK..',
    '...KWWWWWWK...',
    '...KWWWWWWK...',
    '...KKKWWKKK...',
    '...KWWWWWWK...',
    '...KWWPPWWK...',
    '...KWWWWWWK...',
    '...KWWWWWWK...',
    '...KWWWWWWK...',
    '...KKKKKKKK...',
    '..............',
  ]},
  ku_frosch: { b:16, h:14, p:[
    '................',
    '..KKKK....KKKK..',
    '..KKKK....KKKK..',
    '..KGGK....KGGK..',
    '..KKKK....KKKK..',
    '..KKKKKKKKKKKK..',
    '..KGGGGGGGGGGK..',
    '..KGGKKKKKKGGK..',
    '..KGGGGGGGGGGK..',
    '..KGggggggggGK..',
    '..KGggggggggGK..',
    '..KGggggggggGK..',
    '..KKKKKKKKKKKK..',
    '................',
  ]},
  ku_katze: { b:16, h:15, p:[
    '.KKKKK....KKKKK.',
    '.KVVVK....KVVVK.',
    '.KVVVK....KVVVK.',
    '.KVVVK....KVVVK.',
    '.KKKKKKKKKKKKKK.',
    '...KVVVVVVVVK...',
    '...KVKKVVKKVK...',
    '...KVvvvvvvVK...',
    '...KVvvPPvvVK...',
    '...KVvvvvvvVK...',
    '...KVvvvvvvVK...',
    '...KVVVVVVVVK...',
    '...KVVVVVVVVK...',
    '...KKKKKKKKKK...',
    '................',
  ]},
};
