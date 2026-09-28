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

## Wände und Böden

Es gibt **keinen** Hintergrund pro Zimmer. Wand und Boden sind zwei
getrennte Sachen, damit du sie weiter einzeln wechseln kannst — eine
gemalte Wand ersetzt die gewählte Tapete, ein gemalter Boden den
gewählten Boden, und beides bleibt unabhängig umschaltbar.

Die Plätze heißen wie die Auswahl im Spiel:

| | Plätze |
|---|---|
| Tapeten | `wand_rosa`, `wand_himmel`, `wand_minze`, `wand_butter`, `wand_flieder`, `wand_pfefferm` |
| Böden | `boden_eiche`, `boden_kirsch`, `boden_perle`, `boden_wiese`, `boden_beere`, `boden_see` |

Zwei Arten von Datei, die App unterscheidet sie an der Breite:

| Art | Breite | wie sie gesetzt wird |
|---|---|---|
| **Kachel** | schmaler als 1904 px | wiederholt sich, von der Bodenlinie aus. Für Tapetenmuster und Dielen. Empfohlen: **336 × 336 px** (60 × 60 cm), nahtlos. |
| **Bahn** | genau **1904 px** | wird einmal gesetzt, am Boden verankert. Für gemalte Wände mit Motiv. Wand: **1904 × 1540 px**, Boden: **1904 × 560 px**. |

Malst du eine Bahn kürzer als nötig, wird ihre **oberste Zeile nach oben
fortgesetzt** — es entsteht nie eine Lücke, und bei einer gleichmäßigen
Wandoberkante sieht man davon nichts. Dasselbe gilt seitlich.

Liegt für die gewählte Tapete oder den gewählten Boden eine Datei, fallen
dort Farbe und Muster weg. Für alles andere bleibt es beim Gezeichneten.

### Vorlagen

In `vorlagen/` liegen leere Dateien in genau diesen Maßen, dazu je eine
Übersicht pro Zimmer: sie zeigt die Bodenlinie, das Zentimeterraster und
wo welches Möbelstück steht. Zum Draufschauen beim Malen, nicht zum
Mitspeichern.

## Badezimmer — ein Bild je Badezusatz

Wie im Schlafzimmer: **eine Datei mit Wand, Wanne, Wasser und Blasen
zusammen** — und davon eine Fassung je Badezusatz, denn damit ändert
sich die Farbe des Wassers.

| Plätze | Empfohlene Größe |
|---|---|
| `szene_wanne_klar`, `szene_wanne_rosen`, `szene_wanne_minze`, `szene_wanne_lavendel`, `szene_wanne_zitrone`, `szene_wanne_galaxie` | **1064 × 1200 px** (190 × 214 cm) |

Liegt so eine Datei, wird von meinem gezeichneten Bad **nichts** mehr
gezeigt: keine Fliesen, keine Wanne, kein Wasser, keine Blasen, kein
Dampf. Das Bild ist die ganze Szene.

Verankert wird unten mittig, mit Randfortsetzung wie überall. Die 1200 px
Höhe decken alle Handys ab.

**Darüber** liegen nur noch: Bella mit dem Schaum, die Dusche beim
Abbrausen, das Planschen und das Badespielzeug. Alles davon lässt sich
frei setzen.

### Die Wasserfläche einstellen

Weil deine Wanne anders geformt ist, kann die App nicht raten, wo das
Wasser liegt. Daran hängen **Bella, das Spielzeug, das Planschen und die
Dusche**. Deshalb: Stift oben rechts → **Genau platzieren** →
`zone_wasser`. Mit den Pfeilen verschieben, mit BREITER/SCHMALER/
HÖHER/FLACHER an deine Wanne anpassen. Im Platzierungs-Modus ist die
Fläche als gestrichelter Rahmen zu sehen.

### Nur die Wanne austauschen

