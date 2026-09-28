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

## Maßstab

Geeicht wird an der ersten gelieferten Grafik: die Pflanze ist in
Wirklichkeit **25 cm** hoch und **140 Bildpunkte** groß.

    140 Punkte / 25 cm = 5,6 Punkte je Zentimeter

Gezeichnet wird in **Gerätepunkten**, nicht in CSS-Punkten — ein Handy
hat bei gleicher Fläche das Zwei- bis Dreifache an echten Bildpunkten,
und genau diese Reserve braucht dieser Detailgrad. Bei dreifacher Dichte
zeigt die Bühne rund **209 × 226 cm** Zimmer.

## Größen

Jede Grafik hat eine wirkliche Größe in Zentimetern; sie steht in
`www/js/massstab.js` unter `GROESSEN_CM`. Daraus ergibt sich, wie viele
Punkte sie haben soll:

| Ding | wirklich | Punkte (Höhe) |
|---|---|---|
| Bella | 170 cm | 952 |
| Pflanze (gegeben) | 25 cm | 140 |
| Kühlschrank | 170 cm | 952 |
| Schrank | 190 cm | 1064 |
| Regal | 180 cm | 1008 |
| Fenster | 110 cm | 616 |
| Tisch | 75 cm | 420 |
| Sofa | 80 cm | 448 |
| Kuscheltier | 24–34 cm | 134–190 |
| Badeente | 9 cm | 50 |

Ist eine gelieferte Datei größer oder kleiner als ihre Eintragung, sagt
`massPruefen()` die Abweichung in Prozent — das fällt dann auf, statt
dass das Ding stillschweigend zu groß im Zimmer steht.

## Genau platzieren

Im Spiel: **Stift** oben rechts → **GENAU PLATZIEREN**. Dort einen
Gegenstand wählen, dann auf das Bild tippen — dorthin kommt seine
Unterkante, mittig unter den Finger. Die vier Pfeile schieben um einen
Zentimeter. **ZAHLEN ZEIGEN** gibt alles als JSON aus; schick es mir,
dann trage ich die Plätze fest ein. **ZURÜCKSETZEN** stellt die
Voreinstellung wieder her.

## Alte Größenangaben



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
