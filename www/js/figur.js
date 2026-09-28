/* ============================================================
   Bellagotchi — Bella, gezeichnet.

   Bella war ein Raster von 32 Zeilen. Auf 170 cm gezogen wurde jede
   Zeile ein Balken von über fünf Zentimetern: ihr Auge war so groß wie
   ihre Hand. Hier steht sie stattdessen in Zentimetern da — der Kopf
   32 cm, das Auge 5 cm, der Lidstrich einen halben. Wie fein das auf
   dem Bildschirm wird, entscheidet der Bildschirm.

   Alles hängt an einem Faktor `e`: ein Zentimeter Bella. Damit sitzt
   jedes Teil an derselben Stelle, egal ob sie im Zimmer steht oder groß
   in der Badewanne. Gespiegelt wird über `spiegel`.
   ============================================================ */

const BELLA_MASS = {
  hoch: 170, breit: 46,
  kopfOben: 6, kopfHoch: 32, kopfBreit: 26,
  hals: 38, schulter: 44, schulterBreit: 32,
  taille: 74, huefte: 90,
  armOben: 47, armUnten: 98, armDick: 6.5,
  beinOben: 98, fuss: 161, beinDick: 9.5,
};

const HAUT = { licht:'#FFE7D2', flaeche:'#FFD9BC', schatten:'#EDAE86', kante:'#C98B6A' };

/* Ein Rechteck in Bella-Zentimetern. */
function fRechteck(ctx, s, o, xc, yc, b, h, farbe){
  if (!farbe || b <= 0 || h <= 0) return;
  const xx = o.spiegel ? -(xc + b) : xc;
  mFlaeche(ctx, s, o.mx + xx * o.e, o.oben + yc * o.e, b * o.e, h * o.e, farbe);
}

function fRund(ctx, s, o, xc, yc, b, h, r, farbe){
  if (!farbe) return;
  const xx = o.spiegel ? -(xc + b) : xc;
  mRund(ctx, s, o.mx + xx * o.e, o.oben + yc * o.e, b * o.e, h * o.e, r * o.e, farbe);
}

function fKreis(ctx, s, o, xc, yc, r, farbe){
  const xx = o.spiegel ? -xc : xc;
  mKreis(ctx, s, o.mx + xx * o.e, o.oben + yc * o.e, r * o.e, farbe);
}

/* ---------- Kleidungsstücke ----------
   Jedes sagt nur, welche Flächen es belegt: Oberteil, Rock, Hose. Die
   Farben kommen aus der Garderobe, damit ein neues Stück keine eigene
   Farbtabelle braucht. */
