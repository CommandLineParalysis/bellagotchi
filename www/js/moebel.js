/* ============================================================
   Bellagotchi — die Möbel, gezeichnet.

   Vorher lag hinter jedem Möbelstück ein Textraster von rund 20 mal 20
   Zeichen. Auf seine wirkliche Größe gezogen wurde aus jeder Zelle ein
   Klotz von zwanzig, dreißig Bildpunkten: je größer das Zimmer, desto
   gröber das Möbelstück. Das war der Grund, warum die Zimmer nach jedem
   Schritt weniger Pixel zu haben schienen, obwohl die Leinwand mehr
   bekam.

   Hier steht deshalb kein Raster mehr, sondern eine Zeichnung in
   Zentimetern. Ein Griff ist 2 cm dick, eine Kante 1 cm, eine Fuge
   0,5 cm — und wie viele Bildpunkte daraus werden, entscheidet erst der
   Bildschirm. Auf einem dichten Gerät wird die Fuge feiner statt
   klobiger.

   Alle Funktionen rechnen in Zentimetern, von links oben. `s.mass` sagt,
   wie viele Bildpunkte ein Zentimeter hat.
   ============================================================ */

/* ---------- Werkstoffe ----------
   Vier Töne je Werkstoff: Licht, Fläche, Schatten, Kante. Mehr braucht
   es nicht, und weniger sieht flach aus. */
const STOFFE = {
  holz:   { licht:'#E0AE7C', flaeche:'#C98B5A', schatten:'#9A6437', kante:'#6B4222' },
  holzd:  { licht:'#A97449', flaeche:'#8A5B2E', schatten:'#6A4321', kante:'#452B14' },
  metall: { licht:'#F2F6FA', flaeche:'#C6D0DA', schatten:'#94A2B0', kante:'#5E6B78' },
  weiss:  { licht:'#FFFFFF', flaeche:'#F2ECF4', schatten:'#D4C9D9', kante:'#A796AE' },
  emaille:{ licht:'#FFFFFF', flaeche:'#F7F2FA', schatten:'#DCD2E4', kante:'#B0A2BA' },
  glas:   { licht:'#EAF7FF', flaeche:'#BFE3F7', schatten:'#8FC6E6', kante:'#5E9BC2' },
  dunkel: { licht:'#5A4470', flaeche:'#3D2C52', schatten:'#2B1B3D', kante:'#1A1026' },
  erde:   { licht:'#7A5636', flaeche:'#5C3F26', schatten:'#3F2B19', kante:'#2A1C10' },
  blatt:  { licht:'#7BE08F', flaeche:'#3FB96A', schatten:'#248A4C', kante:'#145E33' },
  ton:    { licht:'#E08A5C', flaeche:'#C06A40', schatten:'#94492A', kante:'#68301A' },
};

/* ---------- Striche und Flächen in Zentimetern ---------- */

function mFlaeche(ctx, s, x, y, b, h, farbe){
  if (!farbe || b <= 0 || h <= 0) return;
  ctx.fillStyle = farbe;
  const x0 = Math.round(x * s.mass), y0 = Math.round(y * s.mass);
  ctx.fillRect(x0, y0, Math.max(1, Math.round((x + b) * s.mass) - x0),
                       Math.max(1, Math.round((y + h) * s.mass) - y0));
}

/* Ein Kasten mit Licht oben links und Schatten unten rechts. Die Kante
   ist ein Zentimeter dick, egal wie groß der Kasten ist — dadurch wirkt
   ein Schrank nicht wie ein vergrößerter Nachttisch. */
function mKasten(ctx, s, x, y, b, h, w, d){
  const k = d || 1;
  mFlaeche(ctx, s, x, y, b, h, w.flaeche);
  mFlaeche(ctx, s, x, y, b, k, w.licht);
  mFlaeche(ctx, s, x, y, k, h, w.licht);
  mFlaeche(ctx, s, x, y + h - k, b, k, w.schatten);
  mFlaeche(ctx, s, x + b - k, y, k, h, w.schatten);
  mUmriss(ctx, s, x, y, b, h, k / 2, w.kante);
}