Wer mein Badezimmer behalten und bloß die Wanne ersetzen will, nimmt
stattdessen `wanne_klar` … `wanne_galaxie` (etwa 1064 × 728 px). Dann
bleiben Fliesen und Wand gezeichnet. Auch dort malst du die Blasen mit
hinein; die App legt keine mehr darüber.

Wer bewegte Blasen will, legt zusätzlich `blase_<zusatz>` dazu (30–60 px,
quadratisch) — dann kommen sie wieder, aber als sein eigenes Bild.

## Schlafzimmer — ein Bild für alles

Der übliche Weg: **eine Datei mit Bett, Wand und Fenster zusammen.**

| Platz | Empfohlene Größe |
|---|---|
| `szene_nische` | **1176 × 1320 px** (210 × 236 cm) |
| `szene_nische_dunkel` | dieselbe Größe, für „Licht aus" |

Liegt `szene_nische`, wird von meiner gezeichneten Nische **nichts** mehr
gezeigt: kein Bogen, kein Fenster, kein Regal, keine Matratze, kein
Teppich. Das Bild ist der ganze Hintergrund.

Verankert wird unten mittig. Die Höhe braucht Reserve, weil die
Bildschirme verschieden hoch sind — 1320 px deckt alle Handys ab; wird
weniger gebraucht, wird oben abgeschnitten, wird mehr gebraucht, läuft
die oberste Zeile weiter.

Für **Licht aus** malst du dieselbe Nische ein zweites Mal, dunkel, mit
leuchtendem Fenster. Fehlt die Datei, wird das helle Bild einfach
abgedunkelt — dann ist allerdings auch das Fenster dunkel, denn was
darin leuchtet, weiß nur, wer es gemalt hat.

**Darüber** liegen nur noch: Bella mit ihrer Decke, die Wanddeko und
was auf dem Bett abgelegt ist. Alles davon lässt sich frei setzen
(Stift → Genau platzieren).

Wo Bella liegt, sagt die Zone `zone_liege` — verschieben und in der
Größe ändern wie die Wasserfläche. Das ist die einzige Angabe, die die
App aus deinem Bild nicht ablesen kann.

### Nur das Bett austauschen

Wer die Nische behalten und bloß das Bett ersetzen will, nimmt
stattdessen `bett_nische` (Vorlage 1008 × 336 px). Dann bleiben Bogen,
Fenster und Regal gezeichnet. Für `bett_nische` steht keine Größe im
Code — die Datei bestimmt sie selbst, Punkte ÷ 5,6 = Zentimeter.

## Wanddeko

Hängt im Schlafzimmer an der Wand, höchstens drei Stück gleichzeitig,
kommt mit der Post. Sobald etwas hängt, weichen das eingebaute Regal und
die Hängepflanze — die Nische ist klein.

| Platz | | Größe | Datei |
|---|---|---|---|
| `wd_lichterkette` | Lichterkette | 150 × 20 cm | **840 × 112 px** |
| `wd_girlande` | Girlande | 130 × 28 cm | **728 × 157 px** |
| `wd_bild` | Bild | 40 × 50 cm | **224 × 280 px** |
| `wd_bild_gross` | Großes Bild | 60 × 75 cm | **336 × 420 px** |
| `wd_traumfaenger` | Traumfänger | 32 × 70 cm | **179 × 392 px** |
| `wd_wandregal` | Wandregal | 80 × 22 cm | **448 × 123 px** |

Jedes Stück lässt sich einzeln verschieben, ebenso Kissen, Kuscheltiere
und Badespielzeug.

## Zimmer-Icons in der Fußzeile

| Platz | |
|---|---|
| `icon_schlaf`, `icon_kueche`, `icon_wohnen`, `icon_bad`, `icon_schrank` | **32 × 32 px** |

Quadratisch, mit durchsichtigem Hintergrund. 32 passt genau (wird
verdoppelt); 30 oder 16 gehen auch. Was größer als 64 px ist, wird
verkleinert — dann leidet die Kante.

Liegt für ein Zimmer keine Datei, bleibt mein gezeichnetes Icon stehen.
Du kannst also einzeln austauschen.

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