const STUECKE = {
  kleid: (ctx, s, o, f) => {
    const M = BELLA_MASS;
    // Oberteil
    fRund(ctx, s, o, -16, M.schulter, 32, 32, 5, f[1]);
    fRund(ctx, s, o, -15, M.schulter + 1, 30, 14, 5, f[0]);
    // Rock: wird nach unten breiter, Zeile für Zeile
    const n = Math.max(1, Math.round(38 * o.e * s.mass));
    for (let i = 0; i < n; i++){
      const t = i / n;
      const br = 34 + t * 24;
      fRechteck(ctx, s, o, -br / 2, 72 + t * 38, br, 1 / (o.e * s.mass) + 0.02,
                t > 0.82 ? f[2] : t > 0.45 ? f[1] : f[0]);
    }
    // Falten
    for (let i = -2; i <= 2; i++)
      fRechteck(ctx, s, o, i * 9 - 0.5, 78, 1, 30, f[2]);
    fRechteck(ctx, s, o, -6, M.schulter + 16, 12, 2.5, f[2]);   // Gürtel
  },
  rock: (ctx, s, o, f) => {
    fRund(ctx, s, o, -16, BELLA_MASS.schulter, 32, 34, 5, f[0]);
    fRechteck(ctx, s, o, -16, BELLA_MASS.schulter + 28, 32, 6, f[1]);
    fRund(ctx, s, o, -21, 76, 42, 30, 4, f[1]);
    for (let i = -2; i <= 2; i++) fRechteck(ctx, s, o, i * 8 - 0.6, 78, 1.2, 26, f[2]);
    fRechteck(ctx, s, o, -21, 102, 42, 4, f[2]);
  },
  latzhose: (ctx, s, o, f) => {
    fRund(ctx, s, o, -15, BELLA_MASS.schulter, 30, 26, 5, '#FFF8FF');   // Shirt
    fRechteck(ctx, s, o, -12, BELLA_MASS.schulter + 2, 5, 22, f[1]);     // Träger
    fRechteck(ctx, s, o, 7, BELLA_MASS.schulter + 2, 5, 22, f[1]);
    fRund(ctx, s, o, -14, 64, 28, 20, 3, f[1]);                          // Latz
    fRechteck(ctx, s, o, -9, 70, 18, 10, f[0]);                          // Tasche
    fRund(ctx, s, o, -16, 82, 32, 34, 3, f[1]);                          // Hosenbund
    fRechteck(ctx, s, o, -16, 100, 13, 58, f[1]);                        // Beine
    fRechteck(ctx, s, o, 3, 100, 13, 58, f[1]);
    fRechteck(ctx, s, o, -16, 150, 13, 3, f[2]);
    fRechteck(ctx, s, o, 3, 150, 13, 3, f[2]);
    fKreis(ctx, s, o, -10, 84, 1.8, '#FFD166');
    fKreis(ctx, s, o, 10, 84, 1.8, '#FFD166');
  },
  pulli: (ctx, s, o, f) => {
    fRund(ctx, s, o, -18, BELLA_MASS.schulter - 2, 36, 52, 6, f[1]);
    fRund(ctx, s, o, -17, BELLA_MASS.schulter - 1, 34, 20, 6, f[0]);
    fRechteck(ctx, s, o, -18, 90, 36, 4, f[2]);                          // Bund
    for (let i = 0; i < 5; i++) fRechteck(ctx, s, o, -18, 52 + i * 7, 36, 1, f[2]);
    fRund(ctx, s, o, -15, 92, 30, 30, 3, '#4A3266');                     // Leggings
    fRechteck(ctx, s, o, -15, 100, 12, 58, '#4A3266');
    fRechteck(ctx, s, o, 3, 100, 12, 58, '#4A3266');
  },
  schlafanzug: (ctx, s, o, f) => {
    fRund(ctx, s, o, -17, BELLA_MASS.schulter - 1, 34, 44, 5, f[0]);
    for (let i = 0; i < 6; i++) fRechteck(ctx, s, o, -17, 48 + i * 7.5, 34, 2, f[1]);
    fRund(ctx, s, o, -16, 84, 32, 28, 3, f[1]);
    fRechteck(ctx, s, o, -16, 100, 13, 56, f[1]);
    fRechteck(ctx, s, o, 3, 100, 13, 56, f[1]);
    for (let i = 0; i < 7; i++){
      fRechteck(ctx, s, o, -16, 104 + i * 7.5, 13, 2, f[0]);
      fRechteck(ctx, s, o, 3, 104 + i * 7.5, 13, 2, f[0]);
    }
    fRechteck(ctx, s, o, -1, BELLA_MASS.schulter + 6, 2, 34, f[2]);      // Knopfleiste
  },
};

/* Zeigt das Stück nackte Beine? Dann werden sie vorher gemalt. */
const BEINE_FREI = { kleid: true, rock: true, latzhose: false, pulli: false, schlafanzug: false };

/* ---------- Frisuren ----------
   `hinten` läuft vor dem Körper aus, `vorn` liegt über dem Gesicht. */