function mUmriss(ctx, s, x, y, b, h, d, farbe){
  mFlaeche(ctx, s, x, y, b, d, farbe);
  mFlaeche(ctx, s, x, y + h - d, b, d, farbe);
  mFlaeche(ctx, s, x, y, d, h, farbe);
  mFlaeche(ctx, s, x + b - d, y, d, h, farbe);
}

/* Eine abgerundete Fläche: die Ecken werden zeilenweise eingezogen, so
   entsteht die Treppe, die zur Pixelgrafik gehört. */
function mRund(ctx, s, x, y, b, h, r, farbe){
  if (!farbe) return;
  const schritte = Math.max(1, Math.round(r * s.mass));
  for (let i = 0; i < schritte; i++){
    const t = (i + 0.5) / schritte;
    const ein = r - r * Math.sqrt(1 - (1 - t) * (1 - t));
    const yy = y + i / s.mass;
    mFlaeche(ctx, s, x + ein, yy, b - 2 * ein, 1 / s.mass, farbe);
    mFlaeche(ctx, s, x + ein, y + h - (i + 1) / s.mass, b - 2 * ein, 1 / s.mass, farbe);
  }
  mFlaeche(ctx, s, x, y + r, b, h - 2 * r, farbe);
}

function mKreis(ctx, s, mx, my, r, farbe){
  if (!farbe) return;
  const rp = Math.max(1, Math.round(r * s.mass));
  ctx.fillStyle = farbe;
  for (let j = -rp; j <= rp; j++){
    const halb = Math.round(Math.sqrt(Math.max(0, rp * rp - j * j)));
    if (!halb) continue;
    ctx.fillRect(Math.round(mx * s.mass) - halb, Math.round(my * s.mass) + j, halb * 2, 1);
  }
}

function mRing(ctx, s, mx, my, r, d, farbe){
  const rp = Math.max(1, Math.round(r * s.mass));
  const dp = Math.max(1, Math.round(d * s.mass));
  ctx.fillStyle = farbe;
  for (let j = -rp; j <= rp; j++){
    const a = Math.round(Math.sqrt(Math.max(0, rp * rp - j * j)));
    const ri = rp - dp;
    const i = Math.abs(j) <= ri ? Math.round(Math.sqrt(Math.max(0, ri * ri - j * j))) : 0;
    if (!a) continue;
    const mxp = Math.round(mx * s.mass), myp = Math.round(my * s.mass) + j;
    if (!i){ ctx.fillRect(mxp - a, myp, a * 2, 1); continue; }
    ctx.fillRect(mxp - a, myp, a - i, 1);
    ctx.fillRect(mxp + i, myp, a - i, 1);
  }
}

/* Eine schräge Linie als Treppe — für Stuhlbeine, Blätter, Bügel. */
function mSchraeg(ctx, s, x1, y1, x2, y2, d, farbe){
  if (!farbe) return;
  const n = Math.max(1, Math.round(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * s.mass));
  for (let i = 0; i <= n; i++){
    const t = i / n;
    mFlaeche(ctx, s, x1 + (x2 - x1) * t - d / 2, y1 + (y2 - y1) * t - d / 2, d, d, farbe);
  }
}

/* Maserung: feine Striche in Faserrichtung, unregelmäßig aber fest —
   sie soll bei jedem Bild gleich liegen, sonst flimmert das Holz. */
function mMaserung(ctx, s, x, y, b, h, farbe, abstand){
  const a = abstand || 4;
  for (let i = 1; i * a < h; i++){
    const versatz = ((i * 37) % 11) / 11 * b * 0.3;
    mFlaeche(ctx, s, x + versatz, y + i * a, b * (0.4 + ((i * 53) % 7) / 14), 0.4, farbe);
  }
}

/* ---------- Die Möbel ----------
   Jedes bekommt Ecke oben links und seine Maße in Zentimetern.
   `stoff` sind die drei Polsterfarben aus der Garderobe. */

