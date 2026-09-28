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
                     'LIEFERSTUNDE','BADEZUSAETZE','BETTZEUG','BADSPIELZEUG','buehneMasse']);

  const tab = r => $$('#nav .tab').find(t => t.dataset.raum === r);
  const taste = text => $$('#tasten .taste').find(t => t.textContent === text);

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
    click(tab('bad'));
    await wait(20);
    click(taste('EINSCHÄUMEN'));
    await wait(30);
    click(taste('ABBRAUSEN'));
    await wait(30);
    click(tab('wohnen'));
    await wait(20);
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
    click(tab('kueche'));
    await wait(20);
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

  /* --- Reden --- */

  await p.check('Reden hebt die Laune', async () => {
    T.DATA.bella.laune = 40;
    click(tab('wohnen'));
    await wait(20);
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

  await p.check('Kleid wechseln steckt hinter dem Anziehen-Knopf', async () => {
    click(tab('schrank'));
    await wait(20);
    if ($$('#extra .stueck').length) throw new Error('Kleiderwahl steht offen unter dem Raum');
    click(taste('ANZIEHEN'));
    await wait(30);
    const anders = T.DATA.besitz.kleider.find(k => k !== T.DATA.outfit.kleid);
    click($$('#modalblatt .stueck').find(b => b.dataset.wahl === anders));
    await wait(40);
    if (T.DATA.outfit.kleid !== anders) throw new Error('Outfit: ' + T.DATA.outfit.kleid);
    click($('#modalblatt .schliessen'));
    await wait(20);
    return T.KLEIDER[anders].name;
  });

  await p.check('Einrichten steckt hinter dem Stift und gilt je Raum', async () => {
    // Unter keinem Raum darf die Farbtafel offen stehen.
    for (const r of ['schlaf','kueche','wohnen','bad','schrank']){
      click(tab(r));
      await wait(20);
      const offen = $$('#extra .stueck').filter(b => b.dataset.wahl);
      if (offen.length) throw new Error('Farbtafel offen in ' + r);
    }
    click(tab('schrank'));
    await wait(20);
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
    T.DATA.bella.schlaeft = false;
    T.DATA.bella.sauber = 20;
    click(tab('bad'));
    await wait(25);
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
    if (T.state.schaum) throw new Error('Schaum blieb');
    if (T.DATA.bella.sauber < 60) throw new Error('nicht sauber: ' + T.DATA.bella.sauber);
    return 'einschäumen → abbrausen, sauber ' + Math.round(T.DATA.bella.sauber);
  });

  await p.check('Der Schaum bleibt nicht am Raumwechsel hängen', async () => {
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
    click(tab('bad'));
    await wait(25);
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

  /* --- Schlafnische --- */

  await p.check('Zudecken schaltet einen sichtbaren Zustand', async () => {
    click(tab('schlaf'));
    await wait(25);
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
    T.DATA.vorrat.honig = 0;
    click(tab('kueche'));
    await wait(25);
    click(taste('BESTELLEN'));
    await wait(30);
    click($$('#bestellgitter .stueck').find(b => b.dataset.bestell === 'honig'));
    await wait(25);
    click($('#bestellen'));
    await wait(40);
    if (!T.DATA.bestellung) throw new Error('nichts bestellt');
    if (T.DATA.vorrat.honig !== 0) throw new Error('sofort geliefert');
    const liefert = new Date(T.DATA.bestellung.liefert);
    if (liefert.getHours() !== T.LIEFERSTUNDE) throw new Error('Lieferstunde: ' + liefert.getHours());
    if (!(liefert > new Date())) throw new Error('Lieferung liegt in der Vergangenheit');
    return 'Honig, geliefert ' + liefert.toLocaleDateString('de') + ' um ' + T.LIEFERSTUNDE + ':00';
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

  await p.check('Nur eine Bestellung auf einmal', async () => {
    T.DATA.bestellung = { liefert: T.lieferzeit(new Date()).toISOString(), waren: { mehl: 1 } };
    T.render();
    await wait(25);
    if (!taste('BESTELLT')) throw new Error('zweite Bestellung möglich');
    T.DATA.bestellung = null;
    return 'der Knopf zeigt den Stand statt neu zu bestellen';
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
    const gabe = T.DATA.post.find(g => g.art === 'kleid' || g.art === 'wand' || g.art === 'haar' || g.art === 'boden');
    if (!gabe) throw new Error('nur Zutaten in der Post');
    const topf = { kleid:'kleider', haar:'haare', wand:'waende', boden:'boeden' }[gabe.art];
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
      outfit: { kleid:'minzgruen', haar:'mint' },
      zeiten: { einschlafen:'01:00', aufwachen:'09:15' },
      vorrat: { erdbeere: 5 },
      kochbuch: ['shake','gibtsnicht'],
      besitz: { kleider:['minzgruen'], haare:['mint'] },
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
      outfit: { kleid:'tarnfarbe', haar:'neon' },
      zeiten: { einschlafen:'25:99', aufwachen:'morgens' },
      besitz: { kleider:['gibtsnicht'] },
    });
    if (v.bella.name !== 'Bella') throw new Error('Name: ' + v.bella.name);
    if (v.bella.laune !== 0) throw new Error('Laune: ' + v.bella.laune);
    if (v.bella.ausgeruht !== 100) throw new Error('Ausgeruht: ' + v.bella.ausgeruht);
    if (v.outfit.kleid !== 'rosenrot') throw new Error('Kleid: ' + v.outfit.kleid);
    if (v.zeiten.einschlafen !== '02:30') throw new Error('Zeit: ' + v.zeiten.einschlafen);
    if (!v.besitz.kleider.includes('rosenrot')) throw new Error('Besitz leer');
    return 'alles auf gültige Werte';
  });

  await p.check('Was man trägt, besitzt man auch', () => {
    const v = T.adoptVault({ outfit:{ kleid:'lavendel', haar:'nacht' },
                             besitz:{ kleider:['rosenrot'], haare:['beere'] } });
    if (!v.besitz.kleider.includes('lavendel')) throw new Error('Kleid fehlt im Besitz');
    if (!v.besitz.haare.includes('nacht')) throw new Error('Haare fehlen im Besitz');
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

  await p.check('Die Tageszeit färbt den Raum', () => {
    const mittag = T.tageszeit(new Date(2026, 0, 5, 12, 0));
    const nacht  = T.tageszeit(new Date(2026, 0, 5, 23, 0));
    const tief   = T.tageszeit(new Date(2026, 0, 5, 3, 0));
    if (mittag.dichte !== 0) throw new Error('Mittag ist eingefärbt');
    if (!(nacht.dichte > 0 && tief.dichte > nacht.dichte)) throw new Error('Nacht nicht dunkler');
    return 'Mittag klar, Nacht ' + nacht.dichte + '/16, tiefe Nacht ' + tief.dichte + '/16';
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