const FRISURBILD = {
  lang: {
    hinten: (ctx, s, o, hf) => {
      fRund(ctx, s, o, -18, 8, 36, 88, 12, hf[2]);
      fRund(ctx, s, o, -16, 10, 32, 84, 11, hf[1]);
      fRechteck(ctx, s, o, -16, 80, 6, 14, hf[2]);
      fRechteck(ctx, s, o, 10, 80, 6, 14, hf[2]);
    },
    vorn: (ctx, s, o, hf) => {
      fRund(ctx, s, o, -15, 3, 30, 20, 9, hf[0]);
      fRund(ctx, s, o, -14, 5, 28, 12, 6, hf[1]);
      fRechteck(ctx, s, o, -14, 12, 11, 8, hf[1]);       // Pony
      fRechteck(ctx, s, o, 3, 12, 11, 6, hf[1]);
      fRechteck(ctx, s, o, -15, 12, 4, 26, hf[1]);       // Seitensträhnen
      fRechteck(ctx, s, o, 11, 12, 4, 26, hf[1]);
      fRechteck(ctx, s, o, -11, 5, 5, 6, hf[0]);         // Glanz
    },
  },
  kurz: {
    hinten: (ctx, s, o, hf) => fRund(ctx, s, o, -16, 8, 32, 38, 11, hf[2]),
    vorn: (ctx, s, o, hf) => {
      fRund(ctx, s, o, -15, 3, 30, 36, 10, hf[1]);
      fRund(ctx, s, o, -14, 4, 28, 14, 7, hf[0]);
      fRechteck(ctx, s, o, -14, 11, 12, 9, hf[1]);
      fRechteck(ctx, s, o, 4, 11, 10, 6, hf[1]);
      fRechteck(ctx, s, o, -15, 12, 4, 24, hf[1]);
      fRechteck(ctx, s, o, 11, 12, 4, 24, hf[1]);
      fRechteck(ctx, s, o, -10, 5, 5, 5, hf[0]);
    },
  },
  zopf: {
    hinten: (ctx, s, o, hf) => {
      fRund(ctx, s, o, -15, 8, 30, 30, 10, hf[2]);
      [-19, 12].forEach(zx => {
        for (let i = 0; i < 7; i++)
          fRund(ctx, s, o, zx - (i % 2) * 0.8, 26 + i * 8, 7 - i * 0.3, 9, 3,
                i % 2 ? hf[1] : hf[2]);
        fRechteck(ctx, s, o, zx - 1, 24, 9, 4, '#FF4FA3');
        fRechteck(ctx, s, o, zx, 82, 6, 3, '#FF4FA3');
      });
    },
    vorn: (ctx, s, o, hf) => {
      fRund(ctx, s, o, -15, 3, 30, 20, 9, hf[1]);
      fRund(ctx, s, o, -14, 4, 28, 11, 6, hf[0]);
      fRechteck(ctx, s, o, -14, 11, 9, 8, hf[1]);
      fRechteck(ctx, s, o, 5, 11, 9, 8, hf[1]);
      fRechteck(ctx, s, o, -3, 11, 6, 4, hf[1]);
      fRechteck(ctx, s, o, -9, 4, 5, 5, hf[0]);
    },
  },
  locken: {
    hinten: (ctx, s, o, hf) => {
      for (let i = 0; i < 16; i++){
        const a = (i / 16) * Math.PI * 2;
        fKreis(ctx, s, o, Math.cos(a) * 17, 22 + Math.sin(a) * 19, 8, hf[2]);
      }
      for (let i = 0; i < 10; i++){
        const a = (i / 10) * Math.PI * 2;
        fKreis(ctx, s, o, Math.cos(a) * 13, 22 + Math.sin(a) * 14, 7.5, hf[1]);
      }
    },
    vorn: (ctx, s, o, hf) => {
      for (let i = 0; i < 6; i++) fKreis(ctx, s, o, -14 + i * 5.6, 10, 5.5, hf[1]);
      for (let i = 0; i < 4; i++) fKreis(ctx, s, o, -9 + i * 6, 6, 4.5, hf[0]);
      fKreis(ctx, s, o, -14, 22, 5, hf[1]);
      fKreis(ctx, s, o, 14, 22, 5, hf[1]);
    },
  },
};

/* ---------- Schuhe ---------- */
const SCHUHBILD = {
  sch_barfuss: () => {},
  sch_ballerina: (ctx, s, o, f) => {
    [-11, 2].forEach(sx => {
      fRund(ctx, s, o, sx, 158, 10, 8, 3, f[1]);
      fRund(ctx, s, o, sx + 1, 159, 8, 3, 2, f[0]);
      fKreis(ctx, s, o, sx + 5, 160, 1.8, '#FFF8FF');
    });
  },
  sch_stiefel: (ctx, s, o) => {
    [-11, 2].forEach(sx => {
      fRund(ctx, s, o, sx, 132, 10, 32, 3, '#8A5B2E');
      fRechteck(ctx, s, o, sx, 134, 10, 2, '#C98B5A');
      fRechteck(ctx, s, o, sx, 146, 10, 2, '#C98B5A');
      fRund(ctx, s, o, sx - 1, 160, 12, 6, 2, '#5C3A1B');
    });
  },
  sch_turnschuh: (ctx, s, o) => {
    [-11, 2].forEach(sx => {
      fRund(ctx, s, o, sx, 152, 11, 14, 3, '#FFF8FF');
      fRund(ctx, s, o, sx - 1, 160, 13, 6, 2, '#4FA8FF');
      for (let i = 0; i < 3; i++) fRechteck(ctx, s, o, sx + 2, 154 + i * 3, 7, 1.2, '#C9A6FF');
    });
  },
  sch_sandale: (ctx, s, o) => {
    [-11, 2].forEach(sx => {
      fRechteck(ctx, s, o, sx - 1, 162, 13, 4, '#C98B5A');
      fRechteck(ctx, s, o, sx, 156, 11, 2, '#FFD166');
      fRechteck(ctx, s, o, sx + 1, 159, 9, 2, '#FFD166');
    });
  },
};