const MOEBELBILD = {};

MOEBELBILD.herd = (ctx, s, x, y, b, h) => {
  const w = STOFFE.metall;
  mKasten(ctx, s, x, y + 5, b, h - 5, w, 1);
  // Kochfeld mit Rand
  mFlaeche(ctx, s, x, y, b, 5, '#39303C');
  mFlaeche(ctx, s, x, y, b, 1, w.licht);
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++){
      const mx = x + b * (0.28 + i * 0.44), my = y + 1.6 + j * 2.2;
      mRing(ctx, s, mx, my, 6 - j * 1.5, 1, '#1D1720');
      mRing(ctx, s, mx, my, 4 - j, 0.8, '#C0453A');
    }
  // Backofentür mit Fenster und Griff
  const ty = y + 18, th = h - 26;
  mKasten(ctx, s, x + 2, ty, b - 4, th, STOFFE.dunkel, 1);
  mFlaeche(ctx, s, x + 5, ty + 7, b - 10, th - 12, '#16121C');
  mFlaeche(ctx, s, x + 6, ty + 8, b - 12, th - 14, '#3A2F46');
  mFlaeche(ctx, s, x + 7, ty + 9, (b - 14) * 0.35, th - 16, '#55496B');
  mFlaeche(ctx, s, x + 3, ty + 2, b - 6, 2.5, w.licht);
  mFlaeche(ctx, s, x + 3, ty + 4, b - 6, 1, w.schatten);
  // Knöpfe
  for (let i = 0; i < 4; i++){
    const mx = x + 7 + i * ((b - 14) / 3);
    mKreis(ctx, s, mx, y + 12, 2.4, w.kante);
    mKreis(ctx, s, mx, y + 11.6, 2.1, w.licht);
    mFlaeche(ctx, s, mx - 0.4, y + 9.8, 0.8, 1.8, '#C0453A');
  }
  mFlaeche(ctx, s, x, y + h - 2, b, 2, w.kante);
};

MOEBELBILD.kuehlschrank = (ctx, s, x, y, b, h) => {
  const w = STOFFE.metall;
  mKasten(ctx, s, x, y, b, h, w, 1.5);
  const fuge = y + h * 0.33;
  mFlaeche(ctx, s, x + 1, fuge, b - 2, 1.2, w.kante);
  mFlaeche(ctx, s, x + 1, fuge + 1.2, b - 2, 0.8, w.licht);
  // senkrechte Griffe an der rechten Kante der beiden Türen
  [y + 8, fuge + 6].forEach((gy, i) => {
    const gh = i ? h - (fuge - y) - 16 : (fuge - y) - 14;
    mFlaeche(ctx, s, x + b - 9, gy, 2.2, gh, w.kante);
    mFlaeche(ctx, s, x + b - 9, gy, 1.2, gh, w.licht);
    mFlaeche(ctx, s, x + b - 9.5, gy, 3.2, 1.6, w.schatten);
    mFlaeche(ctx, s, x + b - 9.5, gy + gh - 1.6, 3.2, 1.6, w.schatten);
  });
  // Lichtkante als schmaler Streifen, damit die Fläche nicht tot wirkt
  mFlaeche(ctx, s, x + 3, y + 3, 2, h - 6, '#FFFFFF');
  mFlaeche(ctx, s, x + 5, y + 3, 1, h - 6, w.licht);
  // Magnete
  mFlaeche(ctx, s, x + 10, y + 16, 7, 9, '#F7D9E8');
  mFlaeche(ctx, s, x + 11, y + 17, 5, 7, '#FF8AA8');
  mKreis(ctx, s, x + 22, y + 26, 2.6, '#FFD166');
  mFlaeche(ctx, s, x, y + h - 2.5, b, 2.5, w.kante);
};

