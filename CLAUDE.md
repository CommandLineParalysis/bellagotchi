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

## Aufbau der Oberfläche

Obere Hälfte die **Bühne** (nur das Spiel, randlos), untere Hälfte alles
Bedienbare. Kein Gehäuse um das Bild. Das Gestalterische — Tapete, Muster,
Boden — liegt hinter dem Stift oben rechts, das Anziehen hinter dem Knopf
im Kleiderschrank; unter den Tasten steht nur, was zum Raum gehört.

Schlafzimmer und Bad sind **herangezoomte Szenen** (Bettnische, Wanne) und
werden eigens gezeichnet; Küche, Wohnzimmer und Kleiderschrank sind
Zimmer mit Wand, Boden und Möbeln.

## Eigene Pixelgrafiken

**Jede Grafik ist austauschbar.** In `www/js/bilder.js` steht unter
`BILDPLAETZE` für jedes Bild ein Platz. Trägt man dort eine Datei aus
`www/bilder/` ein, wird sie **unverändert** gezeichnet: keine Palette,
kein Umfärben, kein Zuschnitt, keine Glättung, nur ganze Vielfache der
Kantenlänge. Die gezeichneten Sprites in `sprites.js` sind Platzhalter,
bis eine Datei da ist. `www/bilder/LIESMICH.md` nennt die Größen.

Ein Szenenbild (`szene_nische`, `szene_wanne`, …) ersetzt den
gezeichneten Hintergrund vollständig; Bella und die Gegenstände liegen
darüber, ihre Punkte stehen in `ANKER` als Anteil der Bühne.

## Eigenheiten, die beim Ändern wichtig sind

- **Die Pixelbilder stehen als Textraster in `www/js/sprites.js`**, nicht als
  PNG. `pruefeRaster()` prüft jede Zeile auf gleiche Länge und bekannte
  Zeichen; der Funktionstest ruft das auf. Ein verrutschtes Zeichen fällt
  sonst erst als Loch im Sofa auf.
- **Die Ziffern 1–6 in einem Raster sind Plätze, keine Farben.** Bella
  bekommt dort Kleid- und Haarfarben, eine Kachel Wand- oder Bodenfarben.
  Deshalb braucht ein neues Kleid kein neues Bild. Wand und Boden werden
  getrennt gemalt und benutzen **beide** die Plätze 1–3.
- **Die Auflösung ist nicht fest.** `buehneMasse()` teilt die gemessene
  Bühnenfläche durch den Maßstab; die Szenen richten sich an `s.b`/`s.h`
  aus statt an festen Punkten. Die Bühne bekommt ihre Höhe vom Bild, nicht
  umgekehrt — sonst hinge das Bild an einer Höhe, die es selbst erzeugt.
- **In der Nische ist die Zeichenreihenfolge alles:** erst die
  Kissenwand, dann die Matratze davor, dann Bella darauf. Andersherum
  schweben die Kissen über dem Bett.
- **Bella im Bett ist Kopf plus Hügel.** Ohne den Hügel läge nur ein Kopf
  auf der Matratze. Zugedeckt wechselt der Hügel auf die Kleidfarbe und
  bekommt einen Saum — daran sieht man, dass „Zudecken" etwas getan hat.
- **Was auf dem Wannenrand steht, folgt dem Bogen der Ellipse**
  (`randOben(x)`). Eine feste Höhe ließ die Kerze an der Wand schweben.
- **Gewaschen wird nur gebadet:** einschäumen, dann abbrausen. Der Schaum
  steht in `state`, nicht im Bestand, und wird beim Raumwechsel gelöscht.
- **Bestellt wird kostenlos, geliefert am nächsten Tag um 9.** Das ist die
  Geduld statt eines Preises. Immer nur eine Bestellung.
- **Es liegt nichts über der Szene.** Früher lag ein Rasterpunkt-Überzug
  als Nachtstimmung über jedem Zimmer; der hat jede Grafik zugedeckt.
  `tageszeit()` gibt es weiter, aber sie färbt nichts mehr ein. Die
  Browser-Gegenprobe misst, wie oft sich benachbarte Spielpixel
  unterscheiden — über 0,55 heißt: da liegt wieder ein Muster.
- **Kochen sind drei Bilder nacheinander** (Zutaten → Gericht → Essen),
  gesteuert über `state.szene`. Satt wird Bella erst am Ende der
  Essensbewegung, nicht schon beim Anrühren. Die Essensbewegung ist für
  jedes Gericht dieselbe.
- **Abbrausen ist eine Bewegung, kein Knopfdruck.** Der Schaum bleibt,
  bis die Hand mit dem Duschkopf durch ist; erst dann zählt das Bad.
- **Der Takt läuft alle 200 ms**, nicht mehr jede Sekunde — sonst
  ruckelten Essensbewegung und Dusche. Die Werte werden weiter nur
  einmal je Minute fortgeschrieben.
- **`window.BELLAGOTCHI_VORSCHAU`** schaltet alles frei. Die Marke setzt
  nur die Vorschau im Chat, nie die Handy-App.
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
- **Erinnerungen sind zweigeteilt:** `erinnerungsPlan()` rechnet nur aus,
  wann was fällig wäre — prüfbar ohne Handy. Erst `erinnerungenStellen()`
  spricht mit Android. Fällt ein Zeitpunkt in Bellas Nacht, wird er
  **verschoben, nicht verworfen**: sonst bekäme man bei vollen Werten nie
  eine Meldung, weil der Zeitpunkt zwölf Stunden später regelmäßig im
  Schlaffenster läge. Höchstens vier Meldungen, frühestens in 90 Minuten.

## Nachschlagen

`ANLEITUNG.md` erklärt Bauen und Bedienen — steht noch aus.