/* ---------- Accessoires ---------- */
const ACCBILD = {
  acc_keins: () => {},
  acc_schleife: (ctx, s, o) => {
    fRund(ctx, s, o, 4, 2, 9, 7, 3, '#FF4FA3');
    fRund(ctx, s, o, 13, 2, 9, 7, 3, '#FF4FA3');
    fKreis(ctx, s, o, 13, 5.5, 2.4, '#FFC2E2');
  },
  acc_hut: (ctx, s, o) => {
    fRund(ctx, s, o, -20, 6, 40, 5, 2, '#FFD166');
    fRund(ctx, s, o, -11, -6, 22, 13, 4, '#FFD166');
    fRechteck(ctx, s, o, -11, 3, 22, 3, '#FF8AA8');
  },
  acc_brille: (ctx, s, o) => {
    mRing(ctx, s, o.mx + (o.spiegel ? 6.5 : -6.5) * o.e, o.oben + 24 * o.e, 5.5 * o.e, 1 * o.e, '#2B1B3D');
    mRing(ctx, s, o.mx + (o.spiegel ? -6.5 : 6.5) * o.e, o.oben + 24 * o.e, 5.5 * o.e, 1 * o.e, '#2B1B3D');
    fRechteck(ctx, s, o, -1.5, 23.5, 3, 1.2, '#2B1B3D');
  },
  acc_blume: (ctx, s, o) => {
    for (let i = 0; i < 6; i++){
      const a = (i / 6) * Math.PI * 2;
      fKreis(ctx, s, o, 12 + Math.cos(a) * 3.2, 9 + Math.sin(a) * 3.2, 2.6, '#FFC2E2');
    }
    fKreis(ctx, s, o, 12, 9, 2.2, '#FFD166');
  },
  acc_kopfhoerer: (ctx, s, o) => {
    for (let i = 0; i <= 14; i++){
      const a = Math.PI + (i / 14) * Math.PI;
      fRechteck(ctx, s, o, Math.cos(a) * 15 - 1.2, 18 + Math.sin(a) * 15 - 1.2, 2.6, 2.6, '#30F3CF');
    }
    fRund(ctx, s, o, -18, 15, 6, 11, 2, '#189E9B');
    fRund(ctx, s, o, 12, 15, 6, 11, 2, '#189E9B');
  },
  acc_krone: (ctx, s, o) => {
    fRechteck(ctx, s, o, -10, 4, 20, 4, '#FFD166');
    [-10, -4, 2, 7].forEach((zx, i) => {
      const hh = i % 2 ? 6 : 4;
      fRechteck(ctx, s, o, zx, 4 - hh, 3, hh, '#FFD166');
      fKreis(ctx, s, o, zx + 1.5, 4 - hh, 1.6, '#FF4FA3');
    });
  },
};

/* ---------- Gesichter ----------
   Augen sind fünf Zentimeter groß: Weiß, Iris, ein Lichtpunkt und ein
   Lidstrich. Im Raster war davon ein einziger Klotz übrig. */