MOEBELBILD.tisch = (ctx, s, x, y, b, h) => {
  const w = STOFFE.holz;
  // Platte
  mFlaeche(ctx, s, x, y, b, 4, w.licht);
  mFlaeche(ctx, s, x, y + 4, b, 3, w.flaeche);
  mFlaeche(ctx, s, x, y + 7, b, 1.5, w.schatten);
  mMaserung(ctx, s, x + 2, y, b - 4, 7, w.schatten, 2.5);
  mUmriss(ctx, s, x, y, b, 8.5, 0.6, w.kante);
  // Zarge
  mFlaeche(ctx, s, x + 5, y + 8.5, b - 10, 4, w.schatten);
  // Beine: vorne hell, hinten dunkel — das gibt Tiefe ohne Perspektive
  [[x + 6, w.flaeche], [x + b - 12, w.flaeche]].forEach(([bx, f]) => {
    mFlaeche(ctx, s, bx, y + 8, 6, h - 8, f);
    mFlaeche(ctx, s, bx, y + 8, 1.5, h - 8, w.licht);
    mFlaeche(ctx, s, bx + 4.5, y + 8, 1.5, h - 8, w.schatten);
    mFlaeche(ctx, s, bx, y + h - 1, 6, 1, w.kante);
  });
  [[x + 16], [x + b - 22]].forEach(([bx]) => {
    mFlaeche(ctx, s, bx, y + 8, 5, h - 10, STOFFE.holzd.flaeche);
    mFlaeche(ctx, s, bx + 3.5, y + 8, 1.5, h - 10, STOFFE.holzd.schatten);
  });
};

MOEBELBILD.sofa = (ctx, s, x, y, b, h, stoff) => {
  const a = (stoff && stoff[0]) || '#FFC2E2';
  const m = (stoff && stoff[1]) || '#FF4FA3';
  const d = (stoff && stoff[2]) || '#C41E76';
  // Rückenlehne
  mRund(ctx, s, x + 12, y, b - 24, h * 0.62, 5, m);
  mRund(ctx, s, x + 13, y + 1, b - 26, h * 0.5, 4, a);
  mFlaeche(ctx, s, x + 13, y + h * 0.4, b - 26, 2, m);
  // Nähte in der Lehne
  for (let i = 1; i < 3; i++)
    mFlaeche(ctx, s, x + 12 + i * ((b - 24) / 3), y + 3, 0.8, h * 0.45, d);
  // Armlehnen
  [x, x + b - 14].forEach(ax => {
    mRund(ctx, s, ax, y + h * 0.28, 14, h * 0.55, 6, m);
    mRund(ctx, s, ax + 1.5, y + h * 0.3, 11, h * 0.2, 5, a);
    mFlaeche(ctx, s, ax, y + h * 0.7, 14, 3, d);
  });
  // Sitzkissen
  const sy = y + h * 0.52;
  for (let i = 0; i < 2; i++){
    const kx = x + 15 + i * ((b - 32) / 2);
    mRund(ctx, s, kx, sy, (b - 32) / 2 - 1.5, h * 0.3, 4, a);
    mUmriss(ctx, s, kx, sy, (b - 32) / 2 - 1.5, h * 0.3, 0.7, d);
  }
  mFlaeche(ctx, s, x + 14, sy + h * 0.3, b - 28, 3.5, d);
  // Füße
  [x + 8, x + b - 13].forEach(fx => {
    mFlaeche(ctx, s, fx, y + h - 7, 5, 7, STOFFE.holzd.flaeche);
    mFlaeche(ctx, s, fx + 3.5, y + h - 7, 1.5, 7, STOFFE.holzd.kante);
  });
};

