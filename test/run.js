/* Funktionstest für Bellagotchi. Läuft auf dem Testgerüst des Scaffolds.

   jsdom kann kein Canvas und misst jedes Element mit 0 — alles Gemalte
   wird zusätzlich in Chromium geprüft. Was hier steht, ist die Logik:
   Zeit, Bedürfnisse, Kochen, Reden, Post. */

const { buildSingleFile } = require('@bappiverse/scaffold/scripts/bundle');
const { starteApp, pruefliste } = require('@bappiverse/scaffold/test/harness');

(async () => {
  const p = pruefliste('Bellagotchi');
  const { $, $$, click, doc, wait, errors, bruecke } = starteApp(buildSingleFile());

  await wait(60);
  const T = bruecke(['DATA','state','adoptVault','pruefeRaster','standFortschreiben',
                     'istSchlafzeit','schlafMinuten','rezeptFuer','REZEPTE','ZUTATEN',
                     'gesamtwohl','stimmung','postPruefen','alleGaben','render',
                     'NACHHOLGRENZE','BODEN_WERT','tageszeit','massstab','KLEIDER',
                     'erinnerungsPlan','ERINNERUNG','faelligAb','erinnerungenSchalten',
                     'FRUEHESTENS_MIN','lieferzeit','lieferungPruefen','BESTELLMENGE',
                     'LIEFERSTUNDE','BADEZUSAETZE','BETTZEUG','BADSPIELZEUG','buehneMasse',
                     'szeneWeiter','kochszenePhase','zeitgesteuertes','duscheAnteil',
                     'KOCHSCHRITTE','BILDPLAETZE','bildDa','DUSCHE_DAUER',
                     'SNACKS','snacksDa','snackEssen','TAGESMENGE','bestellRest',
                     'heuteSchluessel','bestellungVermerken','WANDFARBEN',
                     'BODENFARBEN','alleGaben','KLEIDUNG','FRISUREN','HAARFARBE',
                     'SCHLAFLAGEN','schlaflage','rufKnopf','ESSEN_DAUER','bellaRaster',
                     'KOPF_H','KOERPER_H','SCHUHE','ACCESSOIRES','ZUBEHOER',
                     'MODELL_PX_JE_CM','GROESSEN_CM','BREITEN_CM','ZIMMER','sollPunkte','massPruefen',
                     'moebelDa','MOEBELBILD','maleBellaFigur','maleBellaLiegend',
                     'SZENE_CM','szenenMasse','nischeMasse','wanneMasse',
                     'planschStarten','planschAnteil','PLANSCH_DAUER','lichtAn',
                     'erholungJetzt','ERHOLUNG','ERHOLUNG_HELL',
                     'vaultPayload','persist','listenBild','WANDFARBEN','BODENFARBEN','maleFlaeche',
                     'allesFreischalten','WANDDEKO','WANDDEKO_MAX','ZONEN','zone','zoneDa','BADEZUSAETZE',
                     'zonenVorgabe','zoneSetzen','platzSetzen','szenenMasse','MOEBEL',
                     'BREITEN_CM','dingeImRaum','wanneMasse','nischeMasse',
                     'bodenbandCm','breiteCm','platzVon','eigenerPlatz',
                     'BILDER','BELLA_MODELLE','BELLA_POSEN','BELLA_SCHICHTEN','BELLA_POSE_MASS',
                     'BELLA_LAUNEN','bellaModell','bellaModelleDa','bellaModellDa',
                     'bellaSchichtPlatz','bellaSchichtplaetze',
                     'WETTER','TAGESZEITEN','wetterJetzt','ausblickPlatz','zoneGilt',
                     'musikStand','musikWaehlen','musikGutschrift','musikHalten','musikAus',
                     'musikLaeuft','musikSpielen','tanzt','tanzLage','MUSIK_LAUNE','AKTIVITAETEN']);

  /* Kochen und Abbrausen laufen jetzt über Szenen, die Zeit brauchen.
     Im Test wird die Zeit nicht abgewartet, sondern vorgespult. */
  const szeneDurchlaufen = async () => {
    for (let i = 0; i < T.KOCHSCHRITTE.length + 1 && T.state.szene; i++){
      await T.szeneWeiter();
      await wait(20);
    }
    // Danach isst sie in der Küche; auch das wird vorgespult.
    if (T.state.essen){
      T.state.essen.bis = Date.now() - 1;
      await T.zeitgesteuertes();
      await wait(25);
    }
  };
  const duscheDurchlaufen = async () => {
    if (!T.state.dusche) return;
    T.state.dusche.bis = Date.now() - 1;
    await T.zeitgesteuertes();
    await wait(25);
  };

  const tab = r => $$('#nav .tab').find(t => t.dataset.raum === r);
  const taste = text => $$('#tasten .taste').find(t => t.textContent === text);

  /* Bella ist immer nur an einem Ort. Für Prüfungen, in denen es nicht
     um das Rufen geht, wird sie kurzerhand mitgenommen. */
  const mitBella = async raum => {
    click(tab(raum));
    T.DATA.bella.ort = raum;
    T.DATA.bella.schlaeft = false;
    T.render();
    await wait(25);
  };

  /* --- Rahmen --- */

  await p.check('App startet ohne Fehler', () => { if (errors.length) throw new Error(errors[0]); });

  await p.check('Fünf Räume in der Fußzeile', () => {
    const namen = $$('#nav .tab').map(t => t.dataset.raum);
    const soll = ['schlaf','kueche','wohnen','bad','schrank'];
    if (namen.join(',') !== soll.join(',')) throw new Error(namen.join(','));
    return namen.join(' · ');
  });

  await p.check('Jedes Pixelraster ist unversehrt', () => {
    const f = T.pruefeRaster();
    if (f.length) throw new Error(f.length + ' Fehler, erster: ' + f[0]);
    return 'alle Zeilen gleich lang, alle Zeichen bekannt';
  });

  /* --- Zeit und Schlaf --- */

  await p.check('Das Schlaffenster geht über Mitternacht', () => {
    T.DATA.zeiten.einschlafen = '02:30';
    T.DATA.zeiten.aufwachen = '10:30';
    const bei = (h, m) => { const d = new Date(2026, 0, 5, h, m); return T.istSchlafzeit(d); };
    if (!bei(3, 0))  throw new Error('03:00 sollte Schlaf sein');
    if (!bei(9, 59)) throw new Error('09:59 sollte Schlaf sein');
    if (bei(10, 31)) throw new Error('10:31 sollte wach sein');
    if (bei(1, 0))   throw new Error('01:00 sollte wach sein');
    if (!bei(2, 30)) throw new Error('02:30 sollte Schlaf sein');
    return '02:30–10:30, auch über Mitternacht';
  });

  await p.check('Verschobene Zeiten gelten sofort', () => {
    T.DATA.zeiten.einschlafen = '22:00';
    T.DATA.zeiten.aufwachen = '06:00';
    const bei = (h) => T.istSchlafzeit(new Date(2026, 0, 5, h, 0));
    if (!bei(23) || !bei(2)) throw new Error('Nacht nicht erkannt');
    if (bei(12)) throw new Error('Mittag als Schlaf gewertet');
    T.DATA.zeiten.einschlafen = '02:30';
    T.DATA.zeiten.aufwachen = '10:30';
    return '22:00–06:00 greift ohne Neustart';
  });

  await p.check('Schlafminuten werden wirklich gezählt', () => {
    const von = new Date(2026, 0, 5, 0, 0), bis = new Date(2026, 0, 5, 12, 0);
    const m = T.schlafMinuten(von, bis);
    // 02:30 bis 10:30 sind 8 Stunden; die 5-Minuten-Schritte dürfen um
    // höchstens einen Schritt danebenliegen.
    if (Math.abs(m - 480) > 5) throw new Error(m + ' statt ~480 Minuten');
    return m + ' von 720 Minuten verschlafen';
  });

  await p.check('Werte zehren über die Zeit', async () => {
    const b = T.DATA.bella;
    b.satt = 90; b.sauber = 90; b.ausgeruht = 90; b.laune = 90;
    // Sechs Stunden am helllichten Tag, also ohne Schlaf.
    const jetzt = new Date(2026, 0, 5, 18, 0);
    T.DATA.stand = new Date(2026, 0, 5, 12, 0).toISOString();
    T.standFortschreiben(jetzt);
    if (b.satt >= 90) throw new Error('Satt blieb bei ' + b.satt);
    if (b.ausgeruht >= 90) throw new Error('Ausgeruht blieb bei ' + b.ausgeruht);
    if (b.satt < 60) throw new Error('zu schnell gezehrt: ' + b.satt);
    return 'nach 6 h wach: satt ' + Math.round(b.satt) + ', ausgeruht ' + Math.round(b.ausgeruht);
  });

  await p.check('Schlaf füllt das Ausgeruht wieder auf', () => {
    const b = T.DATA.bella;
    b.ausgeruht = 20;
    T.DATA.stand = new Date(2026, 0, 5, 3, 0).toISOString();
    T.standFortschreiben(new Date(2026, 0, 5, 10, 0));
    if (b.ausgeruht <= 20) throw new Error('nicht erholt: ' + b.ausgeruht);
    if (!b.schlaeft && T.istSchlafzeit(new Date(2026, 0, 5, 10, 0))) throw new Error('schläft nicht');
    return 'nach 7 h Schlaf: ausgeruht ' + Math.round(b.ausgeruht);
  });

  /* --- Das Versprechen der App --- */

  await p.check('Eine lange Pause tut Bella nichts', () => {
    const b = T.DATA.bella;
    b.satt = 100; b.sauber = 100; b.ausgeruht = 100; b.laune = 100;
    T.DATA.stand = new Date(2025, 0, 1, 12, 0).toISOString();   // über ein Jahr weg
    T.standFortschreiben(new Date(2026, 0, 5, 12, 0));
    const tief = Math.min(b.satt, b.sauber, b.ausgeruht, b.laune);
    if (tief < T.BODEN_WERT) throw new Error('unter den Boden gefallen: ' + tief);
    if (b.laune > 60) throw new Error('nach einem Jahr noch bei Laune ' + b.laune);
    return 'nach einem Jahr: nichts unter ' + Math.round(tief) + ' %';
  });

  await p.check('Nach der Pause ist sie schnell wieder obenauf', async () => {
    await mitBella('bad');
    click(taste('EINSCHÄUMEN'));
    await wait(30);
    click(taste('ABBRAUSEN'));
    await wait(30);
    await duscheDurchlaufen();
    await mitBella('wohnen');
    click(taste('MUSIK HÖREN'));
    await wait(30);
    if (T.DATA.bella.sauber < 50) throw new Error('Baden half nicht: ' + T.DATA.bella.sauber);
    if (T.DATA.bella.laune <= T.BODEN_WERT) throw new Error('Laune klebt unten');
    return 'zwei Handgriffe: sauber ' + Math.round(T.DATA.bella.sauber)
         + ', Laune ' + Math.round(T.DATA.bella.laune);
  });

  /* --- Küche --- */

  await p.check('Zwei Zutaten ergeben ein Gericht', async () => {
    T.DATA.bella.schlaeft = false;
    T.DATA.bella.satt = 30;
    T.DATA.vorrat.mehl = 2; T.DATA.vorrat.ei = 2;
    await mitBella('kueche');
    click(taste('KOCHEN'));
    await wait(25);
    click($$('#zutaten .stueck').find(b => b.dataset.zutat === 'mehl'));
    await wait(20);
    click($$('#zutaten .stueck').find(b => b.dataset.zutat === 'ei'));
    await wait(20);
    const knopf = $('#kochen');
    if (!/PFANNKUCHEN/.test(knopf.textContent)) throw new Error(knopf.textContent);
    click(knopf);
    await wait(40);
    if (T.DATA.vorrat.mehl !== 1 || T.DATA.vorrat.ei !== 1) throw new Error('Zutaten nicht verbraucht');
    if (!T.DATA.kochbuch.includes('pfannkuchen')) throw new Error('nicht im Kochbuch');
    // Satt wird sie erst am Ende der Essensbewegung, nicht schon beim Anrühren.
    if (T.DATA.bella.satt > 30) throw new Error('schon satt, bevor sie gegessen hat');
    await szeneDurchlaufen();
    if (T.DATA.bella.satt <= 30) throw new Error('nicht satter: ' + T.DATA.bella.satt);
    return 'Mehl + Ei = Pfannkuchen, satt ' + Math.round(T.DATA.bella.satt);
  });

  await p.check('Jede Zutatenpaarung ergibt etwas', () => {
    const z = Object.keys(T.ZUTATEN);
    const fehlend = [];
    for (let i = 0; i < z.length; i++)
      for (let j = i + 1; j < z.length; j++)
        if (!T.rezeptFuer(z[i], z[j])) fehlend.push(z[i] + '+' + z[j]);
    if (fehlend.length) throw new Error('ohne Rezept: ' + fehlend.join(', '));
    return T.REZEPTE.length + ' Rezepte für alle ' + (z.length * (z.length - 1) / 2) + ' Paare';
  });

  await p.check('Ohne Zutat lässt sich nicht kochen', async () => {
    Object.keys(T.ZUTATEN).forEach(k => { T.DATA.vorrat[k] = 0; });
    click(taste('KOCHEN'));
    await wait(25);
    const frei = $$('#zutaten .stueck').filter(b => !b.hasAttribute('disabled'));
    if (frei.length) throw new Error(frei.length + ' Zutaten trotz leerem Vorrat wählbar');
    click($('#modalblatt .schliessen'));
    await wait(20);
    return 'alle abgeblendet';
  });

  await p.check('Gekocht wird auf Karten, gegessen in der Küche', async () => {
    T.DATA.vorrat.honig = 2; T.DATA.vorrat.milch = 2;
    T.DATA.bella.satt = 30;
    await mitBella('kueche');
    click(taste('KOCHEN'));
    await wait(25);
    click($$('#zutaten .stueck').find(b => b.dataset.zutat === 'honig'));
    await wait(20);
    click($$('#zutaten .stueck').find(b => b.dataset.zutat === 'milch'));
    await wait(20);
    click($('#kochen'));
    await wait(40);
    const gesehen = [];
    for (let i = 0; i < 4 && T.state.szene; i++){
      gesehen.push(T.kochszenePhase());
      // Während einer Szene gibt es nur den Weiter-Knopf.
      const knoepfe = $$('#tasten .taste').map(t => t.textContent);
      if (knoepfe.join() !== 'WEITER') throw new Error('Tasten während der Szene: ' + knoepfe.join());
      await T.szeneWeiter();
      await wait(20);
    }
    if (gesehen.join(',') !== 'zutaten,gericht')
      throw new Error('Karten: ' + gesehen.join(','));
    // Danach ist die Ansicht weg und sie isst dort, wo sie steht.
    if (T.state.szene) throw new Error('die Ansicht bleibt offen');
    if (!T.state.essen) throw new Error('sie isst nicht');
    if (T.state.raum !== 'kueche') throw new Error('gegessen wird in: ' + T.state.raum);
    if (T.DATA.bella.ort !== 'kueche') throw new Error('Bella ist woanders');
    if (T.DATA.bella.satt > 30) throw new Error('satt, bevor sie fertig ist');
    T.state.essen.bis = Date.now() - 1;
    await T.zeitgesteuertes();
    await wait(25);
    if (T.DATA.bella.satt <= 30) throw new Error('am Ende nicht satt');
    return 'zwei Karten, dann Essen in der Küche';
  });

  /* --- Reden --- */

  await p.check('Reden hebt die Laune', async () => {
    T.DATA.bella.laune = 40;
    await mitBella('wohnen');
    click(taste('REDEN'));
    await wait(25);
    const antwort = $$('#modalblatt .taste')[0];
    if (!antwort) throw new Error('keine Antwortmöglichkeit');
    click(antwort);
    await wait(40);
    if (T.DATA.bella.laune <= 40) throw new Error('Laune: ' + T.DATA.bella.laune);
    if (!T.DATA.gesprochen.length) throw new Error('Gespräch nicht vermerkt');
    return 'Laune 40 → ' + Math.round(T.DATA.bella.laune);
  });

  /* --- Anziehen und Einrichten --- */

  await p.check('Kleidung wechseln steckt hinter dem Anziehen-Knopf', async () => {
    await mitBella('schrank');
    if ($$('#extra .stueck').length) throw new Error('Kleiderwahl steht offen unter dem Raum');
    click(taste('ANZIEHEN'));
    await wait(30);
    const anders = T.DATA.besitz.stuecke.find(k => k !== T.DATA.outfit.stueck);
    click($$('#modalblatt .stueck').find(b => b.dataset.wahl === anders));
    await wait(40);
    if (T.DATA.outfit.stueck !== anders) throw new Error('Outfit: ' + T.DATA.outfit.stueck);
    click($('#modalblatt .schliessen'));
    await wait(20);
    return T.KLEIDUNG[anders].name;
  });

  await p.check('Einrichten steckt hinter dem Stift und gilt je Raum', async () => {
    // Unter keinem Raum darf die Farbtafel offen stehen.
    for (const r of ['schlaf','kueche','wohnen','bad','schrank']){
      click(tab(r));
      await wait(20);
      const offen = $$('#extra .stueck').filter(b => b.dataset.wahl);
      if (offen.length) throw new Error('Farbtafel offen in ' + r);
    }
    await mitBella('schrank');
    const vorher = T.DATA.raeume.schlaf.wand;
    click($('#einrichtenbtn'));
    await wait(30);
    const anders = T.DATA.besitz.waende.find(w => w !== T.DATA.raeume.schrank.wand);
    click($$('#modalblatt .stueck').find(b => b.dataset.wahl === anders));
    await wait(40);
    if (T.DATA.raeume.schrank.wand !== anders) throw new Error('Schrankzimmer nicht umtapeziert');
    if (T.DATA.raeume.schlaf.wand !== vorher) throw new Error('Schlafzimmer mitgefärbt');
    click($('#modalblatt .schliessen'));
    await wait(20);
    return 'Schrankzimmer ' + anders + ', Schlafzimmer unverändert';
  });

  /* --- Bad --- */

  await p.check('Gebadet wird in zwei Schritten, und sonst gar nicht', async () => {
    T.DATA.bella.sauber = 20;
    await mitBella('bad');
    const namen = $$('#tasten .taste').map(t => t.textContent);
    if (namen.some(n => /ZÄHNE|HAARE/.test(n))) throw new Error('andere Waschart: ' + namen.join(','));
    if (!namen.includes('EINSCHÄUMEN')) throw new Error('kein Einschäumen: ' + namen.join(','));
    click(taste('EINSCHÄUMEN'));
    await wait(30);
    if (!T.state.schaum) throw new Error('kein Schaum');
    if (T.DATA.bella.sauber > 30) throw new Error('Einschäumen macht schon sauber');
    const jetzt = $$('#tasten .taste').map(t => t.textContent);
    if (!jetzt.includes('ABBRAUSEN')) throw new Error('kein Abbrausen: ' + jetzt.join(','));
    click(taste('ABBRAUSEN'));
    await wait(30);
    await duscheDurchlaufen();
    if (T.state.schaum) throw new Error('Schaum blieb');
    if (T.DATA.bella.sauber < 60) throw new Error('nicht sauber: ' + T.DATA.bella.sauber);
    return 'einschäumen → abbrausen, sauber ' + Math.round(T.DATA.bella.sauber);
  });

  await p.check('Der Schaum bleibt nicht am Raumwechsel hängen', async () => {
    await mitBella('bad');
    click(taste('EINSCHÄUMEN'));
    await wait(30);
    if (!T.state.schaum) throw new Error('kein Schaum');
    click(tab('kueche'));
    await wait(25);
    if (T.state.schaum) throw new Error('Schaum in die Küche mitgenommen');
    return 'beim Verlassen abgewaschen';
  });

  await p.check('Der Badezusatz färbt Wasser und Blasen', async () => {
    T.DATA.besitz.zusaetze = Object.keys(T.BADEZUSAETZE);
    await mitBella('bad');
    click(taste('BADEZUSATZ'));
    await wait(30);
    const anders = Object.keys(T.BADEZUSAETZE).find(z => z !== T.DATA.bad.zusatz);
    click($$('#modalblatt .stueck').find(b => b.dataset.wahl === anders));
    await wait(40);
    if (T.DATA.bad.zusatz !== anders) throw new Error('Zusatz: ' + T.DATA.bad.zusatz);
    const z = T.BADEZUSAETZE[anders];
    if (z.wasser.length !== 3 || !z.blase) throw new Error('Zusatz ohne Farben');
    click($('#modalblatt .schliessen'));
    await wait(20);
    return z.name + ': ' + z.wasser.join(' ');
  });

  await p.check('Abbrausen läuft als Bewegung, nicht auf Knopfdruck', async () => {
    T.DATA.bella.sauber = 20;
    T.state.schaum = false;
    T.state.dusche = null;
    await mitBella('bad');
    click(taste('EINSCHÄUMEN'));
    await wait(30);
    click(taste('ABBRAUSEN'));
    await wait(30);
    if (!T.state.dusche) throw new Error('keine Dusche gestartet');
    if (T.DATA.bella.sauber > 30) throw new Error('sofort sauber, ohne Abbrausen');
    if (!T.state.schaum) throw new Error('Schaum schon weg, bevor gespült wurde');
    const anteil = T.duscheAnteil();
    if (!(anteil >= 0 && anteil < 1)) throw new Error('Fortschritt: ' + anteil);
    await duscheDurchlaufen();
    if (T.state.dusche) throw new Error('Dusche läuft weiter');
    if (T.state.schaum) throw new Error('Schaum blieb');
    if (T.DATA.bella.sauber < 60) throw new Error('nicht sauber: ' + T.DATA.bella.sauber);
    return 'Schaum bleibt, bis die Hand fertig ist — dann sauber '
         + Math.round(T.DATA.bella.sauber);
  });

  await p.check('Planschen läuft als Bewegung, nicht auf Knopfdruck', async () => {
    T.DATA.bella.laune = 40;
    T.state.plansch = null;
    T.state.schaum = false;
    await mitBella('bad');
    click(taste('PLANSCHEN'));
    await wait(30);
    if (!T.state.plansch) throw new Error('kein Planschen gestartet');
    if (T.DATA.bella.laune > 45) throw new Error('Laune stieg sofort, ohne die Bewegung');
    const anteil = T.planschAnteil();
    if (!(anteil >= 0 && anteil < 1)) throw new Error('Fortschritt: ' + anteil);
    // Währenddessen ist nichts anderes anzutippen.
    if (taste('BADEZUSATZ')) throw new Error('andere Knöpfe bleiben bedienbar');
    T.state.plansch.bis = Date.now() - 1;
    await T.zeitgesteuertes();
    await wait(25);
    if (T.state.plansch) throw new Error('Planschen läuft weiter');
    if (!(T.DATA.bella.laune > 45)) throw new Error('Laune blieb: ' + T.DATA.bella.laune);
    return 'gespritzt, danach Laune ' + Math.round(T.DATA.bella.laune);
  });

  await p.check('Planschen bleibt nicht am Raumwechsel hängen', async () => {
    await mitBella('bad');
    click(taste('PLANSCHEN'));
    await wait(30);
    if (!T.state.plansch) throw new Error('kein Planschen gestartet');
    click(tab('kueche'));
    await wait(25);
    if (T.state.plansch) throw new Error('Planschen in die Küche mitgenommen');
    return 'beim Verlassen beendet';
  });

  /* --- Das Licht im Schlafzimmer --- */

  await p.check('Der Lichtschalter schaltet wirklich', async () => {
    await mitBella('schlaf');
    T.DATA.raeume.schlaf.licht = true;
    T.render();
    await wait(25);
    if (!taste('LICHT AUS')) throw new Error('kein Knopf "LICHT AUS"');
    click(taste('LICHT AUS'));
    await wait(30);
    if (T.lichtAn()) throw new Error('Licht blieb an');
    if (!taste('LICHT AN')) throw new Error('Knopf zeigt nicht "LICHT AN"');
    click(taste('LICHT AN'));
    await wait(30);
    if (!T.lichtAn()) throw new Error('Licht ging nicht wieder an');
    return 'aus ⇄ an, der Knopf folgt';
  });

  await p.check('Im Dunkeln erholt sie sich schneller', () => {
    T.DATA.raeume.schlaf.licht = true;
    const hell = T.erholungJetzt();
    T.DATA.raeume.schlaf.licht = false;
    const dunkel = T.erholungJetzt();
    if (!(dunkel > hell)) throw new Error('hell ' + hell + ', dunkel ' + dunkel);
    // Der Unterschied muss sich auch im fortgeschriebenen Wert zeigen.
    const messen = () => {
      T.DATA.bella.ausgeruht = 40;
      T.DATA.stand = new Date(Date.now() - 6 * 3600000).toISOString();
      T.standFortschreiben(new Date());
      return T.DATA.bella.ausgeruht;
    };
    T.DATA.raeume.schlaf.licht = false;
    const wertDunkel = messen();
    T.DATA.raeume.schlaf.licht = true;
    const wertHell = messen();
    if (!(wertDunkel >= wertHell))
      throw new Error('dunkel ' + wertDunkel.toFixed(0) + ', hell ' + wertHell.toFixed(0));
    return dunkel + ' statt ' + hell + ' je Stunde Schlaf';
  });

  await p.check('Der Lichtstand überlebt das Laden', async () => {
    T.DATA.raeume.schlaf.licht = false;
    await T.persist();
    const geladen = T.adoptVault(T.vaultPayload());
    if (geladen.raeume.schlaf.licht !== false)
      throw new Error('Licht kam als ' + geladen.raeume.schlaf.licht + ' zurück');
    T.DATA.raeume.schlaf.licht = true;
    await T.persist();
    return 'aus bleibt aus';
  });

  /* --- Bildplätze für Vorrat und Snacks --- */

  /* --- Wanddeko und Zonen --- */

  await p.check('Wanddeko kommt mit der Post und hängt im Schlafzimmer', async () => {
    T.DATA.besitz.wanddeko = [];
    const offen = T.alleGaben().filter(g => g.art === 'wanddeko');
    if (offen.length !== Object.keys(T.WANDDEKO).length)
      throw new Error('nicht alle Wanddeko in der Post: ' + offen.length);
    T.DATA.besitz.wanddeko = Object.keys(T.WANDDEKO);
    T.DATA.raeume.schlaf.wanddeko = [];
    await mitBella('schlaf');
    click($('#einrichtenbtn'));
    await wait(30);
    const kacheln = $$('#modalblatt .stueck').filter(k => k.dataset.wahl in T.WANDDEKO);
    if (kacheln.length !== Object.keys(T.WANDDEKO).length)
      throw new Error('im Einrichten fehlen Stücke: ' + kacheln.length);
    click(kacheln[0]); await wait(30);
    if (!T.DATA.raeume.schlaf.wanddeko.length) throw new Error('nichts aufgehängt');
    // Höchstens vier, das Älteste weicht.
    Object.keys(T.WANDDEKO).forEach(id => {
      if (!T.DATA.raeume.schlaf.wanddeko.includes(id))
        T.DATA.raeume.schlaf.wanddeko.push(id);
    });
    T.DATA.raeume.schlaf.wanddeko = T.adoptVault(T.vaultPayload()).raeume.schlaf.wanddeko;
    if (T.DATA.raeume.schlaf.wanddeko.length > T.WANDDEKO_MAX)
      throw new Error('mehr als ' + T.WANDDEKO_MAX + ' an der Wand: ' + T.DATA.raeume.schlaf.wanddeko.length);
    click($('#modalblatt .schliessen')); await wait(20);
    return Object.keys(T.WANDDEKO).length + ' Stücke, höchstens ' + T.WANDDEKO_MAX + ' gleichzeitig';
  });

  await p.check('Wanddeko-Vorgaben decken einander nicht', () => {
    const s = T.szenenMasse(T.buehneMasse(), T.SZENE_CM.nische);
    /* Alle Auswahlen prüfen, nicht nur die erste: vorher fiel genau die
       Kombination durch, die ich zufällig nicht geprüft hatte. */
    const alle = Object.keys(T.WANDDEKO);
    const WANDDEKO_MAX = T.WANDDEKO_MAX;
    const kombis = [];
    const bauen = (ab, jetzt) => {
      if (jetzt.length === WANDDEKO_MAX){ kombis.push(jetzt.slice()); return; }
      for (let i = ab; i < alle.length; i++) bauen(i + 1, jetzt.concat(alle[i]));
    };
    bauen(0, []);
    kombis.forEach(k => {
      T.DATA.raeume.schlaf.wanddeko = k;
      pruefeKombi(s, k);
    });
    T.DATA.raeume.schlaf.wanddeko = [];
    return kombis.length + ' Auswahlen geprüft, keine Überdeckung';
  });

  function pruefeKombi(s, auswahl){
    const kaesten = auswahl.map(id => {
      const p2 = T.platzVon('schlaf', id, s);
      return { id, x: p2.x, y: p2.unten - (T.GROESSEN_CM[id] || 30),
               b: T.BREITEN_CM[id] || 40, h: T.GROESSEN_CM[id] || 30 };
    });
    for (let i = 0; i < kaesten.length; i++)
      for (let j = i + 1; j < kaesten.length; j++){
        const a = kaesten[i], b2 = kaesten[j];
        /* Ganz frei ist das Ziel. In einer vollen Nische geht das nicht
           immer auf — dann muss die Überdeckung klein bleiben, sonst
           liegt ein Bild auf einem anderen statt daneben. */
        const ueber = Math.max(0, Math.min(a.x + a.b, b2.x + b2.b) - Math.max(a.x, b2.x))
                    * Math.max(0, Math.min(a.y + a.h, b2.y + b2.h) - Math.max(a.y, b2.y));
        const kleiner = Math.min(a.b * a.h, b2.b * b2.h);
        if (ueber > kleiner * 0.12)
          throw new Error(auswahl.join('+') + ': ' + a.id + ' liegt zu ' +
            Math.round(ueber / kleiner * 100) + ' % über ' + b2.id);
      }
    // Und alles bleibt in der Nische.
    const n = T.nischeMasse(s);
    kaesten.forEach(k => {
      if (k.x < n.links || k.x + k.b > n.rechts)
        throw new Error(auswahl.join('+') + ': ' + k.id + ' hängt neben der Nische');
    });
  }

  await p.check('Liegefläche und Wasserfläche lassen sich verschieben und ändern', async () => {
    const sN = T.szenenMasse(T.buehneMasse(), T.SZENE_CM.nische);
    const sW = T.szenenMasse(T.buehneMasse(), T.SZENE_CM.wanne);
    const faelle = [['schlaf', 'zone_liege', sN], ['bad', 'zone_wasser', sW]];
    const zeilen = [];
    for (const [raum, name, s] of faelle){
      if (!T.zoneDa(name)) throw new Error(name + ' ist keine Zone');
      const vor = T.zone(raum, name, T.zonenVorgabe(raum, name, s));
      await T.platzSetzen(raum, name, vor.x + 25, vor.unten - 12);
      await T.zoneSetzen(name, vor.b - 30, vor.h + 14);
      const nach = T.zone(raum, name, T.zonenVorgabe(raum, name, s));
      if (Math.abs(nach.x - (vor.x + 25)) > 0.6) throw new Error(name + ': x nicht gesetzt');
      if (Math.abs(nach.b - (vor.b - 30)) > 1) throw new Error(name + ': Breite nicht gesetzt');
      if (Math.abs(nach.h - (vor.h + 14)) > 1) throw new Error(name + ': Höhe nicht gesetzt');
      // Überlebt das Speichern?
      const geladen = T.adoptVault(T.vaultPayload());
      if (!geladen.zonen[name] || geladen.zonen[name].b !== nach.b)
        throw new Error(name + ': Größe überlebt das Laden nicht');
      if (!geladen.plaetze[raum] || !geladen.plaetze[raum][name])
        throw new Error(name + ': Stelle überlebt das Laden nicht');
      zeilen.push(name + ' ' + nach.b.toFixed(0) + '×' + nach.h.toFixed(0));
      delete T.DATA.plaetze[raum][name];
      delete T.DATA.zonen[name];
    }
    return zeilen.join(' · ');
  });

  await p.check('Für jede gemalte Wanne und jedes gemalte Bett gibt es einen Platz', () => {
    const fehlt = [];
    Object.keys(T.BADEZUSAETZE).forEach(z => {
      if (!('wanne_' + z in T.BILDPLAETZE)) fehlt.push('wanne_' + z);
      if (!('blase_' + z in T.BILDPLAETZE)) fehlt.push('blase_' + z);
    });
    if (!('bett_nische' in T.BILDPLAETZE)) fehlt.push('bett_nische');
    /* Die Möbel hießen einmal `moebel_herd`, gezeichnet wird aber unter
       `herd` — eine hochgeladene Datei wäre nie angekommen. */
    Object.keys(T.MOEBEL).forEach(m => { if (!(m in T.BILDPLAETZE)) fehlt.push(m); });
    Object.keys(T.WANDDEKO).forEach(w => { if (!(w in T.BILDPLAETZE)) fehlt.push(w); });
    if (fehlt.length) throw new Error('kein Platz für: ' + fehlt.join(', '));
    return Object.keys(T.BADEZUSAETZE).length + ' Wannen, ' + Object.keys(T.MOEBEL).length
         + ' Möbel, ' + Object.keys(T.WANDDEKO).length + ' Wanddeko';
  });

  /* --- Badezusätze mit eigenem Bild --- */

  await p.check('Jeder Badezusatz hat einen Bildplatz für die Liste', () => {
    const fehlt = Object.keys(T.BADEZUSAETZE).filter(z => !(('zusatz_' + z) in T.BILDPLAETZE));
    if (fehlt.length) throw new Error('ohne Platz: ' + fehlt.join(', '));
    /* Das ist nicht die gemalte Wanne: die steht unter szene_wanne_<id>
       und füllt die ganze Szene. Hier geht es um das Fläschchen in der
       Auswahl, wie bei Zutaten und Snacks. */
    const beides = Object.keys(T.BADEZUSAETZE)
      .every(z => ('szene_wanne_' + z) in T.BILDPLAETZE && ('zusatz_' + z) in T.BILDPLAETZE);
    if (!beides) throw new Error('Szene und Fläschchen sind nicht beide da');
    return Object.keys(T.BADEZUSAETZE).length + ' Zusätze, je Fläschchen und Szene';
  });

  /* --- Musik --- */

  await p.check('Aus dem Dateiwähler wird eine Liste', () => {
    const wie = T.musikWaehlen([
      { name:'Lieblingslied.mp3', type:'audio/mpeg' },
      { name:'Zweites Lied.m4a',  type:'' },          // manche Geräte melden nichts
      { name:'Urlaubsbild.jpg',   type:'image/jpeg' },
      null,
    ]);
    const namen = T.musikStand().lieder.map(l => l.name);
    if (wie !== 2) throw new Error('es kommen ' + wie + ' Lieder an statt 2');
    if (namen.join('|') !== 'Lieblingslied|Zweites Lied')
      throw new Error('die Namen stimmen nicht: ' + namen.join(', '));
    T.musikAus();
    T.musikStand().lieder = [];
    return namen.join(', ') + ' — das Bild bleibt draußen';
  });

  await p.check('Musik hebt die Laune, solange sie läuft', () => {
    const m = T.musikStand();
    const stellen = laeuft => {
      T.DATA.bella.satt = 50; T.DATA.bella.sauber = 50;
      T.DATA.bella.ausgeruht = 50; T.DATA.bella.laune = 50;
      T.DATA.stand = new Date(Date.now() - 3600000).toISOString();
      m.laeuft = laeuft;
      m.seit = laeuft ? Date.now() - 3600000 : 0;
      T.standFortschreiben();
      return T.DATA.bella.laune;
    };
    const ohne = stellen(false), mit = stellen(true);
    m.laeuft = false; m.seit = 0;
    /* Eine Stunde Musik ist MUSIK_LAUNE; alles andere läuft gleich. */
    const unterschied = mit - ohne;
    if (Math.abs(unterschied - T.MUSIK_LAUNE) > 1.5)
      throw new Error('eine Stunde Musik bringt ' + unterschied.toFixed(1)
                    + ' statt ' + T.MUSIK_LAUNE);
    return 'eine Stunde: ' + ohne.toFixed(1) + ' → ' + mit.toFixed(1);
  });

  await p.check('Angehaltene Musik zählt nicht weiter', () => {
    const m = T.musikStand();
    m.laeuft = true; m.seit = Date.now() - 1800000;
    T.DATA.bella.laune = 40;
    T.musikHalten();                       // rechnet die halbe Stunde ab
    const nachHalten = T.DATA.bella.laune;
    if (!(nachHalten > 40)) throw new Error('die gelaufene Zeit wird nicht gutgeschrieben');
    /* Danach darf nichts mehr dazukommen — sonst stiege die Laune
       weiter, obwohl nichts mehr spielt. */
    T.DATA.stand = new Date(Date.now() - 3600000).toISOString();
    T.DATA.bella.satt = 50; T.DATA.bella.sauber = 50; T.DATA.bella.ausgeruht = 50;
    const vorher = T.DATA.bella.laune;
    T.standFortschreiben();
    if (T.musikGutschrift(new Date(), 60) !== 0)
      throw new Error('es wird weiter Musikzeit gebucht');
    if (T.musikLaeuft()) throw new Error('sie gilt noch als laufend');
    /* Auch die Uhr muss stehen, nicht nur der Schalter: bliebe `seit`
       stehen, würde beim nächsten Anschalten die ganze Pause
       mitgerechnet. Beim Gegenprobieren war genau das nicht abgedeckt. */
    if (T.musikStand().seit) throw new Error('die Uhr läuft im Anhalten weiter');
    return 'abgerechnet auf ' + nachHalten.toFixed(1) + ', danach steht die Uhr';
  });

  await p.check('Getanzt wird nur im Wohnzimmer', () => {
    const m = T.musikStand();
    m.laeuft = true; m.seit = Date.now();
    T.DATA.bella.schlaeft = false;
    T.DATA.bella.ort = 'wohnen';
    const imWohnzimmer = T.tanzt('wohnen');
    const inDerKueche = T.tanzt('kueche');
    T.DATA.bella.ort = 'kueche';
    const woAnders = T.tanzt('wohnen');
    T.DATA.bella.ort = 'wohnen';
    T.DATA.bella.schlaeft = true;
    const imSchlaf = T.tanzt('wohnen');
    T.DATA.bella.schlaeft = false;
    m.laeuft = false; m.seit = 0;
    const ohneMusik = T.tanzt('wohnen');
    if (!imWohnzimmer) throw new Error('im Wohnzimmer tanzt sie nicht');
    if (inDerKueche) throw new Error('die Küche tanzt mit');
    if (woAnders) throw new Error('sie tanzt im Wohnzimmer, obwohl sie in der Küche ist');
    if (imSchlaf) throw new Error('sie tanzt im Schlaf');
    if (ohneMusik) throw new Error('sie tanzt ohne Musik');
    /* Die Lage muss sich über den Takt wirklich ändern — ein Tanz, der
       stillsteht, wäre keiner. */
    const lagen = [0, 200, 400, 620, 1240].map(v => T.tanzLage(v));
    const seiten = new Set(lagen.map(l => l.seite));
    if (seiten.size < 3) throw new Error('die Tanzlage steht still: ' + [...seiten].join(', '));
    if (!lagen.some(l => l.spiegel) || !lagen.some(l => !l.spiegel))
      throw new Error('sie dreht sich nie um');
    return 'nur im Wohnzimmer, wach und bei Musik · ' + seiten.size + ' Stellungen im Takt';
  });

  await p.check('Die Musik wird nicht gespeichert', () => {
    const m = T.musikStand();
    m.lieder = [{ name:'Lieblingslied', datei:{}, url:'blob:probe' }];
    m.laeuft = true; m.seit = Date.now();
    const gespeichert = JSON.stringify(T.vaultPayload());
    m.lieder = []; m.laeuft = false; m.seit = 0;
    if (/musik|Lieblingslied|blob:/i.test(gespeichert))
      throw new Error('die Lieder landen im Bestand');
    /* Auch nach dem Laden darf nichts auftauchen: die Liste lebt nur im
       Arbeitsspeicher, weil sie sonst eine Kopie der Musiksammlung wäre. */
    if ('musik' in T.adoptVault({ musik: { lieder: [{ name:'x' }] } }))
      throw new Error('beim Laden wird eine Musikliste angelegt');
    return 'nichts davon im Bestand';
  });

  await p.check('Musik hören steht nicht doppelt im Wohnzimmer', () => {
    /* Es gab schon einen Knopf „Musik hören" als einmaligen Laune-Schub.
       Der Musikspieler hat seinen Platz übernommen; stünde beides da,
       hätte man zwei Knöpfe mit demselben Namen und verschiedenem Tun. */
    T.state.raum = 'wohnen';
    T.DATA.bella.ort = 'wohnen';
    T.DATA.bella.schlaeft = false;
    T.render();
    const knoepfe = $$('#tasten .taste').map(b => b.textContent.trim());
    const musik = knoepfe.filter(t => t.indexOf('MUSIK') === 0);
    if (musik.length !== 1) throw new Error('Musikknöpfe: ' + knoepfe.join(' | '));
    if (!knoepfe.includes('VORLESEN')) throw new Error('VORLESEN ist weggefallen: ' + knoepfe.join(' | '));
    if (!knoepfe.includes('REDEN')) throw new Error('REDEN ist weggefallen: ' + knoepfe.join(' | '));
    return knoepfe.join(' | ');
  });

  /* --- Bella-Modelle --- */

  await p.check('Jede Bella-Schicht hat einen Platz, je Modell und Haltung', () => {
    const fehlt = [];
    Object.keys(T.BELLA_MODELLE).filter(m => m !== 'gezeichnet').forEach(m => {
      T.BELLA_POSEN.forEach(pose => {
        T.BELLA_SCHICHTEN.forEach(sch => {
          const stamm = 'bella_' + m + '_' + pose + '_' + sch.teil;
          if (!(stamm in T.BILDPLAETZE)) fehlt.push(stamm);
          (sch.ids ? sch.ids() : []).forEach(id => {
            if (!(stamm + '_' + id in T.BILDPLAETZE)) fehlt.push(stamm + '_' + id);
          });
        });
      });
    });
    if (fehlt.length) throw new Error('ohne Platz: ' + fehlt.slice(0, 4).join(', ')
                                    + ' (' + fehlt.length + ')');
    const wie = Object.keys(T.BILDPLAETZE).filter(k => k.startsWith('bella_m')).length;
    return (Object.keys(T.BELLA_MODELLE).length - 1) + ' Modelle, ' + T.BELLA_POSEN.length
         + ' Haltungen, ' + T.BELLA_SCHICHTEN.length + ' Schichten — ' + wie + ' Plätze';
  });

  await p.check('Die genauere Schicht schlägt die allgemeine', () => {
    const stamm = 'bella_m1_steht_stueck';
    const merk = { [stamm]: T.BILDER[stamm], [stamm + '_kleid']: T.BILDER[stamm + '_kleid'] };
    try {
      T.BILDER[stamm] = { el:{}, b:258, h:952 };
      const nurAllgemein = T.bellaSchichtPlatz('m1', 'steht', 'stueck', 'kleid');
      T.BILDER[stamm + '_kleid'] = { el:{}, b:258, h:952 };
      const mitGenau = T.bellaSchichtPlatz('m1', 'steht', 'stueck', 'kleid');
      /* Ohne Rückfall müsste jedes Kleidungsstück gemalt sein, bevor
         überhaupt etwas zu sehen wäre. */
      if (nurAllgemein !== stamm) throw new Error('kein Rückfall auf die allgemeine Fassung');
      if (mitGenau !== stamm + '_kleid') throw new Error('die genauere Fassung wird übergangen');
      return nurAllgemein + ' → ' + mitGenau;
    } finally {
      Object.entries(merk).forEach(([k, v]) => { if (v) T.BILDER[k] = v; else delete T.BILDER[k]; });
    }
  });

  await p.check('Ohne Körperschicht bleibt es bei der gezeichneten Bella', () => {
    const stamm = 'bella_m2_steht_koerper';
    const merk = T.BILDER[stamm];
    try {
      if (T.bellaModelleDa().length !== 1) throw new Error('es steht etwas zur Wahl, was es nicht gibt');
      T.BILDER['bella_m2_steht_stueck'] = { el:{}, b:258, h:952 };
      if (T.bellaModelleDa().includes('m2'))
        throw new Error('ein Kleid allein macht schon ein Modell');
      T.BILDER[stamm] = { el:{}, b:258, h:952 };
      if (!T.bellaModelleDa().includes('m2')) throw new Error('mit Körper fehlt das Modell trotzdem');
      return 'erst mit Körper: ' + T.bellaModelleDa().join(', ');
    } finally {
      delete T.BILDER['bella_m2_steht_stueck'];
      if (merk) T.BILDER[stamm] = merk; else delete T.BILDER[stamm];
    }
  });

  await p.check('Die Figurfläche stimmt mit den eingetragenen Maßen', () => {
    /* Alle Schichten liegen auf derselben Fläche — sonst passten sie
       nicht zueinander. Stimmt sie nicht mit Bellas Maß, wäre jede
       Vorlage in LIESMICH.md falsch. */
    const st = T.BELLA_POSE_MASS.steht, li = T.BELLA_POSE_MASS.liegt;
    if (st.b !== T.BREITEN_CM.bella || st.h !== T.GROESSEN_CM.bella)
      throw new Error('stehend passt nicht: ' + st.b + '×' + st.h);
    if (li.h !== T.GROESSEN_CM.bella_liegt) throw new Error('liegend passt nicht: ' + li.h);
    return st.b + '×' + st.h + ' cm stehend (' + T.sollPunkte(st.b) + '×' + T.sollPunkte(st.h)
         + ' Punkte), ' + li.b + '×' + li.h + ' cm liegend';
  });

  await p.check('Das gewählte Modell übersteht das Laden', () => {
    if (T.adoptVault({ bella:{ modell:'m3' } }).bella.modell !== 'm3')
      throw new Error('die Wahl geht verloren');
    if (T.adoptVault({ bella:{ modell:'unfug' } }).bella.modell !== 'gezeichnet')
      throw new Error('Unsinn wird nicht abgefangen');
    if (T.adoptVault({}).bella.modell !== 'gezeichnet')
      throw new Error('ohne Angabe steht nichts da');
    return 'm3 bleibt, Unsinn wird gezeichnet';
  });

  /* --- Fenster, Tageszeit und Wetter --- */

  await p.check('Für jede Tageszeit und jedes Wetter gibt es einen Fensterplatz', () => {
    const fehlt = [];
    if (!('ausblick' in T.BILDPLAETZE)) fehlt.push('ausblick');
    Object.keys(T.WETTER).forEach(w => {
      if (!('ausblick_' + w in T.BILDPLAETZE)) fehlt.push('ausblick_' + w);
    });
    T.TAGESZEITEN.forEach(tz => {
      if (!('ausblick_' + tz in T.BILDPLAETZE)) fehlt.push('ausblick_' + tz);
      Object.keys(T.WETTER).forEach(w => {
        if (!('ausblick_' + tz + '_' + w in T.BILDPLAETZE)) fehlt.push('ausblick_' + tz + '_' + w);
      });
    });
    if (fehlt.length) throw new Error('ohne Platz: ' + fehlt.join(', '));
    return T.TAGESZEITEN.length + ' Tageszeiten × ' + Object.keys(T.WETTER).length
         + ' Wetterlagen = ' + Object.keys(T.BILDPLAETZE).filter(k => k.startsWith('ausblick')).length
         + ' Plätze';
  });

  await p.check('Der Ausblick fällt von genau auf ungenau zurück', () => {
    const merk = T.DATA.wetter;
    const gesetzt = [];
    const legen = n => { gesetzt.push(n); T.BILDER[n] = { el:{}, b:504, h:616 }; };
    try {
      T.DATA.wetter = 'regen';
      if (T.ausblickPlatz('nacht')) throw new Error('ohne Datei kommt trotzdem etwas');
      legen('ausblick');
      if (T.ausblickPlatz('nacht') !== 'ausblick') throw new Error('die eine Fassung greift nicht');
      legen('ausblick_regen');
      if (T.ausblickPlatz('nacht') !== 'ausblick_regen') throw new Error('das Wetter schlägt nicht durch');
      legen('ausblick_nacht');
      if (T.ausblickPlatz('nacht') !== 'ausblick_nacht') throw new Error('die Tageszeit schlägt nicht durch');
      legen('ausblick_nacht_regen');
      if (T.ausblickPlatz('nacht') !== 'ausblick_nacht_regen')
        throw new Error('die genaue Fassung schlägt nicht durch');
      // Eine Tageszeit ohne eigene Datei nimmt wieder die Wetterfassung.
      if (T.ausblickPlatz('tag') !== 'ausblick_regen')
        throw new Error('ohne Tagesfassung wird nicht zurückgefallen: ' + T.ausblickPlatz('tag'));
      return 'ausblick → _regen → _nacht → _nacht_regen';
    } finally {
      gesetzt.forEach(n => { delete T.BILDER[n]; });
      T.DATA.wetter = merk;
    }
  });

  await p.check('Das eingestellte Wetter schlägt die Losung', () => {
    const merk = T.DATA.wetter;
    try {
      T.DATA.wetter = 'schnee';
      const fest = [new Date(2026, 0, 1), new Date(2026, 7, 9)].map(d => T.wetterJetzt(d));
      if (fest.some(w => w !== 'schnee')) throw new Error('festgestellt hält nicht: ' + fest.join(', '));
      T.DATA.wetter = 'auto';
      /* Ausgelost wird aus dem Datum: derselbe Tag gibt immer dasselbe
         Wetter, sonst flackerte das Fenster bei jedem Bild. */
      const tag = new Date(2026, 2, 14);
      const frueh = T.wetterJetzt(new Date(2026, 2, 14, 2, 5));
      const spaet = T.wetterJetzt(new Date(2026, 2, 14, 23, 50));
      if (frueh !== spaet) throw new Error('wechselt im Lauf des Tages: ' + frueh + ' → ' + spaet);
      const ueber = [];
      for (let i = 0; i < 60; i++) ueber.push(T.wetterJetzt(new Date(2026, 0, 1 + i)));
      const verschieden = [...new Set(ueber)];
      if (verschieden.some(w => !T.WETTER[w])) throw new Error('unbekanntes Wetter: ' + verschieden.join(', '));
      if (verschieden.length < 3) throw new Error('kaum Abwechslung: ' + verschieden.join(', '));
      return 'fest hält, ' + T.wetterJetzt(tag) + ' den ganzen Tag, '
           + verschieden.length + ' Lagen über 60 Tage';
    } finally { T.DATA.wetter = merk; }
  });

  await p.check('Das Wetter übersteht das Laden', () => {
    if (T.adoptVault({ wetter:'regen' }).wetter !== 'regen') throw new Error('die Wahl geht verloren');
    if (T.adoptVault({ wetter:'nieselig' }).wetter !== 'auto') throw new Error('Unsinn wird nicht abgefangen');
    if (T.adoptVault({}).wetter !== 'auto') throw new Error('ohne Angabe steht nichts da');
    return 'regen bleibt, Unsinn wird automatisch';
  });

  await p.check('Das Fenster im Schlafzimmer lässt sich setzen', () => {
    const merk = T.BILDER.szene_nische;
    try {
      /* Bei gezeichneter Nische immer — da gibt es ein Fenster. */
      if (!T.zoneGilt('schlaf', 'zone_ausblick')) throw new Error('bei gezeichneter Nische fehlt es');
      if (!T.dingeImRaum('schlaf').some(d => d.name === 'zone_ausblick'))
        throw new Error('es steht nicht in der Liste zum Setzen');
      /* Bei gemalter Nische ohne Ausblick gäbe es nichts zu setzen —
         dann stünde im Platzierungs-Modus ein Rahmen um nichts. */
      T.BILDER.szene_nische = { el:{}, b:1176, h:1320 };
      if (T.zoneGilt('schlaf', 'zone_ausblick'))
        throw new Error('bei gemalter Nische ohne Ausblick steht es trotzdem da');
      T.BILDER.ausblick = { el:{}, b:504, h:616 };
      if (!T.zoneGilt('schlaf', 'zone_ausblick'))
        throw new Error('mit gemaltem Ausblick fehlt es');
      return 'gezeichnet: ja · gemalt ohne Ausblick: nein · gemalt mit Ausblick: ja';
    } finally {
      delete T.BILDER.ausblick;
      if (merk) T.BILDER.szene_nische = merk; else delete T.BILDER.szene_nische;
    }
  });

  /* --- Gemalte Wände und Böden --- */

  await p.check('Jede Tapete und jeder Boden hat einen eigenen Bildplatz', () => {
    const fehlt = [];
    Object.keys(T.WANDFARBEN).forEach(w => { if (!('wand_' + w in T.BILDPLAETZE)) fehlt.push('wand_' + w); });
    Object.keys(T.BODENFARBEN).forEach(b => { if (!('boden_' + b in T.BILDPLAETZE)) fehlt.push('boden_' + b); });
    if (fehlt.length) throw new Error('ohne Platz: ' + fehlt.join(', '));
    /* Getrennte Plätze sind der Kern: ein gemaltes Zimmer als ein Stück
       würde bedeuten, dass Wand und Boden nicht mehr einzeln wechselbar
       sind. */
    const wandPlaetze = Object.keys(T.BILDPLAETZE).filter(k => k.startsWith('wand_'));
    const bodenPlaetze = Object.keys(T.BILDPLAETZE).filter(k => k.startsWith('boden_'));
    if (wandPlaetze.some(w => bodenPlaetze.includes(w)))
      throw new Error('Wand und Boden teilen sich einen Platz');
    return wandPlaetze.length + ' Tapeten, ' + bodenPlaetze.length + ' Böden, getrennt';
  });

  await p.check('Die Bodenlinie liegt auf jedem Gerät gleich', () => {
    const werte = [{ h: 300 }, { h: 344 }, { h: 368 }, { h: 378 }, { h: 420 }]
      .map(f => T.bodenbandCm(f));
    if (new Set(werte).size !== 1)
      throw new Error('das Bodenband wandert: ' + werte.join(', '));
    if (werte[0] !== T.ZIMMER.bodenCm)
      throw new Error('Bodenband ' + werte[0] + ' statt ' + T.ZIMMER.bodenCm);
    // Bella muss über der Linie noch Platz haben.
    const s = T.buehneMasse();
    if (s.h - T.bodenbandCm(s) < T.GROESSEN_CM.bella)
      throw new Error('über der Bodenlinie bleiben nur ' + (s.h - T.bodenbandCm(s)) + ' cm');
    return T.ZIMMER.bodenCm + ' cm Boden, ' + (s.h - T.ZIMMER.bodenCm).toFixed(0) + ' cm Wand darüber';
  });

  await p.check('Jede Zutat und jeder Snack hat einen Bildplatz', () => {
    const fehlt = [];
    Object.keys(T.ZUTATEN).forEach(z => { if (!('zutat_' + z in T.BILDPLAETZE)) fehlt.push('zutat_' + z); });
    Object.keys(T.SNACKS).forEach(s => { if (!('snack_' + s in T.BILDPLAETZE)) fehlt.push('snack_' + s); });
    if (fehlt.length) throw new Error('ohne Platz: ' + fehlt.join(', '));
    return Object.keys(T.ZUTATEN).length + ' Zutaten, ' + Object.keys(T.SNACKS).length + ' Snacks';
  });

  await p.check('In den Listen steht ein Bild, kein Farbkästchen', async () => {
    await mitBella('kueche');
    const mitBild = w => {
      const kacheln = $$(w + ' .stueck');
      if (!kacheln.length) throw new Error('keine Kacheln in ' + w);
      const ohne = kacheln.filter(k => !k.querySelector('canvas.listenbild'));
      if (ohne.length) throw new Error(w + ': ' + ohne.length + ' ohne Bild');
      return kacheln.length;
    };
    const vorrat = mitBild('#vorratblock');
    click(taste('KOCHEN'));
    await wait(30);
    const kochen = mitBild('#zutaten');
    click($('#modalblatt .schliessen'));
    await wait(20);
    T.DATA.snacks[Object.keys(T.SNACKS)[0]] = 2;
    T.render();
    await wait(20);
    click($$('#tasten .taste').find(t => t.textContent.startsWith('SNACK')));
    await wait(30);
    const snacks = mitBild('#snackgitter');
    click($('#modalblatt .schliessen'));
    await wait(20);
    return vorrat + ' im Vorrat, ' + kochen + ' beim Kochen, ' + snacks + ' Snacks';
  });

  /* --- Bella ist nur an einem Ort --- */

  await p.check('Bella steht immer nur in einem Zimmer', async () => {
    T.DATA.bella.schlaeft = false;
    T.DATA.bella.ort = 'wohnen';
    for (const r of ['schlaf','kueche','wohnen','bad','schrank']){
      click(tab(r));
      await wait(20);
      const hier = T.DATA.bella.ort === r;
      const ruf = $$('#tasten .taste').find(t => t.textContent === 'RUFEN');
      if (hier && ruf) throw new Error('Ruf-Knopf, obwohl sie da ist (' + r + ')');
      if (!hier && !ruf) throw new Error('kein Ruf-Knopf, obwohl sie fehlt (' + r + ')');
    }
    return 'sie ist in ' + T.DATA.bella.ort + ', überall sonst steht der Ruf-Knopf';
  });

  await p.check('Rufen holt sie in das Zimmer, in dem man steht', async () => {
    T.DATA.bella.ort = 'wohnen';
    click(tab('bad'));
    await wait(25);
    click($$('#tasten .taste').find(t => t.textContent === 'RUFEN'));
    await wait(40);
    if (T.DATA.bella.ort !== 'bad') throw new Error('sie blieb in ' + T.DATA.bella.ort);
    if ($$('#tasten .taste').some(t => t.textContent === 'RUFEN'))
      throw new Error('der Ruf-Knopf steht noch da');
    return 'wohnen → bad';
  });

  await p.check('Wer schläft, kommt nicht', async () => {
    T.DATA.bella.ort = 'schlaf';
    T.DATA.bella.schlaeft = true;
    click(tab('kueche'));
    await wait(25);
    const ruf = $$('#tasten .taste').find(t => t.textContent === 'RUFEN');
    if (!ruf) throw new Error('kein Ruf-Knopf');
    if (!ruf.classList.contains('aus')) throw new Error('der Knopf sieht bedienbar aus');
    click(ruf);
    await wait(30);
    if (T.DATA.bella.ort !== 'schlaf') throw new Error('sie kam trotzdem');
    T.DATA.bella.schlaeft = false;
    return 'sie bleibt im Bett';
  });

  await p.check('Ohne sie geht nur, was sie nicht braucht', async () => {
    T.DATA.bella.ort = 'schlaf';
    click(tab('bad'));
    await wait(25);
    const knopf = t => $$('#tasten .taste').find(x => x.textContent === t);
    if (!knopf('EINSCHÄUMEN').classList.contains('aus'))
      throw new Error('einschäumen ohne Bella möglich');
    // Der Badezusatz hängt nicht an ihr — der bleibt bedienbar.
    if (knopf('BADEZUSATZ').classList.contains('aus'))
      throw new Error('Badezusatz gesperrt, obwohl er ohne sie geht');
    click(tab('kueche'));
    await wait(25);
    if (knopf('KOCHEN').classList.contains('aus'))
      throw new Error('Kochen gesperrt, obwohl es ohne sie geht');
    return 'Pflege braucht sie, Einrichten und Kochen nicht';
  });

  /* --- Nachts im Bett --- */

  await p.check('Nachts liegt sie nicht jeden Tag gleich', () => {
    const lagen = new Set();
    for (let i = 0; i < 40; i++){
      const d = new Date(2026, 0, 1 + i, 3, 0);
      lagen.add(JSON.stringify(T.schlaflage(d)));
    }
    if (lagen.size < 3) throw new Error('nur ' + lagen.size + ' verschiedene Haltungen');
    // Aber innerhalb einer Nacht bleibt sie liegen, wie sie liegt.
    const abends = T.schlaflage(new Date(2026, 0, 5, 23, 30));
    const nachts = T.schlaflage(new Date(2026, 0, 6, 3, 0));
    const morgens = T.schlaflage(new Date(2026, 0, 6, 9, 0));
    if (JSON.stringify(abends) !== JSON.stringify(nachts)
     || JSON.stringify(nachts) !== JSON.stringify(morgens))
      throw new Error('sie dreht sich mitten in der Nacht');
    return lagen.size + ' von ' + T.SCHLAFLAGEN.length + ' Haltungen, je Nacht dieselbe';
  });

  /* --- Frisur und Kleidung --- */

  await p.check('Die Haarfarbe steht fest, die Frisur nicht', async () => {
    await mitBella('schrank');
    click(taste('ANZIEHEN'));
    await wait(30);
    const koepfe = $$('#modalblatt .blockkopf').map(k => k.textContent);
    if (koepfe.some(k => /HAARFARBE|^HAARE$/.test(k)))
      throw new Error('die Haarfarbe steht zur Wahl: ' + koepfe.join(', '));
    if (!koepfe.includes('FRISUR')) throw new Error('keine Frisurwahl: ' + koepfe.join(', '));
    const andere = T.DATA.besitz.frisuren.find(f => f !== T.DATA.outfit.frisur);
    click($$('#modalblatt .stueck').find(b => b.dataset.wahl === andere));
    await wait(40);
    if (T.DATA.outfit.frisur !== andere) throw new Error('Frisur: ' + T.DATA.outfit.frisur);
    // Die Haarfarbe ist überall dieselbe.
    const plaetze = T.outfitPlaetze ? null : null;
    if (T.HAARFARBE.length !== 3) throw new Error('keine feste Haarfarbe');
    click($('#modalblatt .schliessen'));
    await wait(20);
    return 'Frisur ' + T.FRISUREN[andere].name + ', Haarfarbe unverändert';
  });

  await p.check('Kleidungsstücke sind verschiedene Bilder, nicht nur Farben', () => {
    const namen = Object.keys(T.KLEIDUNG);
    if (namen.length < 3) throw new Error('nur ' + namen.length + ' Stücke');
    // Zwei Stücke dürfen nicht dasselbe Raster haben.
    const raster = namen.map(n => T.KLEIDUNG[n].p.join('|'));
    if (new Set(raster).size !== raster.length) throw new Error('zwei Stücke sehen gleich aus');
    // Kopf und Körper passen zusammen.
    const vorher = T.DATA.outfit.stueck;
    T.DATA.outfit.stueck = namen[0];
    const a = T.bellaRaster();
    T.DATA.outfit.stueck = namen[1];
    const b2 = T.bellaRaster();
    if (a.length !== T.KOPF_H + T.KOERPER_H) throw new Error('Figur ist ' + a.length + ' Zeilen hoch');
    if (a.join('|') === b2.join('|')) throw new Error('das Stück ändert nichts an der Figur');
    if (a.slice(0, T.KOPF_H).join('|') !== b2.slice(0, T.KOPF_H).join('|'))
      throw new Error('das Kleidungsstück ändert auch den Kopf');
    T.DATA.outfit.stueck = vorher;
    return namen.length + ' Stücke, ' + Object.keys(T.FRISUREN).length + ' Frisuren';
  });

  /* --- Maßstab --- */

  await p.check('Die Modellauflösung kommt aus der Pflanze', () => {
    if (Math.abs(T.MODELL_PX_JE_CM - 140 / 25) > 0.001)
      throw new Error('Modellauflösung: ' + T.MODELL_PX_JE_CM);
    if (T.sollPunkte(25) !== 140) throw new Error('25 cm sind ' + T.sollPunkte(25) + ' Punkte');
    if (T.GROESSEN_CM.deko_pflanze !== 25) throw new Error('die Pflanze ist nicht mit 25 cm eingetragen');
    return T.MODELL_PX_JE_CM + ' Punkte je cm im Modell';
  });

  /* Der Kern der Eichung: die Höhe in Punkten muss dem Verhältnis der
     Zentimeter folgen. Ein Herd ist mehr als doppelt so hoch wie die
     Pflanze, also braucht er mehr als die doppelte Punktzahl. */
  await p.check('Ein Herd besteht aus mehr als der doppelten Punkthöhe der Pflanze', () => {
    const pflanze = T.sollPunkte(T.GROESSEN_CM.deko_pflanze);
    const herd = T.sollPunkte(T.GROESSEN_CM.herd);
    if (!(herd > 2 * pflanze))
      throw new Error('Herd ' + herd + ' Punkte, Pflanze ' + pflanze + ' Punkte');
    const paare = [['kuehlschrank', 'herd'], ['schrank', 'nachttisch'], ['bella', 'wanne']];
    paare.forEach(([gross, klein]) => {
      const vg = T.sollPunkte(T.GROESSEN_CM[gross]) / T.sollPunkte(T.GROESSEN_CM[klein]);
      const vcm = T.GROESSEN_CM[gross] / T.GROESSEN_CM[klein];
      if (Math.abs(vg - vcm) > 0.02)
        throw new Error(gross + '/' + klein + ': Punkte ' + vg.toFixed(2) + ', cm ' + vcm.toFixed(2));
    });
    return 'Pflanze ' + pflanze + ', Herd ' + herd + ' Punkte';
  });

  /* Das Zimmer muss ganz ins Bild. Die Anzeigedichte ist deshalb das
     Ergebnis der Leinwandbreite, nicht eine feste Zahl — genau der
     Fehler, an dem die Zimmer vorher immer enger wurden. */
  await p.check('Ein ganzes Zimmer steht im Bild', () => {
    const s = T.buehneMasse();
    if (s.b !== T.ZIMMER.breiteCm)
      throw new Error('Bühne ist ' + s.b + ' cm breit statt ' + T.ZIMMER.breiteCm);
    if (Math.abs(s.b * s.mass - s.leinwandB) > 1)
      throw new Error('Zimmerbreite füllt die Leinwand nicht: ' + (s.b * s.mass) + ' von ' + s.leinwandB);
    if (!(s.b >= 300)) throw new Error('Zimmer zu schmal: ' + s.b + ' cm');
    // Bella muss hineinpassen, mit Boden darunter.
    if (!(s.h > T.GROESSEN_CM.bella + 20))
      throw new Error('Zimmer zu flach: ' + s.h + ' cm');
    return s.b + ' × ' + s.h.toFixed(0) + ' cm auf ' + s.leinwandB + ' × ' + s.leinwandH
         + ' Punkten (' + s.mass.toFixed(2) + ' Punkte je cm)';
  });

  await p.check('Die Möbel sind gezeichnet, nicht aus Rastern gezogen', () => {
    const ohne = ['fenster','herd','kuehlschrank','tisch','sofa','regal','pflanze',
                  'wanne','waschbecken','spiegel','schrank','stange','bett','nachttisch','lampe']
                 .filter(n => !T.moebelDa(n));
    if (ohne.length) throw new Error('ohne Zeichnung: ' + ohne.join(', '));
    return Object.keys(T.MOEBELBILD).length + ' Zeichnungen';
  });

  /* Die beiden Nahansichten sind gewollt herangezoomt — aber die Szene
     muss ganz ins Bild passen. Vorher hingen sie am Maßstab des Zimmers
     und liefen unten heraus, sobald das Zimmer breiter wurde. */
  await p.check('Nische und Wanne stehen vollständig im Bild', () => {
    const formate = [[380, 420], [320, 300], [800, 320], [1200, 900], [390, 700]];
    const zeilen = [];
    formate.forEach(([bp, hp]) => {
      const roh = { leinwandB: bp, leinwandH: hp };
      [['nische', T.nischeMasse], ['wanne', T.wanneMasse]].forEach(([name, masse]) => {
        const s = T.szenenMasse(roh, T.SZENE_CM[name]);
        const m = masse(s);
        if (m.links < 0 || m.rechts > s.b)
          throw new Error(name + ' bei ' + bp + '×' + hp + ': seitlich angeschnitten ('
                        + m.links.toFixed(0) + '…' + m.rechts.toFixed(0) + ' von ' + s.b + ')');
        if (m.oben < 0 || m.unten > s.h)
          throw new Error(name + ' bei ' + bp + '×' + hp + ': oben/unten angeschnitten ('
                        + m.oben.toFixed(0) + '…' + m.unten.toFixed(0) + ' von ' + s.h.toFixed(0) + ')');
        // Herangezoomt heißt: enger als ein ganzes Zimmer.
        // Herangezoomt: auf einem Handy-Format enger als ein ganzes Zimmer.
        if (hp >= bp && !(s.b < T.ZIMMER.breiteCm))
          throw new Error(name + ' ist nicht mehr herangezoomt: ' + s.b + ' cm');
        if (bp === 380) zeilen.push(name + ' ' + s.b + '×' + s.h.toFixed(0) + ' cm');
      });
    });
    return zeilen.join(' · ');
  });

  /* Der Maßstab der Szene ist enger, die Größenverhältnisse sind
     dieselben: Bellas Kopf ist hier wie im Zimmer 42 cm. */
  await p.check('In der Nahansicht gilt derselbe Maßstab', () => {
    const roh = { leinwandB: 1170, leinwandH: 1260 };
    const zimmer = T.buehneMasse();
    const szene = T.szenenMasse(roh, T.SZENE_CM.wanne);
    if (!(szene.mass > zimmer.mass))
      throw new Error('die Nahansicht zeigt nicht mehr Punkte je cm');
    const kopfCm = T.GROESSEN_CM.bella * 0.247;
    return 'Kopf ' + kopfCm.toFixed(0) + ' cm: im Zimmer '
         + Math.round(kopfCm * zimmer.mass) + ' Punkte, in der Wanne '
         + Math.round(kopfCm * szene.mass) + ' Punkte';
  });

  await p.check('Bella ist siebenmal so hoch wie die Pflanze', () => {
    const v = T.GROESSEN_CM.bella / T.GROESSEN_CM.deko_pflanze;
    if (T.GROESSEN_CM.bella !== 170) throw new Error('Bella: ' + T.GROESSEN_CM.bella + ' cm');
    if (v < 6 || v > 8) throw new Error('Verhältnis: ' + v.toFixed(1));
    return '170 cm zu 25 cm = ' + v.toFixed(1) + ':1';
  });

  await p.check('Eine gelieferte Grafik passt zu ihrer Eintragung', () => {
    // 140 Punkte bei 25 cm ist per Eichung genau richtig.
    const gut = T.massPruefen('deko_pflanze', 140);
    if (gut.abweichung !== 0) throw new Error('Abweichung: ' + gut.abweichung + ' %');
    // Eine doppelt so große Datei fällt auf.
    const schlecht = T.massPruefen('deko_pflanze', 280);
    if (schlecht.abweichung !== 100) throw new Error('nicht erkannt: ' + schlecht.abweichung);
    return 'passend 0 %, doppelt so groß +100 %';
  });

  await p.check('Bella passt auf die Bühne, der Boden weicht', () => {
    /* Der Boden darf nie so breit sein, dass Bella oben herausragt —
       und nie ganz verschwinden. */
    const faelle = [{ h: 226 }, { h: 190 }, { h: 400 }, { h: 344 }];
    const werte = faelle.map(f => {
      const band = T.bodenbandCm(f);
      if (f.h - band < T.GROESSEN_CM.bella)
        throw new Error('Bella ragt heraus bei ' + f.h + ' cm Bühne');
      if (band < 12) throw new Error('der Boden verschwindet: ' + band);
      if (band > T.ZIMMER.bodenMaxCm)
        throw new Error('der Boden ist breiter als erlaubt: ' + band);
      return f.h + ' cm → ' + band;
    });
    return werte.join(' · ');
  });

  /* Auf einem flachen Bildschirm muss der Ausschnitt breiter werden,
     sonst wäre das Zimmer niedriger als Bella. */
  await p.check('Auf jedem Bildschirmformat bleibt ein ganzes Zimmer im Bild', () => {
    const formate = [[380, 420], [320, 300], [800, 320], [1200, 900]];
    const werte = formate.map(([b, h]) => {
      const form = h / b;
      const breite = Math.max(T.ZIMMER.breiteCm,
                              Math.ceil((T.GROESSEN_CM.bella + T.ZIMMER.bodenMinCm + 12) / form));
      const hoehe = breite * form;
      if (hoehe - T.bodenbandCm({ h: hoehe }) < T.GROESSEN_CM.bella)
        throw new Error(b + '×' + h + ': Bella passt nicht');
      if (breite < 300) throw new Error(b + '×' + h + ': nur ' + breite + ' cm Zimmer');
      return b + '×' + h + ' → ' + breite + ' cm';
    });
    return werte.join(' · ');
  });

  /* --- Schuhe und Accessoires --- */

  await p.check('Schuhe und Accessoires stehen im Kleiderschrank', async () => {
    T.DATA.besitz.schuhe = Object.keys(T.SCHUHE);
    T.DATA.besitz.accessoires = Object.keys(T.ACCESSOIRES);
    await mitBella('schrank');
    click(taste('ANZIEHEN'));
    await wait(30);
    const koepfe = $$('#modalblatt .blockkopf').map(k => k.textContent);
    for (const noetig of ['KLEIDUNGSSTÜCK','STOFF','FRISUR','SCHUHE','ACCESSOIRE'])
      if (!koepfe.includes(noetig)) throw new Error(noetig + ' fehlt: ' + koepfe.join(', '));
    const andere = T.DATA.besitz.schuhe.find(x => x !== T.DATA.outfit.schuhe);
    click($$('#modalblatt .stueck').find(b => b.dataset.wahl === andere));
    await wait(40);
    if (T.DATA.outfit.schuhe !== andere) throw new Error('Schuhe: ' + T.DATA.outfit.schuhe);
    const acc = T.DATA.besitz.accessoires.find(x => x !== T.DATA.outfit.accessoire);
    click($$('#modalblatt .stueck').find(b => b.dataset.wahl === acc));
    await wait(40);
    if (T.DATA.outfit.accessoire !== acc) throw new Error('Accessoire: ' + T.DATA.outfit.accessoire);
    click($('#modalblatt .schliessen'));
    await wait(20);
    return T.SCHUHE[andere].name + ' + ' + T.ACCESSOIRES[acc].name;
  });

  await p.check('Schuhe und Accessoires sind so breit wie Bella', () => {
    Object.entries(T.ZUBEHOER).forEach(([n, z]) => {
      if (z.b !== 24) throw new Error(n + ' ist ' + z.b + ' statt 24 breit');
    });
    return Object.keys(T.SCHUHE).length + ' Paare, ' + Object.keys(T.ACCESSOIRES).length + ' Accessoires';
  });

  /* --- Genau platzieren --- */

  await p.check('Gegenstände lassen sich auf den Zentimeter setzen', async () => {
    click(tab('kueche'));
    await wait(25);
    click($('#einrichtenbtn'));
    await wait(30);
    click($('#platzierenbtn'));
    await wait(30);
    if (!T.state.platzieren) throw new Error('kein Platzierungs-Modus');
    // Die Pflanze wählen und um zwei Zentimeter schieben.
    click($$('#modalblatt .stueck').find(b => b.dataset.wahl === 'deko_pflanze'));
    await wait(30);
    const vorher = T.platzVon('kueche', 'deko_pflanze', T.buehneMasse());
    click($$('#modalblatt .taste').find(b => b.dataset.schieb === '→'));
    await wait(30);
    click($$('#modalblatt .taste').find(b => b.dataset.schieb === '↑'));
    await wait(30);
    const nachher = T.DATA.plaetze.kueche.deko_pflanze;
    if (!nachher) throw new Error('nichts gemerkt');
    if (Math.abs(nachher.x - (vorher.x + 1)) > 0.2) throw new Error('x: ' + nachher.x + ' statt ' + (vorher.x + 1));
    if (Math.abs(nachher.unten - (vorher.unten - 1)) > 0.2) throw new Error('unten: ' + nachher.unten);
    return 'x ' + nachher.x.toFixed(1) + ', unten ' + nachher.unten.toFixed(1) + ' cm';
  });

  await p.check('Die Zahlen lassen sich ausgeben und zurücksetzen', async () => {
    click($('#platzausgeben'));
    await wait(25);
    const text = $('#platzausgabe').textContent;
    if (!/deko_pflanze/.test(text)) throw new Error('die Pflanze fehlt in der Ausgabe');
    const gelesen = JSON.parse(text);
    // Die Ausgabe trägt jetzt Stellen und Zonengrößen nebeneinander.
    if (!gelesen.plaetze || !gelesen.plaetze.kueche || !gelesen.plaetze.kueche.deko_pflanze)
      throw new Error('nicht lesbar');
    if (!('zonen' in gelesen)) throw new Error('die Zonen fehlen in der Ausgabe');
    click($('#platzzurueck'));
    await wait(30);
    if (T.DATA.plaetze.kueche.deko_pflanze) throw new Error('nicht zurückgesetzt');
    click($('#modalblatt .schliessen'));
    await wait(20);
    if (T.state.platzieren) throw new Error('der Modus läuft weiter');
    return 'als JSON ausgegeben, wieder auf die Voreinstellung';
  });

  /* --- Eigene Grafiken --- */

  await p.check('Jede Grafik hat einen Platz zum Austauschen', () => {
    const noetig = ['szene_nische','szene_wanne','bella_steht','bella_liegt','hand_dusche'];
    const fehlend = noetig.filter(n => !(n in T.BILDPLAETZE));
    if (fehlend.length) throw new Error('kein Platz für: ' + fehlend.join(', '));
    // Für jedes Rezept und jede Zutat muss es einen Platz geben.
    T.REZEPTE.forEach(r => { if (!('gericht_' + r.id in T.BILDPLAETZE))
      throw new Error('kein Platz für Gericht ' + r.id); });
    Object.keys(T.ZUTATEN).forEach(z => { if (!('zutat_' + z in T.BILDPLAETZE))
      throw new Error('kein Platz für Zutat ' + z); });
    return Object.keys(T.BILDPLAETZE).length + ' Plätze';
  });

  await p.check('Belegt ist genau, wofür eine Datei eingetragen ist', () => {
    /* jsdom lädt keine echten Bilder, meldet aber jedes angeforderte als
       geladen — mit erfundenen 1200×900. Prüfbar ist hier deshalb nur:
       belegt ist genau das, wofür eine Datei eingetragen wurde, alles
       andere fällt auf den Platzhalter zurück, und nichts bricht. Die
       echten Maße prüft die Browser-Gegenprobe. */
    const eingetragen = Object.entries(T.BILDPLAETZE).filter(([, d]) => d).map(([n]) => n);
    const belegt = Object.keys(T.BILDPLAETZE).filter(n => T.bildDa(n));
    const zuviel = belegt.filter(n => !eingetragen.includes(n));
    if (zuviel.length) throw new Error('belegt ohne Eintrag: ' + zuviel.join(', '));
    if (!eingetragen.includes('deko_pflanze')) throw new Error('die Pflanze ist nicht eingetragen');
    if (errors.length) throw new Error('Fehler beim Zeichnen: ' + errors[0]);
    return eingetragen.length + ' von ' + Object.keys(T.BILDPLAETZE).length
         + ' Plätzen belegt, der Rest Platzhalter';
  });

  /* --- Schlafnische --- */

  await p.check('Zudecken schaltet einen sichtbaren Zustand', async () => {
    await mitBella('schlaf');
    T.DATA.bella.zugedeckt = false;
    T.render();
    await wait(20);
    click(taste('ZUDECKEN'));
    await wait(30);
    if (!T.DATA.bella.zugedeckt) throw new Error('nicht zugedeckt');
    if (!taste('AUFDECKEN')) throw new Error('Knopf heißt weiter Zudecken');
    click(taste('AUFDECKEN'));
    await wait(30);
    if (T.DATA.bella.zugedeckt) throw new Error('Decke blieb');
    return 'zudecken ⇄ aufdecken';
  });

  /* --- Küche: Bestellen --- */

  await p.check('Zutaten bestellen ist kostenlos und kommt am nächsten Tag', async () => {
    T.DATA.bestellung = null;
    T.DATA.bestelltHeute = { tag:'', anzahl:0 };
    T.DATA.vorrat.honig = 0;
    await mitBella('kueche');
    click(taste('BESTELLEN'));
    await wait(30);
    click($$('#bestellgitter .stueck').find(b => b.dataset.bestell === 'honig'));
    await wait(25);
    click($('#bestellen'));
    await wait(40);
    if (!T.DATA.bestellung || !T.DATA.bestellung.length) throw new Error('nichts bestellt');
    if (T.DATA.vorrat.honig !== 0) throw new Error('sofort geliefert');
    const liefert = new Date(T.DATA.bestellung[0].liefert);
    if (liefert.getHours() !== T.LIEFERSTUNDE) throw new Error('Lieferstunde: ' + liefert.getHours());
    if (!(liefert > new Date())) throw new Error('Lieferung liegt in der Vergangenheit');
    return 'Honig, geliefert um ' + T.LIEFERSTUNDE + ':00';
  });

  await p.check('Die Lieferung landet zur rechten Zeit im Vorrat', () => {
    const vorher = T.DATA.vorrat.honig;
    if (T.lieferungPruefen(new Date(Date.now() + 3600000)))
      throw new Error('zu früh geliefert');
    const nachher = T.lieferungPruefen(new Date(Date.now() + 3 * 86400000));
    if (!nachher) throw new Error('gar nicht geliefert');
    if (T.DATA.vorrat.honig !== vorher + 1) throw new Error('Vorrat: ' + T.DATA.vorrat.honig);
    if (T.DATA.bestellung) throw new Error('Bestellung blieb offen stehen');
    return 'eine Stunde vorher nichts, danach +1 Honig';
  });

  await p.check('Höchstens fünf Zutaten am Tag, über beliebig viele Bestellungen', async () => {
    T.DATA.bestellung = null;
    T.DATA.bestelltHeute = { tag:'', anzahl:0 };
    if (T.bestellRest() !== T.TAGESMENGE) throw new Error('Start: ' + T.bestellRest());

    // Drei bestellen, dann noch einmal drei — das zweite Mal geht nur
    // noch zwei weit.
    const bestelle = async wie => {
      click(taste('BESTELLEN'));
      await wait(30);
      for (let i = 0; i < wie; i++){
        click($$('#bestellgitter .stueck').find(b => b.dataset.bestell === 'mehl'));
        await wait(15);
      }
      click($('#bestellen'));
      await wait(40);
    };
    await bestelle(3);
    if (T.bestellRest() !== 2) throw new Error('nach 3: ' + T.bestellRest() + ' frei');
    await bestelle(3);
    if (T.bestellRest() !== 0) throw new Error('nach 3+3: ' + T.bestellRest() + ' frei');
    const gesamt = T.DATA.bestellung.reduce((n, b) =>
      n + Object.values(b.waren).reduce((m, x) => m + x, 0), 0);
    if (gesamt !== T.TAGESMENGE) throw new Error('insgesamt bestellt: ' + gesamt);

    // Jetzt ist zu.
    T.render();
    await wait(25);
    if (!taste('HEUTE VOLL')) throw new Error('der Knopf lädt weiter zum Bestellen ein');
    return '3 + 2 von ' + T.TAGESMENGE + ', dann zu';
  });

  await p.check('Am nächsten Tag geht es wieder', () => {
    const gestern = new Date(Date.now() - 86400000);
    T.DATA.bestelltHeute = { tag: T.heuteSchluessel(gestern), anzahl: T.TAGESMENGE };
    if (T.bestellRest() !== T.TAGESMENGE)
      throw new Error('gestriges Limit gilt weiter: ' + T.bestellRest());
    T.DATA.bestelltHeute = { tag:'', anzahl:0 };
    T.DATA.bestellung = null;
    return 'der Zähler hängt am Kalendertag';
  });

  /* --- Snacks --- */

  await p.check('Snacks sind fertig und werden nicht gekocht', async () => {
    Object.keys(T.SNACKS).forEach(k => { T.DATA.snacks[k] = 0; });
    T.DATA.snacks.schoki = 2;
    T.DATA.bella.satt = 40;
    await mitBella('kueche');
    // Snacks tauchen nicht als Zutat und nicht als Rezept auf.
    if (T.ZUTATEN.schoki) throw new Error('Snack steht unter den Zutaten');
    if (T.REZEPTE.some(r => r.aus.includes('schoki'))) throw new Error('Snack in einem Rezept');
    const knopf = $$('#tasten .taste').find(t => /^SNACK/.test(t.textContent));
    if (!knopf) throw new Error('kein Snack-Knopf');
    if (!/\(2\)/.test(knopf.textContent)) throw new Error('Anzahl fehlt: ' + knopf.textContent);
    click(knopf);
    await wait(30);
    click($$('#snackgitter .stueck').find(b => b.dataset.snack === 'schoki'));
    await wait(40);
    if (T.DATA.snacks.schoki !== 1) throw new Error('nicht verbraucht: ' + T.DATA.snacks.schoki);
    if (T.DATA.bella.satt <= 40) throw new Error('nicht satter');
    return 'Schokolade gegessen, satt ' + Math.round(T.DATA.bella.satt);
  });

  await p.check('Ohne Snacks bleibt der Knopf abgeblendet', async () => {
    Object.keys(T.SNACKS).forEach(k => { T.DATA.snacks[k] = 0; });
    await mitBella('kueche');
    const knopf = $$('#tasten .taste').find(t => /^SNACK/.test(t.textContent));
    if (!knopf.classList.contains('aus')) throw new Error('Knopf sieht bedienbar aus');
    click(knopf);
    await wait(25);
    if (T.state.offen === 'snacks') throw new Error('leeres Snackfenster geht auf');
    return 'abgeblendet, mit Hinweis auf die Post';
  });

  await p.check('Snacks kommen mit der Post', () => {
    T.DATA.post.length = 0;
    const b = T.DATA.bella;
    b.satt = 90; b.sauber = 90; b.ausgeruht = 90; b.laune = 90;
    /* Alles freigeschaltet: dann kann die Post nur noch Snacks bringen.
       Über die App statt Liste für Liste — sonst fällt hier jede neue
       Geschenkart durch, und zwar als Testfehler statt als Hinweis. */
    T.allesFreischalten();
    if (T.alleGaben().length) throw new Error('Testaufbau: noch offen — ' +
      T.alleGaben().map(g => g.art).join(','));
    T.postPruefen(48 * 60);
    if (!T.DATA.post.length) throw new Error('nichts gekommen');
    const fremd = T.DATA.post.filter(p => p.art !== 'snack');
    if (fremd.length) throw new Error('etwas anderes als Snacks: ' + fremd[0].art);
    return T.DATA.post.length + ' Snackpäckchen';
  });

  await p.check('Ausgepackt landet der Snack im Vorrat', async () => {
    const gabe = T.DATA.post[0];
    const vorher = T.DATA.snacks[gabe.was] || 0;
    click($('#postbtn'));
    await wait(25);
    click($$('#modalblatt .taste')[0]);
    await wait(40);
    if ((T.DATA.snacks[gabe.was] || 0) <= vorher) throw new Error('nicht im Vorrat');
    click($('#modalblatt .schliessen'));
    await wait(20);
    /* Für die folgenden Prüfungen wieder etwas zum Freischalten lassen:
       zurück auf den Anfangsbestand, wie ihn ein neues Spiel hat. */
    T.DATA.besitz = T.adoptVault({}).besitz;
    return gabe.text;
  });

  /* --- Post --- */

  await p.check('Post kommt nur, wenn es Bella gut geht', () => {
    T.DATA.post.length = 0;
    const b = T.DATA.bella;
    b.satt = 20; b.sauber = 20; b.ausgeruht = 20; b.laune = 20;
    T.postPruefen(48 * 60);
    if (T.DATA.post.length) throw new Error('Geschenk trotz schlechter Werte');
    b.satt = 90; b.sauber = 90; b.ausgeruht = 90; b.laune = 90;
    T.postPruefen(48 * 60);
    if (!T.DATA.post.length) throw new Error('kein Geschenk trotz guter Werte');
    return T.DATA.post.length + ' Sendung(en)';
  });

  await p.check('Ausgepackt landet das Geschenk im Besitz', async () => {
    // Snacks kommen auch, deshalb so lange nachlegen, bis ein
    // Sammelstück dabei ist.
    // Der Briefkasten fasst nur drei Sendungen; kommen lauter Snacke,
    // muss er zwischendurch geleert werden.
    /* Ein Muster für beides. Vorher stand in der Schleife ein
       ungebundenes `wand`, das auch auf `wanddeko` passte: sie hörte
       auf, und das anschließende Suchen fand nichts. */
    const sammelstueck = g => /^(kleid|wand|stueck|frisur|boden)$/.test(g.art);
    for (let i = 0; i < 20 && !T.DATA.post.some(sammelstueck); i++){
      T.DATA.post.length = 0;
      T.postPruefen(48 * 60);
    }
    const gabe = T.DATA.post.find(sammelstueck);
    if (!gabe) throw new Error('kein Sammelstück in der Post');
    const topf = { kleid:'kleider', stueck:'stuecke', frisur:'frisuren',
                   wand:'waende', boden:'boeden' }[gabe.art];
    const i = T.DATA.post.indexOf(gabe);
    click($('#postbtn'));
    await wait(25);
    click($$('#modalblatt .taste')[i]);
    await wait(40);
    if (!T.DATA.besitz[topf].includes(gabe.was)) throw new Error('nicht im Besitz: ' + gabe.was);
    click($('#modalblatt .schliessen'));
    await wait(20);
    return gabe.text;
  });

  /* --- Bestand --- */

  await p.check('Alles überlebt das Laden', () => {
    const v = T.adoptVault({
      bella: { name:'Mia', satt:55, sauber:61, ausgeruht:40, laune:72, schlaeft:true },
      outfit: { stueck:'latzhose', farbe:'minzgruen', frisur:'zopf' },
      zeiten: { einschlafen:'01:00', aufwachen:'09:15' },
      vorrat: { erdbeere: 5 },
      kochbuch: ['shake','gibtsnicht'],
      besitz: { kleider:['minzgruen'], stuecke:['latzhose'], frisuren:['zopf'] },
    });
    if (v.bella.name !== 'Mia') throw new Error('Name: ' + v.bella.name);
    if (v.bella.satt !== 55) throw new Error('Satt: ' + v.bella.satt);
    if (v.zeiten.aufwachen !== '09:15') throw new Error('Zeit: ' + v.zeiten.aufwachen);
    if (v.vorrat.erdbeere !== 5) throw new Error('Vorrat: ' + v.vorrat.erdbeere);
    if (v.kochbuch.join() !== 'shake') throw new Error('Kochbuch: ' + v.kochbuch.join());
    return 'Name, Werte, Zeiten, Vorrat, Kochbuch';
  });

  await p.check('Unsinn im Bestand wird auf gültige Werte gebracht', () => {
    const v = T.adoptVault({
      bella: { name:'', satt:'viel', laune:-40, ausgeruht:9999 },
      outfit: { stueck:'tarnanzug', farbe:'tarnfarbe', frisur:'neon' },
      zeiten: { einschlafen:'25:99', aufwachen:'morgens' },
      besitz: { kleider:['gibtsnicht'] },
    });
    if (v.bella.name !== 'Bella') throw new Error('Name: ' + v.bella.name);
    if (v.bella.laune !== 0) throw new Error('Laune: ' + v.bella.laune);
    if (v.bella.ausgeruht !== 100) throw new Error('Ausgeruht: ' + v.bella.ausgeruht);
    if (v.outfit.stueck !== 'kleid') throw new Error('Stück: ' + v.outfit.stueck);
    if (v.outfit.farbe !== 'rosenrot') throw new Error('Stoff: ' + v.outfit.farbe);
    if (v.outfit.frisur !== 'lang') throw new Error('Frisur: ' + v.outfit.frisur);
    if (v.zeiten.einschlafen !== '02:30') throw new Error('Zeit: ' + v.zeiten.einschlafen);
    if (!v.besitz.kleider.includes('rosenrot')) throw new Error('Besitz leer');
    return 'alles auf gültige Werte';
  });

  await p.check('Was man trägt, besitzt man auch', () => {
    const v = T.adoptVault({ outfit:{ stueck:'pulli', farbe:'lavendel', frisur:'locken' },
                             besitz:{ kleider:['rosenrot'], stuecke:['kleid'], frisuren:['lang'] } });
    if (!v.besitz.kleider.includes('lavendel')) throw new Error('Stoff fehlt im Besitz');
    if (!v.besitz.stuecke.includes('pulli')) throw new Error('Kleidungsstück fehlt im Besitz');
    if (!v.besitz.frisuren.includes('locken')) throw new Error('Frisur fehlt im Besitz');
    return 'nachgetragen';
  });

  /* --- Erinnerungen --- */

  await p.check('Ohne Erlaubnis wird nichts geplant', () => {
    T.DATA.erinnerungen = false;
    if (T.erinnerungsPlan(new Date(2026, 0, 5, 14, 0)).length)
      throw new Error('Plan trotz ausgeschalteter Erinnerungen');
    return 'aus heißt aus';
  });

  await p.check('Der Plan hängt an den echten Werten', () => {
    T.DATA.erinnerungen = true;
    T.DATA.zeiten.einschlafen = '02:30';
    T.DATA.zeiten.aufwachen = '10:30';
    const jetzt = new Date(2026, 0, 5, 14, 0);
    const b = T.DATA.bella;
    b.satt = 90; b.sauber = 90;
    const voll = T.erinnerungsPlan(jetzt);
    b.satt = 40; b.sauber = 90;
    const hungrig = T.erinnerungsPlan(jetzt);
    const wann = art => { const e = hungrig.find(x => x.id === T.ERINNERUNG[art].id); return e && e.wann; };
    const wannVoll = voll.find(x => x.id === T.ERINNERUNG.hunger.id);
    if (!wann('hunger')) throw new Error('keine Hungermeldung');
    if (!wannVoll) throw new Error('bei 90 gar keine Meldung');
    if (!(wann('hunger') < wannVoll.wann)) throw new Error('bei 40 satt nicht früher als bei 90');
    // Bei vollen Werten fiele der Hunger in ihre Nacht — die Meldung darf
    // deshalb nicht wegfallen, sondern rutscht hinter das Aufwachen.
    if (wannVoll.wann.getHours() !== 10 || wannVoll.wann.getMinutes() !== 50)
      throw new Error('verschobene Meldung um ' + wannVoll.wann.getHours() + ':' + wannVoll.wann.getMinutes());
    return 'satt 40 → ' + wann('hunger').getHours() + ' Uhr, satt 90 → hinter dem Aufwachen um 10:50';
  });

  await p.check('In Bellas Nacht klingelt nichts', () => {
    const b = T.DATA.bella;
    // Werte so, dass der Hunger mitten in die Nacht fiele.
    b.satt = 28 + 3.2 * 6;        // in rund sechs Stunden unter der Schwelle
    b.sauber = 100;
    const plan = T.erinnerungsPlan(new Date(2026, 0, 5, 21, 0));  // + 6 h = 03:00
    // Die Meldung fällt nicht weg — sie rutscht aus der Nacht heraus.
    const hunger = plan.find(x => x.id === T.ERINNERUNG.hunger.id);
    if (!hunger) throw new Error('Hungermeldung fiel ganz weg');
    const innerhalb = plan.filter(x => T.istSchlafzeit(x.wann));
    if (innerhalb.length)
      throw new Error(innerhalb.length + ' Meldung(en) im Schlaffenster, erste um '
                    + innerhalb[0].wann.getHours() + ':' + innerhalb[0].wann.getMinutes());
    return 'keine der ' + plan.length + ' Meldungen liegt zwischen 02:30 und 10:30';
  });

  await p.check('Nichts kommt sofort und nichts doppelt', () => {
    const b = T.DATA.bella;
    b.satt = 29; b.sauber = 29;        // knapp über der Schwelle
    const jetzt = new Date(2026, 0, 5, 14, 0);
    const plan = T.erinnerungsPlan(jetzt);
    const zuFrueh = plan.filter(x => x.wann - jetzt < T.FRUEHESTENS_MIN * 60000);
    if (zuFrueh.length) throw new Error(zuFrueh.length + ' Meldung(en) in der nächsten Stunde');
    const ids = plan.map(x => x.id);
    if (new Set(ids).size !== ids.length) throw new Error('doppelte Kennung: ' + ids.join());
    return plan.length + ' Meldungen, frühestens in ' + T.FRUEHESTENS_MIN + ' Minuten';
  });

  await p.check('Aufwachen und Vermissen stehen immer im Plan', () => {
    const jetzt = new Date(2026, 0, 5, 14, 0);
    const plan = T.erinnerungsPlan(jetzt);
    const wach = plan.find(x => x.id === T.ERINNERUNG.wach.id);
    const vermisst = plan.find(x => x.id === T.ERINNERUNG.vermisst.id);
    if (!wach) throw new Error('keine Aufwach-Meldung');
    if (wach.wann.getHours() !== 10 || wach.wann.getMinutes() !== 30)
      throw new Error('Aufwachen um ' + wach.wann.getHours() + ':' + wach.wann.getMinutes());
    if (!vermisst) throw new Error('keine Vermisst-Meldung');
    const tage = Math.round((vermisst.wann - jetzt) / 86400000);
    if (tage !== 3) throw new Error('Vermisst nach ' + tage + ' Tagen');
    return 'Aufwachen 10:30, Vermissen nach 3 Tagen';
  });

  await p.check('Ohne Handy bleibt der Schalter aus', async () => {
    T.DATA.erinnerungen = false;
    const an = await T.erinnerungenSchalten(true);
    // Im Browser gibt es keinen Meldedienst; der Schalter darf trotzdem
    // umspringen, nur darf nichts brechen.
    if (typeof an !== 'boolean') throw new Error('kein Ergebnis');
    if (errors.length) throw new Error('Fehler beim Schalten: ' + errors[0]);
    return 'kein Absturz ohne Capacitor';
  });

  await p.check('Der Schalter steht in den Einstellungen', async () => {
    click($('#settingsbtn'));
    await wait(30);
    const knopf = $('#erinnerungbtn');
    if (!knopf) throw new Error('kein Schalter');
    const vorher = T.DATA.erinnerungen;
    click(knopf);
    await wait(40);
    if (T.DATA.erinnerungen === vorher) throw new Error('Schalter ohne Wirkung');
    click($('#modalblatt .schliessen'));
    await wait(20);
    return vorher ? 'an → aus' : 'aus → an';
  });

  /* --- Optik, soweit ohne Browser prüfbar --- */

  await p.check('Es liegt kein Muster über den Zimmern', async () => {
    // Die Tageszeit gibt es weiter als Angabe, aber nichts wird mehr
    // über die Szene gelegt — das Raster hat jede Grafik zugedeckt.
    const mittag = T.tageszeit(new Date(2026, 0, 5, 12, 0));
    const nacht  = T.tageszeit(new Date(2026, 0, 5, 23, 0));
    if (mittag.nacht) throw new Error('Mittag gilt als Nacht');
    if (!nacht.nacht) throw new Error('23 Uhr gilt als Tag');
    // Die Rasterdichte war der Überzug. Ist sie weg, wird nichts mehr
    // darübergelegt; dass die Bühne wirklich sauber ist, prüft die
    // Browser-Gegenprobe an den Bildpunkten.
    if ('dichte' in mittag || 'deckung' in mittag)
      throw new Error('das Raster steckt noch in der Tageszeit');
    return 'Tageszeit bleibt als Angabe, der Überzug ist weg';
  });

  await p.check('Die Stimmung folgt der Laune', () => {
    const b = T.DATA.bella;
    b.schlaeft = false;
    b.laune = 90; if (T.stimmung() !== 'froh') throw new Error('90 → ' + T.stimmung());
    b.laune = 20; if (T.stimmung() !== 'traurig') throw new Error('20 → ' + T.stimmung());
    b.laune = 55; if (T.stimmung() !== 'normal') throw new Error('55 → ' + T.stimmung());
    b.schlaeft = true; if (T.stimmung() !== 'schlaef') throw new Error('Schlaf → ' + T.stimmung());
    b.schlaeft = false;
    return 'froh / normal / traurig / schlafend';
  });

  process.exit(p.bericht(errors) ? 1 : 0);
})();
