/* ============================================================
   Bellagotchi — die Bildschicht.

   Jedes Bild im Spiel hat einen Namen (einen "Platz"). Dahinter steht
   entweder ein gezeichneter Platzhalter aus sprites.js oder eine
   gelieferte PNG-Datei aus www/bilder/.

   Liegt eine Datei da, wird sie **unverändert** gezeichnet: keine
   Palette, kein Umfärben, kein Zuschnitt, keine Glättung. Nur ganze
   Vielfache der Kantenlänge, damit ein gemalter Pixel ein Pixel bleibt.
   Eine eigene Grafik einzusetzen heißt deshalb: Datei unter dem Namen
   des Platzes in www/bilder/ legen, fertig.

   Die Datei bestimmt die Größe. Ein Bild in Spielpixeln von 40×24 wird
   bei Maßstab 3 zu 120×72 Bildschirmpunkten — die Platzangaben im Spiel
   rechnen immer in Spielpixeln.
   ============================================================ */

/* Was es gibt. Der Wert ist die Datei in www/bilder/; ein leerer Wert
   heißt: es gibt noch keine gelieferte Grafik, es wird der Platzhalter
   gezeichnet. */
const BILDPLAETZE = {
  // Ganze Szenen. Liegt hier eine Datei, ersetzt sie den gezeichneten
  // Hintergrund der Szene vollständig; Bella und die Gegenstände werden
  // darüber gelegt.
  szene_nische:   '',
  szene_wanne:    '',
  szene_kueche:   '',
  szene_wohnen:   '',
  szene_schrank:  '',
  szene_arbeitsflaeche: '',

  // Bella
  bella_steht:    '',
  bella_liegt:    '',
  bella_isst_1:   '',
  bella_isst_2:   '',

  // Handzeug
  hand_dusche:    '',
  schwamm:        '',
};

/* Gerichte und Zutaten bekommen ihre Plätze aus den Listen im Spiel,
   damit ein neues Rezept nicht an zwei Stellen eingetragen werden muss. */
function bildplatzAnlegen(name){
  if (!(name in BILDPLAETZE)) BILDPLAETZE[name] = '';
}

const BILDER = {};          // Platz → { el, b, h } sobald geladen
let bilderGeladen = 0;

/* Lädt alle Plätze, für die eine Datei eingetragen ist. Fehlt eine,
   bleibt der Platzhalter stehen — die App startet trotzdem. */
function bilderLaden(){
  const offen = Object.entries(BILDPLAETZE).filter(([, datei]) => datei);
  if (!offen.length) return Promise.resolve(0);
  return Promise.all(offen.map(([name, datei]) => new Promise(fertig => {
    const el = new Image();
    el.onload = () => {
      BILDER[name] = { el, b: el.naturalWidth, h: el.naturalHeight };
      bilderGeladen++;
      fertig(true);
    };
    el.onerror = () => fertig(false);   // fehlt die Datei: Platzhalter
    el.src = datei;
  }))).then(() => bilderGeladen);
}

function bildDa(name){ return !!BILDER[name]; }

/* Zeichnet ein geliefertes Bild an einer Stelle in Spielpixeln. Gibt
   false zurück, wenn es das Bild nicht gibt — dann malt der Aufrufer
   seinen Platzhalter. */
function maleBild(ctx, s, name, x, y){
  const b = BILDER[name];
  if (!b) return false;
  ctx.drawImage(b.el, Math.round(x) * s.mass, Math.round(y) * s.mass,
                b.b * s.mass, b.h * s.mass);
  return true;
}

/* Ein Szenenbild füllt die Bühne. Es wird mittig gesetzt und nur um
   ganze Vielfache vergrößert — lieber ein Rand daneben als verzerrte
   Pixel. Ist es größer als die Bühne, wird mittig ausgeschnitten. */
function maleSzenenbild(ctx, s, name){
  const b = BILDER[name];
  if (!b) return false;
  const faktor = Math.max(1, Math.min(Math.floor(s.b / b.b), Math.floor(s.h / b.h)));
  const bp = b.b * faktor * s.mass, hp = b.h * faktor * s.mass;
  const x = Math.round((s.b * s.mass - bp) / 2);
  const y = Math.round((s.h * s.mass - hp) / 2);
  ctx.drawImage(b.el, x, y, bp, hp);
  return true;
}

/* Wo Bella und die Gegenstände in einer Szene stehen. Liefert jemand
   ein eigenes Szenenbild, verschieben sich diese Punkte mit — deshalb
   stehen sie hier als Anteile der Bühne und nicht als feste Zahlen. */
const ANKER = {
  nische: { bellaX: .42, bellaY: .74, dingeX: .70, dingeY: .72 },
  wanne:  { bellaX: .50, bellaY: .42, dingeX: .50, dingeY: .28 },
};