MOEBELBILD.regal = (ctx, s, x, y, b, h) => {
  const w = STOFFE.holz;
  mKasten(ctx, s, x, y, b, h, w, 1.2);
  mFlaeche(ctx, s, x + 3, y + 3, b - 6, h - 6, STOFFE.holzd.schatten);
  const boeden = 4, fach = (h - 6) / boeden;
  const buchfarben = ['#FF8AA8','#4FA8FF','#4BE38A','#FFD166','#A65CFF','#FF5C5C','#30F3CF'];
  for (let f = 0; f < boeden; f++){
    const by = y + 3 + (f + 1) * fach;
    // was auf dem Fach steht: Bücher in wechselnder Höhe
    let bx = x + 5;
    let n = 0;
    while (bx < x + b - 8 && n < 12){
      const bb = 3 + ((f * 7 + n * 5) % 4);
      const bh = fach * (0.55 + ((f * 3 + n * 11) % 5) / 14);
      const c = buchfarben[(f * 3 + n) % buchfarben.length];
      mFlaeche(ctx, s, bx, by - bh - 1.5, bb, bh, c);
      mFlaeche(ctx, s, bx, by - bh - 1.5, 1, bh, '#FFFFFF');
      mFlaeche(ctx, s, bx, by - bh + bh * 0.2, bb, 0.8, '#00000033');
      bx += bb + 1;
      n++;
    }
    mFlaeche(ctx, s, x + 3, by - 1.5, b - 6, 1.5, w.licht);
    mFlaeche(ctx, s, x + 3, by, b - 6, 1, w.schatten);
  }
};

MOEBELBILD.pflanze = (ctx, s, x, y, b, h) => {
  const t = STOFFE.ton, l = STOFFE.blatt;
  const topfH = h * 0.32, mx = x + b / 2;
  // Blätter zuerst, damit der Topf davor steht
  const blatt = (dx, dy, lang, dick, f) => {
    mSchraeg(ctx, s, mx, y + h - topfH, mx + dx, y + h - topfH - lang, dick, f);
    for (let i = 1; i <= 4; i++){
      const t2 = i / 5;
      mKreis(ctx, s, mx + dx * t2, y + h - topfH - lang * t2, dick * (1.4 - t2 * 0.6), f);
    }
  };
  blatt(-b * 0.42, 0, h * 0.5, 2.2, l.schatten);
  blatt(b * 0.44, 0, h * 0.46, 2.2, l.schatten);
  blatt(-b * 0.22, 0, h * 0.66, 2.6, l.flaeche);
  blatt(b * 0.24, 0, h * 0.62, 2.6, l.flaeche);
  blatt(0, 0, h * 0.7, 3, l.licht);
  mFlaeche(ctx, s, mx - 1, y + h - topfH - h * 0.55, 2, h * 0.55, l.schatten);
  // Topf
  mFlaeche(ctx, s, x + b * 0.16, y + h - topfH, b * 0.68, topfH, t.flaeche);
  mFlaeche(ctx, s, x + b * 0.16, y + h - topfH, b * 0.16, topfH, t.licht);
  mFlaeche(ctx, s, x + b * 0.68, y + h - topfH, b * 0.16, topfH, t.schatten);
  mFlaeche(ctx, s, x + b * 0.1, y + h - topfH - 3, b * 0.8, 3.5, t.licht);
  mFlaeche(ctx, s, x + b * 0.1, y + h - topfH + 0.5, b * 0.8, 1, t.kante);
  mFlaeche(ctx, s, x + b * 0.13, y + h - topfH - 2.5, b * 0.74, 1.5, STOFFE.erde.flaeche);
  mFlaeche(ctx, s, x + b * 0.16, y + h - 1.5, b * 0.68, 1.5, t.kante);
};