function maleGesicht(ctx, s, o, art){
  const ax = 6.5, ay = 23;
  const augeAuf = (dx) => {
    fRund(ctx, s, o, dx - 2.8, ay - 3.4, 5.6, 7, 2.4, '#FFFFFF');
    fRund(ctx, s, o, dx - 2.2, ay - 1.6, 4.4, 5, 2, '#4A3266');
    fKreis(ctx, s, o, dx - 0.8, ay - 0.6, 1.2, '#FFFFFF');
    fRechteck(ctx, s, o, dx - 3, ay - 4.4, 6, 1.4, '#3D2C52');
  };
  const augeZu = (dx) => {
    fRechteck(ctx, s, o, dx - 3, ay - 0.6, 6, 1.4, '#3D2C52');
    fRechteck(ctx, s, o, dx - 2, ay + 0.8, 4, 1, '#3D2C52');
  };
  const wange = () => {
    fRund(ctx, s, o, -ax - 4.5, ay + 5, 6, 3.5, 1.6, '#FF9EBE');
    fRund(ctx, s, o, ax - 1.5, ay + 5, 6, 3.5, 1.6, '#FF9EBE');
  };
  if (art === 'schlaef'){ augeZu(-ax); augeZu(ax);
    fRund(ctx, s, o, -2, ay + 8, 4, 3.5, 1.5, '#C97A8C');
    fRechteck(ctx, s, o, 9, ay - 8, 3, 3, '#FFFFFF');
    return; }
  augeAuf(-ax); augeAuf(ax);
  if (art === 'froh' || art === 'satt') wange();
  if (art === 'froh'){
    fRund(ctx, s, o, -4, ay + 7, 8, 5, 2.4, '#8A3A52');
    fRund(ctx, s, o, -2.6, ay + 9.6, 5.2, 2.4, 1.2, '#FF8AA8');
  } else if (art === 'traurig'){
    fRund(ctx, s, o, -3, ay + 9, 6, 2.4, 1.2, '#8A3A52');
    fRechteck(ctx, s, o, -3, ay + 7.4, 6, 1.4, '#8A3A52');
    fRund(ctx, s, o, ax + 2.5, ay + 2, 2.4, 4, 1.2, '#9AD0FF');
  } else if (art === 'satt'){
    fRund(ctx, s, o, -3.5, ay + 7, 7, 4, 2, '#8A3A52');
  } else {
    fRund(ctx, s, o, -2.4, ay + 8, 5, 2.4, 1.2, '#8A3A52');
  }
  fRechteck(ctx, s, o, -0.8, ay + 4, 1.6, 1.4, HAUT.schatten);   // Nase
}

