/* ============================================================
   Bellagotchi — der Maßstab.

   Zwei Zahlen, die oft verwechselt werden. Sie auseinanderzuhalten ist
   der ganze Trick:

   1. Die **Modellauflösung**. Sie wird an der gelieferten Pflanze
      geeicht: 140 Bildpunkte hoch, in Wirklichkeit 25 cm.

          140 Punkte / 25 cm = 5,6 Punkte je Zentimeter

      In dieser Dichte wird gezeichnet, was hochgeladen wird. Wer eine
      neue Grafik malt, malt sie so: Höhe in cm mal 5,6. Ein Herd mit
      85 cm Arbeitshöhe ist also 476 Punkte hoch — mehr als das
      Dreifache der Pflanze. Genau das war gemeint.

   2. Die **Anzeigedichte**. Sie ergibt sich aus dem Bildschirm und
      steht nicht fest: ein ganzes Zimmer soll ins Bild, und ein
      Handy hat dafür nur so viele Bildpunkte, wie es hat.

          Leinwandbreite in Gerätepunkten / Zimmerbreite in cm

      Bei 390 CSS-Punkten und dreifacher Dichte sind das 1170
      Gerätepunkte. Ein Zimmer von 340 cm wird damit mit 3,44 Punkten
      je Zentimeter gezeigt. Die Pflanze erscheint als 86 Punkte — ihre
      140 gemalten Zeilen stecken alle darin, das Gerät zeigt 61 % davon.
      Auf einem größeren Bildschirm zeigt es mehr.

   Das ist der Unterschied, der lange schiefging: gezeichnet wurde mit
   einer festen Dichte, und die Zimmer wurden dadurch immer enger statt
   detaillierter.
   ============================================================ */

/* Die Eichung an der gelieferten Grafik. */
const EICHUNG = { datei: 'deko_pflanze', punkte: 140, cm: 25 };

/* So malt man für dieses Spiel. Gilt für jede hochgeladene Datei. */
const MODELL_PX_JE_CM = EICHUNG.punkte / EICHUNG.cm;      // 5,6

/* Wie hoch eine Grafik sein muss, damit sie zum Maßstab passt. */
function sollPunkte(cm){ return Math.round(cm * MODELL_PX_JE_CM); }

/* Das Zimmer, das immer vollständig im Bild steht. Die Höhe richtet
   sich nach der Form der Bühne — die Breite steht fest, damit ein
   Möbelstück auf jedem Gerät gleich groß im Zimmer sitzt. */
const ZIMMER = {
  breiteCm: 340,
  /* Wie viel vom Bild Fußboden ist — eine feste Zahl, keine Quote.
     Daran hängt die Bodenlinie, und auf der stehen Möbel und Bella.
     Wanderte sie je nach Gerät, könnte ein gemalter Boden nie sitzen:
     auf dem einen Handy läge er zu hoch, auf dem anderen zu tief. */
  bodenCm: 100,
  /* So hoch muss eine gemalte Wand mindestens sein. Zeigt ein Gerät
     mehr Wand, wird die oberste Zeile des Bildes fortgesetzt — bei
     einer gemalten Wand sieht man davon nichts. */
  wandCm: 275,
};

/* Wie hoch die Dinge wirklich sind, in Zentimetern — und wie breit.
   Beides wird gebraucht: aus dem Verhältnis ergibt sich die Form, und
   an der Höhe hängt der Maßstab. */
const BELLA_CM = 170;

const GROESSEN_CM = {
  bella:        BELLA_CM,
  bella_liegt:  42,
  deko_pflanze: 25,

  bett:         55,
  fenster:      110,
  lampe:        150,
  nachttisch:   55,
  /* Ein Herd ist 60 cm breit — das ist das Maß, das überall steht.
     Hoch ist er 85 cm, die übliche Arbeitshöhe. Beides zusammen macht
     ihn in der Höhe gut dreimal so groß wie die Pflanze. */
  herd:         85,
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

  /* Wanddeko. Hängt an der Wand; wie hoch, steht bei WANDDEKO. */
  wd_lichterkette: 20, wd_girlande: 28, wd_bild: 50, wd_bild_gross: 75,
  wd_traumfaenger: 70, wd_wandregal: 22,

  kissen_a: 35, kissen_b: 35, kissen_c: 35,
  ku_baer: 30, ku_hase: 34, ku_frosch: 24, ku_katze: 28,
  sp_ente: 9, sp_schiff: 11, sp_stern: 8, sp_kerze: 18,

  teller: 4, brett: 3, messer: 3, hand_dusche: 22, schwamm: 9,
};

/* Breiten, wo die Form nicht aus der Höhe folgt. Steht hier nichts,
   wird die Breite aus dem Seitenverhältnis des Platzhalters genommen. */
const BREITEN_CM = {
  bella:        46,
  deko_pflanze: 21,       // 120 Punkte breit bei 5,6 Punkten je cm

  bett:         200, fenster: 90,  lampe: 40,  nachttisch: 45,
  herd:         60,  kuehlschrank: 60, tisch: 120, sofa: 180,
  regal:        90,  pflanze: 45,  wanne: 150, waschbecken: 55,
  spiegel:      60,  schrank: 110, stange: 120,

  wd_lichterkette: 150, wd_girlande: 130, wd_bild: 40, wd_bild_gross: 60,
  wd_traumfaenger: 32,  wd_wandregal: 80,
};

function groesseCm(name){ return GROESSEN_CM[name] || null; }
function breitenMass(name){ return BREITEN_CM[name] || null; }

/* Stimmt eine gelieferte Datei mit der eingetragenen Größe überein?
   Liefert die Abweichung in Prozent — so fällt auf, wenn eine neue
   Grafik nicht in der Modellauflösung gemalt wurde, statt dass sie
   stillschweigend zu klein im Zimmer steht. */
function massPruefen(name, punkteHoch){
  const cm = groesseCm(name);
  if (!cm || !punkteHoch) return null;
  const soll = sollPunkte(cm);
  return { soll, ist: punkteHoch, abweichung: Math.round((punkteHoch / soll - 1) * 100) };
}