MOEBELBILD.fenster = (ctx, s, x, y, b, h, stoff, nacht) => {
  const w = STOFFE.weiss;
  mKasten(ctx, s, x - 3, y - 3, b + 6, h + 6, w, 1.5);
  const himmel = nacht ? ['#1B2247','#2A3566','#3C4A85'] : ['#9AD0FF','#BFE3F7','#E4F4FF'];
  mFlaeche(ctx, s, x, y, b, h, himmel[0]);
  mFlaeche(ctx, s, x, y + h * 0.45, b, h * 0.55, himmel[1]);
  mFlaeche(ctx, s, x, y + h * 0.78, b, h * 0.22, himmel[2]);
  if (nacht){
    [[0.2,0.15],[0.55,0.28],[0.78,0.12],[0.35,0.4],[0.66,0.55]].forEach(([fx, fy]) =>
      mFlaeche(ctx, s, x + b * fx, y + h * fy, 1.2, 1.2, '#FFF6C8'));
    mKreis(ctx, s, x + b * 0.72, y + h * 0.22, 6, '#FFF3C4');
    mKreis(ctx, s, x + b * 0.78, y + h * 0.19, 5.5, himmel[0]);
  } else {
    [[0.22,0.22,9],[0.3,0.26,7],[0.62,0.42,8],[0.7,0.45,6]].forEach(([fx, fy, r]) =>
      mKreis(ctx, s, x + b * fx, y + h * fy, r, '#FFFFFF'));
  }
  // Sprossen
  mFlaeche(ctx, s, x + b / 2 - 1.2, y, 2.4, h, w.flaeche);
  mFlaeche(ctx, s, x, y + h / 2 - 1.2, b, 2.4, w.flaeche);
  mFlaeche(ctx, s, x + b / 2 - 1.2, y, 1, h, w.licht);
  mFlaeche(ctx, s, x, y + h / 2 - 1.2, b, 1, w.licht);
  mUmriss(ctx, s, x, y, b, h, 0.8, w.kante);
  // Fensterbank
  mFlaeche(ctx, s, x - 6, y + h + 3, b + 12, 3.5, w.licht);
  mFlaeche(ctx, s, x - 6, y + h + 6, b + 12, 1.5, w.schatten);
};

MOEBELBILD.schrank = (ctx, s, x, y, b, h) => {
  const w = STOFFE.holz;
  // Gesims
  mFlaeche(ctx, s, x - 3, y, b + 6, 5, w.licht);
  mFlaeche(ctx, s, x - 3, y + 4, b + 6, 2, w.schatten);
  mKasten(ctx, s, x, y + 6, b, h - 12, w, 1.5);
  // zwei Türen mit Füllung
  for (let i = 0; i < 2; i++){
    const tx = x + 3 + i * ((b - 6) / 2);
    const tb = (b - 6) / 2 - 1.5;
    mFlaeche(ctx, s, tx, y + 9, tb, h - 18, w.flaeche);
    mUmriss(ctx, s, tx + 4, y + 13, tb - 8, h - 26, 1.2, w.schatten);
    mUmriss(ctx, s, tx + 5.2, y + 14.2, tb - 10.4, h - 28.4, 0.8, w.licht);
    mMaserung(ctx, s, tx + 7, y + 16, tb - 14, h - 32, w.schatten, 6);
  }
  // Griffe
  [x + b / 2 - 5, x + b / 2 + 2].forEach(gx => {
    mFlaeche(ctx, s, gx, y + h * 0.48, 3, 9, STOFFE.metall.kante);
    mFlaeche(ctx, s, gx, y + h * 0.48, 1.5, 9, STOFFE.metall.licht);
  });
  // Füße
  [x + 3, x + b - 11].forEach(fx => mFlaeche(ctx, s, fx, y + h - 6, 8, 6, w.kante));
};

MOEBELBILD.spiegel = (ctx, s, x, y, b, h) => {
  const w = STOFFE.holz;
  mKasten(ctx, s, x, y, b, h, w, 1.2);
  mFlaeche(ctx, s, x + 5, y + 5, b - 10, h - 10, '#CFE6F2');
  mFlaeche(ctx, s, x + 5, y + 5, b - 10, (h - 10) * 0.55, '#E3F2FA');
  // schräger Lichtreflex
  mSchraeg(ctx, s, x + 8, y + h - 10, x + b * 0.5, y + 8, 3, '#FFFFFF');
  mSchraeg(ctx, s, x + 14, y + h - 10, x + b * 0.72, y + 8, 1.6, '#FFFFFF');
  mUmriss(ctx, s, x + 5, y + 5, b - 10, h - 10, 0.8, '#9CB6C4');
};