/* ---------- Bella ---------- */
function maleBellaFigur(ctx, s, x, oben, b, h, opt){
  const M = BELLA_MASS;
  const nurKopf = !!(opt && opt.nurKopf);
  const e = h / (nurKopf ? M.hals + 4 : M.hoch);
  const o = { mx: x + b / 2, oben, e, spiegel: !!(opt && opt.spiegel) };
  const stoff = (opt && opt.stoff) || ['#FFC2E2','#FF4FA3','#C41E76'];
  const haar  = (opt && opt.haar)  || ['#FF6FD8','#C13BC9','#7B2BA8'];
  const frisur = FRISURBILD[(opt && opt.frisur)] || FRISURBILD.lang;
  const stueck = (opt && opt.stueck) || 'kleid';

  /* Wird nur der Kopf gezeigt — in der Wanne —, wird alles darunter
     abgeschnitten, sonst hinge das lange Haar quer durchs Wasser. */
  if (nurKopf && ctx.save){
    ctx.save();
    ctx.beginPath();
    ctx.rect(Math.round((o.mx - b) * s.mass), Math.round(oben * s.mass),
             Math.round(2 * b * s.mass), Math.round(h * s.mass));
    ctx.clip();
  }

  frisur.hinten(ctx, s, o, haar);

  if (!nurKopf){
    // Beine — nur sichtbar, wenn das Kleidungsstück sie freilässt
    if (BEINE_FREI[stueck] !== false){
      [-11, 1.5].forEach(bx => {
        fRechteck(ctx, s, o, bx, M.beinOben, M.beinDick, M.fuss - M.beinOben, HAUT.flaeche);
        fRechteck(ctx, s, o, bx, M.beinOben, 2.5, M.fuss - M.beinOben, HAUT.licht);
        fRechteck(ctx, s, o, bx + M.beinDick - 2, M.beinOben, 2, M.fuss - M.beinOben, HAUT.schatten);
      });
      fRund(ctx, s, o, -11, 158, 10, 8, 3, HAUT.flaeche);
      fRund(ctx, s, o, 1.5, 158, 10, 8, 3, HAUT.flaeche);
    }
    // Kleidungsstück
    (STUECKE[stueck] || STUECKE.kleid)(ctx, s, o, stoff);
    /* Die Arme liegen außen am Oberteil, nicht darunter: vorher
       verschwanden sie hinter dem Kleid und Bella hatte keine. */
    const links = -M.schulterBreit / 2 - M.armDick + 1;
    const rechts = M.schulterBreit / 2 - 1;
    [links, rechts].forEach(ax => {
      fRund(ctx, s, o, ax, M.armOben, M.armDick, M.armUnten - M.armOben, 3, HAUT.flaeche);
      fRechteck(ctx, s, o, ax, M.armOben, 2, M.armUnten - M.armOben, HAUT.licht);
      fKreis(ctx, s, o, ax + M.armDick / 2, M.armUnten, 4, HAUT.flaeche);
      fKreis(ctx, s, o, ax + M.armDick / 2 - 1, M.armUnten - 1, 2.6, HAUT.licht);
    });
    // Ärmel über den Armansatz
    const aermel = (stueck === 'pulli' || stueck === 'schlafanzug') ? 44 : 13;
    const af = (stueck === 'pulli' || stueck === 'schlafanzug') ? stoff[1] : stoff[0];
    [links - 1, rechts - 1].forEach(ax =>
      fRund(ctx, s, o, ax, M.armOben - 3, M.armDick + 2, aermel, 3, af));
    // Schuhe
    (SCHUHBILD[(opt && opt.schuhe)] || SCHUHBILD.sch_ballerina)(ctx, s, o, stoff);
    // Hals
    fRechteck(ctx, s, o, -4.5, M.hals - 2, 9, 8, HAUT.schatten);
  }

  // Kopf
  fRund(ctx, s, o, -M.kopfBreit / 2, M.kopfOben, M.kopfBreit, M.kopfHoch, 9, HAUT.flaeche);
  fRund(ctx, s, o, -M.kopfBreit / 2 + 1.5, M.kopfOben + 1.5, M.kopfBreit - 8, M.kopfHoch - 10, 8, HAUT.licht);
  fRechteck(ctx, s, o, M.kopfBreit / 2 - 3.5, M.kopfOben + 8, 3.5, 18, HAUT.schatten);
  // Ohren
  fRund(ctx, s, o, -M.kopfBreit / 2 - 2.5, 22, 4, 7, 2, HAUT.flaeche);
  fRund(ctx, s, o, M.kopfBreit / 2 - 1.5, 22, 4, 7, 2, HAUT.schatten);

  frisur.vorn(ctx, s, o, haar);
  maleGesicht(ctx, s, o, (opt && opt.gesicht) || 'normal');
  (ACCBILD[(opt && opt.accessoire)] || ACCBILD.acc_keins)(ctx, s, o, stoff);
  if (nurKopf && ctx.restore) ctx.restore();
}

/* Bella liegend: Kopf auf dem Kissen, eine Schulter daneben. Die Decke
   legt der Aufrufer darüber, damit „zudecken" wirklich zudeckt. */
function maleBellaLiegend(ctx, s, x, oben, b, h, opt){
  const e = h / 42;
  const o = { mx: x + b / 2, oben, e, spiegel: !!(opt && opt.spiegel) };
  const haar = (opt && opt.haar) || ['#FF6FD8','#C13BC9','#7B2BA8'];
  // Haar breit auf dem Kissen
  fRund(ctx, s, o, -24, 2, 48, 36, 14, haar[2]);
  fRund(ctx, s, o, -21, 4, 42, 30, 12, haar[1]);
  // Kopf, etwas zur Seite gedreht
  fRund(ctx, s, o, -13, 6, 26, 30, 9, HAUT.flaeche);
  fRund(ctx, s, o, -11.5, 7.5, 18, 20, 8, HAUT.licht);
  fRund(ctx, s, o, -14, 3, 30, 12, 6, haar[1]);          // Pony
  fRechteck(ctx, s, o, -14, 10, 4, 18, haar[1]);
  fRechteck(ctx, s, o, 10, 10, 4, 18, haar[1]);
  // geschlossene Augen und schlafender Mund
  fRechteck(ctx, s, o, -9, 22, 6, 1.4, '#3D2C52');
  fRechteck(ctx, s, o, 3, 22, 6, 1.4, '#3D2C52');
  fRund(ctx, s, o, -2, 28, 4, 3.5, 1.5, '#C97A8C');
  fRund(ctx, s, o, -12, 26, 5, 3, 1.4, '#FF9EBE');
  fRund(ctx, s, o, 7, 26, 5, 3, 1.4, '#FF9EBE');
}
