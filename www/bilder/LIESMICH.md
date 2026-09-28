# Eigene Pixelgrafiken einsetzen

Jede Grafik im Spiel hat einen **Platz**. Die Plätze stehen in
`www/js/bilder.js` unter `BILDPLAETZE`.

Eine eigene Grafik einzusetzen heißt:

1. PNG mit Transparenz in diesen Ordner legen, benannt wie der Platz
   (`bella_steht.png`, `szene_wanne.png`, `gericht_pfannkuchen.png` …).
2. In `BILDPLAETZE` den Dateinamen eintragen: `bella_steht: 'bilder/bella_steht.png'`.

Mehr passiert nicht. Die Datei wird **unverändert** gezeichnet: keine
Palette, kein Umfärben, kein Zuschnitt, keine Glättung. Vergrößert wird
nur um ganze Vielfache, damit ein gemalter Pixel ein Pixel bleibt.

## Größen

Gerechnet wird in **Spielpixeln**, nicht in Bildschirmpunkten. Die Bühne
ist je nach Gerät etwa 110–200 Spielpixel breit und 90–140 hoch.

| Art | Empfohlene Größe |
|---|---|
| Ganze Szene (`szene_*`) | 160 × 120 |
| Bella stehend | 24 × 32 |
| Bella liegend | 24 × 12 |
| Möbelstück | 14–44 breit |
| Kleinkram (Kissen, Spielzeug) | 10–16 |
| Gericht (`gericht_*`) | 24 × 18 |
| Zutat (`zutat_*`) | 12 × 12 |

Ein Szenenbild ersetzt den gezeichneten Hintergrund vollständig; Bella
und die Gegenstände werden darüber gelegt. Wo sie sitzen, steht in
`ANKER` als Anteil der Bühne — das lässt sich zu einem gelieferten Bild
passend verschieben.