MOEBELBILD.stange = (ctx, s, x, y, b, h) => {
  const m = STOFFE.metall;
  mFlaeche(ctx, s, x, y, b, 2.5, m.flaeche);
  mFlaeche(ctx, s, x, y, b, 1, m.licht);
  mFlaeche(ctx, s, x, y + 2, b, 0.8, m.kante);
  [x, x + b - 3].forEach(hx => mFlaeche(ctx, s, hx, y - 2, 3, 7, m.kante));
  // Bügel mit Kleidungsstücken
  const farben = ['#FF8AA8','#4FA8FF','#FFD166','#A65CFF'];
  for (let i = 0; i < 4; i++){
    const bx = x + 12 + i * ((b - 24) / 3);
    mSchraeg(ctx, s, bx, y + 8, bx - 5, y + 3, 1, m.kante);
    mSchraeg(ctx, s, bx, y + 8, bx + 5, y + 3, 1, m.kante);
    mFlaeche(ctx, s, bx - 0.6, y + 1, 1.2, 3, m.kante);
    const f = farben[i % farben.length];
    mRund(ctx, s, bx - 7, y + 8, 14, h - 12, 3, f);
    mFlaeche(ctx, s, bx - 7, y + 8, 4, h - 12, '#FFFFFF33');
    mFlaeche(ctx, s, bx - 7, y + h - 6, 14, 1.5, '#00000022');
  }
};

MOEBELBILD.wanne = (ctx, s, x, y, b, h) => {
  const w = STOFFE.emaille;
  mRund(ctx, s, x, y + 3, b, h - 3, 8, w.flaeche);
  mRund(ctx, s, x + 2, y + 5, b - 4, h - 9, 7, '#DCEFF7');
  mFlaeche(ctx, s, x, y, b, 5, w.licht);
  mFlaeche(ctx, s, x, y + 4, b, 1.5, w.schatten);
  mFlaeche(ctx, s, x + 3, y + 7, b - 6, 2, '#FFFFFF');
  [x + 10, x + b - 18].forEach(fx => {
    mFlaeche(ctx, s, fx, y + h - 2, 8, 5, STOFFE.metall.flaeche);
    mFlaeche(ctx, s, fx, y + h - 2, 2, 5, STOFFE.metall.licht);
  });
  // Armatur
  const m = STOFFE.metall;
  mFlaeche(ctx, s, x + b - 26, y - 12, 3, 13, m.flaeche);
  mFlaeche(ctx, s, x + b - 26, y - 12, 1.2, 13, m.licht);
  mFlaeche(ctx, s, x + b - 30, y - 14, 11, 3, m.flaeche);
  mFlaeche(ctx, s, x + b - 30, y - 14, 11, 1.2, m.licht);
};

MOEBELBILD.waschbecken = (ctx, s, x, y, b, h) => {
  const w = STOFFE.emaille, m = STOFFE.metall;
  // Säule
  mFlaeche(ctx, s, x + b * 0.3, y + 16, b * 0.4, h - 16, w.flaeche);
  mFlaeche(ctx, s, x + b * 0.3, y + 16, b * 0.12, h - 16, w.licht);
  mFlaeche(ctx, s, x + b * 0.62, y + 16, b * 0.08, h - 16, w.schatten);
  mFlaeche(ctx, s, x + b * 0.22, y + h - 4, b * 0.56, 4, w.schatten);
  // Becken
  mRund(ctx, s, x, y + 2, b, 18, 4, w.flaeche);
  mRund(ctx, s, x + 3, y + 4, b - 6, 12, 3, '#DCEFF7');
  mFlaeche(ctx, s, x, y, b, 3.5, w.licht);
  mKreis(ctx, s, x + b / 2, y + 13, 2, m.kante);
  // Armatur
  mFlaeche(ctx, s, x + b / 2 - 1.5, y - 10, 3, 11, m.flaeche);
  mFlaeche(ctx, s, x + b / 2 - 1.5, y - 10, 1.2, 11, m.licht);
  mFlaeche(ctx, s, x + b / 2 - 1.5, y - 11, 8, 2.5, m.flaeche);
};

