# Bellagotchi

Eine Offline-App des **B-Appiverse**. Ein ruhiges Pflegespiel in Pixeloptik:
man kümmert sich um Bella — füttern, waschen, anziehen, reden, schlafen
lassen — und richtet dabei ihre fünf Zimmer ein.

**Lies vor jeder Codeänderung den Skill `bappiverse:konventionen`.** Dort
steht, wie hier gearbeitet wird: Offline-Grundsatz, Datenformat,
Testdisziplin, Commit-Stil.

## Was diese App ausdrücklich nicht tut

- **Bella kann nicht sterben, krank werden oder weglaufen.** Sie wird müde
  und traurig, mehr nicht. Kein Wert fällt unter `BODEN_WERT`, und
  nachgerechnet wird höchstens `NACHHOLGRENZE` Stunden. Wer diese beiden
  Zahlen anfasst, ändert das Versprechen der App.
- Keine Strafen, keine Fristen, keine Serien, die reißen.
- Keine Münzen und keinen Laden. Neues kommt mit der Post, wenn es Bella
  gut geht — man pflegt nicht, um etwas zu bekommen.
- Kein Netz, kein Echtgeld, keine Werbung.
- Keine zweite Bella, kein Besuch, kein Vergleich mit anderen.

## Eigenheiten, die beim Ändern wichtig sind

- **Die Pixelbilder stehen als Textraster in `www/js/sprites.js`**, nicht als
  PNG. `pruefeRaster()` prüft jede Zeile auf gleiche Länge und bekannte
  Zeichen; der Funktionstest ruft das auf. Ein verrutschtes Zeichen fällt
  sonst erst als Loch im Sofa auf.
- **Die Ziffern 1–6 in einem Raster sind Plätze, keine Farben.** Bella
  bekommt dort Kleid- und Haarfarben, eine Kachel Wand- oder Bodenfarben.
  Deshalb braucht ein neues Kleid kein neues Bild. Wand und Boden werden
  getrennt gemalt und benutzen **beide** die Plätze 1–3.
- **Der Maßstab wird am Gehäuse gemessen, nicht am Schirmrahmen.** Der
  Rahmen legt sich um das Bild und das Bild richtet sich nach ihm — das
  ginge im Kreis.
- **Nachts wird mit Rasterpunkten *und* halber Deckkraft gedeckt.** Nur
  Punkte löschen das halbe Bild, nur Deckkraft sähe nach Weichzeichner aus.
  Die Dichte liegt bewusst nicht bei 8 von 16: genau die Hälfte ergibt ein
  Schachbrett, das über dem Wandmuster flimmert.
- **Das Schlaffenster geht über Mitternacht** (Voreinstellung 02:30–10:30).
  `istSchlafzeit` unterscheidet deshalb zwei Fälle, und `schlafMinuten`
  zählt in Fünf-Minuten-Schritten statt zu rechnen — das Fenster ist
  verschiebbar, eine Formel dafür könnte in zwei Wochen keiner mehr lesen.
- **Jede Zutatenpaarung muss ein Rezept haben.** Bei sechs Zutaten sind das
  fünfzehn; der Test zählt nach.
- **Jede Handlung geht durch `pflegen()`.** Dort wird begrenzt, gesprochen
  und gespeichert.

## Nachschlagen

`ANLEITUNG.md` erklärt Bauen und Bedienen — steht noch aus.
