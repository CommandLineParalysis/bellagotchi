/* Bellagotchi darf Erinnerungen schicken — und zwar so, dass die
   Erlaubnis nach einem frischen `cap add android` wieder im Manifest
   steht. Die Liste kommt aus der package.json dieser App, nicht aus dem
   gemeinsamen Skript: keine andere B-App soll benachrichtigen dürfen. */

const path = require('path');
const { patchManifest, extraPermissions } =
  require('@bappiverse/scaffold/scripts/android-permissions');
const { pruefliste } = require('@bappiverse/scaffold/test/harness');

const WURZEL = path.join(__dirname, '..');
const ROH = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application android:label="Bellagotchi">
    </application>
    <uses-permission android:name="android.permission.INTERNET" />
</manifest>`;

(async () => {
  const p = pruefliste('Bellagotchi — Berechtigungen');

  await p.check('Die App darf benachrichtigen', () => {
    const namen = extraPermissions(WURZEL).join(' ');
    if (!/POST_NOTIFICATIONS/.test(namen)) throw new Error('fehlt in der package.json');
    return 'POST_NOTIFICATIONS';
  });

  await p.check('Die Erlaubnis landet im Manifest', () => {
    const { xml } = patchManifest(ROH, extraPermissions(WURZEL));
    if (!/POST_NOTIFICATIONS/.test(xml)) throw new Error('nicht eingetragen');
  });

  await p.check('Die Kamera kommt aus der gemeinsamen Liste', () => {
    const { xml } = patchManifest(ROH, extraPermissions(WURZEL));
    if (!/permission.CAMERA/.test(xml)) throw new Error('Kamera fehlt');
  });

  await p.check('INTERNET fliegt raus', () => {
    const { xml } = patchManifest(ROH, extraPermissions(WURZEL));
    if (/permission.INTERNET/.test(xml)) throw new Error('Netzberechtigung blieb stehen');
    return 'offline heißt offline';
  });

  await p.check('largeHeap ist gesetzt', () => {
    const { xml } = patchManifest(ROH, extraPermissions(WURZEL));
    if (!/android:largeHeap="true"/.test(xml)) throw new Error('nicht gesetzt');
  });

  await p.check('Zweiter Durchlauf ändert nichts mehr', () => {
    const einmal = patchManifest(ROH, extraPermissions(WURZEL));
    const zweimal = patchManifest(einmal.xml, extraPermissions(WURZEL));
    if (zweimal.changes.length) throw new Error(zweimal.changes.join(', '));
    return 'gefahrlos in npm run sync';
  });

  await p.check('Ohne Zusatzliste bleibt die Erlaubnis draußen', () => {
    const { xml } = patchManifest(ROH, []);
    if (/POST_NOTIFICATIONS/.test(xml)) throw new Error('Standort ungefragt eingetragen');
    return 'je App, nicht für alle';
  });

  await p.check('Fremde Datei wird abgewiesen', () => {
    try { patchManifest('<html></html>', []); }
    catch (e) { return 'Fehler "' + e.message.slice(0, 30) + '…"'; }
    throw new Error('durchgelassen');
  });

  process.exit(p.bericht() ? 1 : 0);
})();