MOEBELBILD.bett = (ctx, s, x, y, b, h, stoff) => {
  const w = STOFFE.holz;
  const a = (stoff && stoff[0]) || '#FFC2E2';
  const m = (stoff && stoff[1]) || '#FF4FA3';
  mFlaeche(ctx, s, x, y - 18, 8, h + 18, w.flaeche);          // Kopfteil
  mFlaeche(ctx, s, x, y - 18, 3, h + 18, w.licht);
  mFlaeche(ctx, s, x + b - 6, y - 6, 6, h + 6, w.flaeche);
  mFlaeche(ctx, s, x + 6, y + 8, b - 10, h - 12, w.schatten);
  mRund(ctx, s, x + 8, y + 6, b - 14, 12, 3, '#FFFFFF');      // Matratze
  mRund(ctx, s, x + 26, y + 4, b - 34, 14, 3, a);             // Decke
  for (let i = 1; i < 5; i++) mFlaeche(ctx, s, x + 26 + i * ((b - 34) / 5), y + 5, 1, 12, m);
  mRund(ctx, s, x + 10, y + 2, 20, 12, 4, '#FFF8FF');         // Kissen
  mFlaeche(ctx, s, x, y + h - 3, 8, 3, w.kante);
  mFlaeche(ctx, s, x + b - 6, y + h - 3, 6, 3, w.kante);
};

MOEBELBILD.nachttisch = (ctx, s, x, y, b, h) => {
  const w = STOFFE.holz;
  mFlaeche(ctx, s, x - 1, y, b + 2, 3, w.licht);
  mKasten(ctx, s, x, y + 3, b, h - 9, w, 1);
  mFlaeche(ctx, s, x + 3, y + 7, b - 6, (h - 16) / 2, w.schatten);
  mFlaeche(ctx, s, x + 3, y + 9 + (h - 16) / 2, b - 6, (h - 16) / 2, w.schatten);
  [y + 7 + (h - 16) / 4, y + 9 + (h - 16) * 0.75].forEach(gy =>
    mFlaeche(ctx, s, x + b / 2 - 5, gy, 10, 2, STOFFE.metall.flaeche));
  [x + 2, x + b - 6].forEach(fx => mFlaeche(ctx, s, fx, y + h - 6, 4, 6, w.kante));
};

MOEBELBILD.lampe = (ctx, s, x, y, b, h) => {
  const m = STOFFE.metall;
  const schirm = h * 0.22;
  // Schirm als Trapez
  const n = Math.max(1, Math.round(schirm * s.mass));
  for (let i = 0; i < n; i++){
    const t = i / n;
    const br = b * (0.5 + t * 0.5);
    mFlaeche(ctx, s, x + b / 2 - br / 2, y + i / s.mass, br, 1 / s.mass + 0.01,
             t < 0.25 ? '#FFF3C4' : t < 0.7 ? '#FFE08A' : '#F5C64E');
  }
  mFlaeche(ctx, s, x + b / 2 - b / 2, y + schirm - 1.5, b, 1.5, '#D9A033');
  mFlaeche(ctx, s, x + b / 2 - 1.2, y + schirm, 2.4, h - schirm - 4, m.flaeche);
  mFlaeche(ctx, s, x + b / 2 - 1.2, y + schirm, 1, h - schirm - 4, m.licht);
  mRund(ctx, s, x + b * 0.2, y + h - 4.5, b * 0.6, 4.5, 2, m.flaeche);
  mFlaeche(ctx, s, x + b * 0.2, y + h - 1.5, b * 0.6, 1.5, m.kante);
};

/* Gibt es eine Zeichnung für diesen Namen? */
function moebelDa(name){ return !!MOEBELBILD[name]; }

function maleMoebel(ctx, s, name, x, oben, b, h, stoff, nacht){
  const f = MOEBELBILD[name];
  if (!f) return false;
  f(ctx, s, x, oben, b, h, stoff, nacht);
  return true;
}
