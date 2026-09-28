/* ============================================================
   Bellagotchi — der Maßstab.

   Geeicht wird an der ersten gelieferten Grafik: die Pflanze ist in
   Wirklichkeit 25 cm hoch und 140 Bildpunkte groß. Daraus folgt alles
   andere.

       140 Punkte / 25 cm = 5,6 Punkte je Zentimeter

   Auf dem Bildschirm wird in **Gerätepunkten** gerechnet, nicht in
   CSS-Punkten: ein Handy hat bei gleicher Fläche das Zwei- bis
   Dreifache an echten Bildpunkten, und genau diese Reserve braucht der
   Detailgrad. Bei DPR 3 zeigt eine Bühne von 390 × 420 CSS-Punkten
   rund 209 × 226 cm — ein gutes Stück Zimmer, in dem Bella mit ihren
   170 cm drei Viertel der Höhe füllt.

/* Die Eichung. Beides zusammen ergibt den Maßstab. */
const EICHUNG = { datei: 'deko_pflanze', punkte: 140, cm: 25 };
const PX_JE_CM = EICHUNG.punkte / EICHUNG.cm;

function punkte(cm){ return Math.round(cm * PX_JE_CM); }
function zentimeter(px){ return +(px / PX_JE_CM).toFixed(1); }

/* Wie hoch die Dinge wirklich sind, in Zentimetern. Die Platzhalter
   werden auf dieses Maß gezogen — ein Raster von 32 Zeilen wird also
   nicht 32 Punkte hoch, sondern so hoch, wie seine Zentimeter es
   verlangen. Deshalb sind die Platzhalter jetzt sehr grob: sie sind
   geborgt, und ihre Grobheit sagt genau das. */
const BELLA_CM = 170;

const GROESSEN_CM = {
  bella:        BELLA_CM,
  bella_liegt:  42,        // liegend sieht man Kopf und Schultern
  deko_pflanze: 25,

  bett:         55,        // Betthöhe mit Kopfteil, nicht die Länge
  fenster:      110,
  lampe:        150,
  nachttisch:   55,
  herd:         90,
  kuehlschrank: 170,
  tisch:        75,
  sofa:         80,
  regal:        180,
  pflanze:      60,
  wanne:        55,
  waschbecken:  85,
  spiegel:      90,
  schrank:      190,
  stange:       40,

  kissen_a: 35, kissen_b: 35, kissen_c: 35,
  ku_baer: 30, ku_hase: 34, ku_frosch: 24, ku_katze: 28,
  sp_ente: 9, sp_schiff: 11, sp_stern: 8, sp_kerze: 18,

  teller: 4, brett: 3, messer: 3, hand_dusche: 22, schwamm: 9,
};

function groesseCm(name){ return GROESSEN_CM[name] || null; }

/* Um welchen Faktor ein Platzhalter gezogen werden muss, damit er seine
   Zentimeter trifft. Bewusst keine ganze Zahl: der Platzhalter darf
   ausfransen, er ist ohnehin nur geborgt. Eine gelieferte Datei wird
   nie gezogen. */
function zugFuer(rasterHoehe, cm){
  if (!cm || !rasterHoehe) return 1;
  return punkte(cm) / rasterHoehe;
}

/* Stimmt eine gelieferte Datei mit der eingetragenen Größe überein?
   Liefert die Abweichung in Prozent — so fällt auf, wenn eine neue
   Grafik nicht zum Maßstab passt, statt dass sie stillschweigend zu
   groß im Zimmer steht. */
function massPruefen(name, punkteHoch){
  const cm = groesseCm(name);
  if (!cm || !punkteHoch) return null;
  const soll = punkte(cm);
  return { soll, ist: punkteHoch, abweichung: Math.round((punkteHoch / soll - 1) * 100) };
}
