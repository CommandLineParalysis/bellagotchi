# Eigene Pixelgrafiken einsetzen

## Die eine Regel

**5,6 Bildpunkte je Zentimeter.**

Geeicht ist das an deiner Pflanze: 140 Punkte hoch, in Wirklichkeit
25 cm. 140 ÷ 25 = 5,6. Alles andere folgt daraus.

Ein Herd ist 85 cm hoch, also **476 Punkte** — mehr als das Dreifache der
Pflanze. Ein Kühlschrank 170 cm, also **952 Punkte**. Bella genauso.

Das ist die Auflösung, in der du malst. Sie hat nichts damit zu tun, wie
viele Punkte das Handy gerade zeigt.

## Warum das Handy weniger zeigt

Im Bild steht immer ein ganzes Zimmer: 340 cm breit. Ein Handy mit
390 CSS-Punkten und dreifacher Dichte hat dafür 1170 echte Bildpunkte.

    1170 Punkte ÷ 340 cm = 3,44 Punkte je Zentimeter

Die Pflanze erscheint dort also 86 Punkte hoch statt 140. Ihre 140
gemalten Zeilen stecken alle in der Datei; das Gerät zeigt 61 % davon.
Auf einem Tablet oder einem dichteren Bildschirm wird mehr davon
sichtbar. Male deshalb immer in 5,6 — nie in dem, was das Handy zeigt.

## So setzt du eine Grafik ein

1. Datei als PNG mit durchsichtigem Hintergrund speichern.
2. Unter dem Namen des Platzes nach `www/bilder/` legen,
   z. B. `www/bilder/herd.png`.
3. In `www/js/bilder.js` bei diesem Platz den Dateinamen eintragen.

Die Datei wird **nicht verändert**: nicht umgefärbt, nicht zugeschnitten,
nicht geglättet. Sie wird nur auf ihre eingetragene Größe in Zentimetern
gebracht — sonst stünde ein 476 Punkte hoher Herd in einem Zimmer, das
3,44 Punkte je Zentimeter zeigt, viermal zu groß da.

Stimmt die Höhe der Datei nicht mit der Eintragung überein, sagt
`massPruefen` die Abweichung in Prozent.

## Die Maße

| Platz | Höhe | Breite | Datei muss sein |
|---|---|---|---|
| `deko_pflanze` | 25 cm | 21 cm | 140 px hoch × 118 px breit |
| `teller` | 4 cm | frei | 22 px hoch |
| `schwamm` | 9 cm | frei | 50 px hoch |
| `hand_dusche` | 22 cm | frei | 123 px hoch |
| `sp_ente` | 9 cm | frei | 50 px hoch |
| `ku_baer` | 30 cm | frei | 168 px hoch |
| `kissen_a` | 35 cm | frei | 196 px hoch |
| `stange` | 40 cm | 120 cm | 224 px hoch × 672 px breit |
| `wanne` | 55 cm | 150 cm | 308 px hoch × 840 px breit |
| `bett` | 55 cm | 200 cm | 308 px hoch × 1120 px breit |
| `nachttisch` | 55 cm | 45 cm | 308 px hoch × 252 px breit |
| `pflanze` | 60 cm | 45 cm | 336 px hoch × 252 px breit |
| `tisch` | 75 cm | 120 cm | 420 px hoch × 672 px breit |
| `sofa` | 80 cm | 180 cm | 448 px hoch × 1008 px breit |
| `herd` | 85 cm | 60 cm | 476 px hoch × 336 px breit |
| `waschbecken` | 85 cm | 55 cm | 476 px hoch × 308 px breit |
| `spiegel` | 90 cm | 60 cm | 504 px hoch × 336 px breit |
| `fenster` | 110 cm | 90 cm | 616 px hoch × 504 px breit |
| `lampe` | 150 cm | 40 cm | 840 px hoch × 224 px breit |
| `kuehlschrank` | 170 cm | 60 cm | 952 px hoch × 336 px breit |
| `bella` | 170 cm | 46 cm | 952 px hoch × 258 px breit |
| `regal` | 180 cm | 90 cm | 1008 px hoch × 504 px breit |
| `schrank` | 190 cm | 110 cm | 1064 px hoch × 616 px breit |

Steht bei der Breite **frei**, richtet sie sich nach dem
Seitenverhältnis deiner Datei — die Höhe entscheidet.

Die Zentimeter stehen in `www/js/massstab.js` unter `GROESSEN_CM` und
`BREITEN_CM`. Soll etwas größer oder kleiner sein, ändert sich dort die
Zahl, nicht die Datei.

## Zutaten, Snacks und Gerichte

Die stehen nicht im Zimmer, sondern in den Listen (Vorrat, Kochen,
Bestellen, Snacks) und auf den Kochkarten. Für sie gilt die
Zentimeter-Tabelle oben nicht — sie haben eigene Maße:

| Platz | Wo | Datei sollte sein |
|---|---|---|
| `zutat_erdbeere`, `zutat_milch`, `zutat_mehl`, `zutat_honig`, `zutat_beere`, `zutat_ei` | Listen + Kochkarte (24 cm hoch) | **134 px hoch**, quadratisch |
| `gericht_<rezept>` | Kochkarte (30 cm hoch) | **168 px hoch** |
| `snack_keks`, `snack_schoki`, `snack_apfel`, `snack_brezel`, `snack_lutscher`, `snack_joghurt`, `snack_nuesse`, `snack_gummibaer` | nur die Snack-Liste | **quadratisch, 80–160 px** |

In den Listen wird das Bild mittig in ein Kästchen gesetzt und nur um
ganze Vielfache vergrößert, solange es hineinpasst — ein gemalter Punkt
bleibt ein Quadrat. Auf der Kochkarte wird es auf seine Kartenhöhe
gebracht, dieselbe, die auch der Platzhalter hat.

Liegt keine Datei da, zeigt die Liste den gezeichneten Platzhalter; gibt
es auch den nicht (Snacks), einen Klecks in der Farbe des Stücks. Das ist
das Zeichen, dass dort noch ein Bild fehlt.

## Wo etwas steht

Im Spiel: Stift oben rechts → **Gegenstände setzen**. Antippen wählt
aus, die Pfeile verschieben auf den Zentimeter genau, **Werte ausgeben**
schreibt die Stellen als JSON heraus.
