export interface Team { id: string; name: string; gesamtwert: number; istSpieler: boolean; }
export interface SpielEintrag { id: string; spieltag: number; heimId: string; auswaertsId: string; heimTore: number | null; auswaertsTore: number | null; gespielt: boolean; }
export interface TabellenZeile { teamId: string; name: string; spiele: number; siege: number; unentschieden: number; niederlagen: number; tore: number; gegentore: number; punkte: number; istSpieler: boolean; }
export interface TickerEvent { minute: number; text: string; typ: 'heim' | 'auswaerts' | 'info'; }

export interface LigaDef {
  name: string; teams: number; gesamtwertMin: number; gesamtwertMax: number;
  siegPraemie: number; remisPraemie: number; niederlagePraemie: number;
}

export const LIGEN: LigaDef[] = [
  { name: 'Bronze 3',   teams: 6,  gesamtwertMin: 15,  gesamtwertMax: 30,  siegPraemie: 20,     remisPraemie: 8,      niederlagePraemie: 2 },
  { name: 'Bronze 2',   teams: 6,  gesamtwertMin: 20,  gesamtwertMax: 36,  siegPraemie: 33,     remisPraemie: 13,     niederlagePraemie: 4 },
  { name: 'Bronze 1',   teams: 6,  gesamtwertMin: 26,  gesamtwertMax: 43,  siegPraemie: 55,     remisPraemie: 22,     niederlagePraemie: 7 },
  { name: 'Silber 3',   teams: 8,  gesamtwertMin: 33,  gesamtwertMax: 51,  siegPraemie: 91,     remisPraemie: 36,     niederlagePraemie: 11 },
  { name: 'Silber 2',   teams: 8,  gesamtwertMin: 40,  gesamtwertMax: 59,  siegPraemie: 150,    remisPraemie: 60,     niederlagePraemie: 18 },
  { name: 'Silber 1',   teams: 8,  gesamtwertMin: 47,  gesamtwertMax: 67,  siegPraemie: 250,    remisPraemie: 100,    niederlagePraemie: 30 },
  { name: 'Gold 3',     teams: 10, gesamtwertMin: 54,  gesamtwertMax: 76,  siegPraemie: 420,    remisPraemie: 168,    niederlagePraemie: 50 },
  { name: 'Gold 2',     teams: 10, gesamtwertMin: 62,  gesamtwertMax: 85,  siegPraemie: 690,    remisPraemie: 276,    niederlagePraemie: 83 },
  { name: 'Gold 1',     teams: 10, gesamtwertMin: 70,  gesamtwertMax: 94,  siegPraemie: 1150,   remisPraemie: 460,    niederlagePraemie: 138 },
  { name: 'Platin 3',   teams: 12, gesamtwertMin: 78,  gesamtwertMax: 103, siegPraemie: 1910,   remisPraemie: 764,    niederlagePraemie: 229 },
  { name: 'Platin 2',   teams: 12, gesamtwertMin: 86,  gesamtwertMax: 113, siegPraemie: 3170,   remisPraemie: 1268,   niederlagePraemie: 380 },
  { name: 'Platin 1',   teams: 12, gesamtwertMin: 94,  gesamtwertMax: 122, siegPraemie: 5270,   remisPraemie: 2108,   niederlagePraemie: 632 },
  { name: 'Diamant 3',  teams: 14, gesamtwertMin: 102, gesamtwertMax: 132, siegPraemie: 8750,   remisPraemie: 3500,   niederlagePraemie: 1050 },
  { name: 'Diamant 2',  teams: 14, gesamtwertMin: 111, gesamtwertMax: 142, siegPraemie: 14520,  remisPraemie: 5808,   niederlagePraemie: 1742 },
  { name: 'Diamant 1',  teams: 14, gesamtwertMin: 119, gesamtwertMax: 152, siegPraemie: 24100,  remisPraemie: 9640,   niederlagePraemie: 2892 },
  { name: 'Meister',    teams: 16, gesamtwertMin: 128, gesamtwertMax: 162, siegPraemie: 40000,  remisPraemie: 16000,  niederlagePraemie: 4800 },
];

export const LIGEN_ORDNUNG: string[] = LIGEN.map((l) => l.name);

const CLUB_NAMEN_POOL = [
  'SV Adler', 'FC Blitz', 'TuS Falken', 'SC Panther', 'VfL Wölfe', 'FC Kobra', 'SV Löwen',
  'TSV Nord', 'FC Vulkan', 'SC Union', 'SV Sturm', 'FC Delta', 'TuS Rhein', 'VfB Stahl',
  'SC Nova', 'FC Comet', 'SV Titanen', 'TSV Süd', 'FC Fenix', 'SC Meteor', 'FC Krone',
  'SV Fluss', 'TuS Berg', 'SC Wind', 'VfL Eiche', 'FC Anker', 'SV Grenze', 'TSV Insel',
  'FC Turm', 'SC Brücke', 'SV Kondor', 'FC Rakete', 'TuS Nebel', 'SC Klippe', 'VfB Krater',
];

const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
};

export const generateTeams = (ligaName: string, spielerGesamtwert: number): Team[] => {
  const liga = LIGEN.find((l) => l.name === ligaName) || LIGEN[0];
  const anzahlGegner = liga.teams - 1;
  const min = liga.gesamtwertMin, max = liga.gesamtwertMax, spanne = max - min;
  const namen = shuffle(CLUB_NAMEN_POOL).slice(0, anzahlGegner);
  const gegner: Team[] = namen.map((name, i) => {
    const positionsFaktor = anzahlGegner > 1 ? i / (anzahlGegner - 1) : 0.5;
    const basis = min + spanne * positionsFaktor;
    const rauschen = (Math.random() - 0.5) * spanne * 0.15;
    return { id: `cpu${i + 1}`, name, gesamtwert: Math.max(10, Math.round(basis + rauschen)), istSpieler: false };
  });
  return [{ id: 'spieler', name: 'Mein Verein', gesamtwert: spielerGesamtwert, istSpieler: true }, ...gegner];
};

// Erzeugt einen EINZELNEN Relegations-Gegner aus einer Nachbarliga, mit Staerke passend zur
// gewuenschten Tabellenposition (positionsFaktor 0 = ganz unten der Liga-Spanne, 1 = ganz oben).
export const generateEinzelGegner = (ligaName: string, positionsFaktor: number): Team => {
  const liga = LIGEN.find((l) => l.name === ligaName) || LIGEN[0];
  const spanne = liga.gesamtwertMax - liga.gesamtwertMin;
  const basis = liga.gesamtwertMin + spanne * positionsFaktor;
  const rauschen = (Math.random() - 0.5) * spanne * 0.1;
  const gesamtwert = Math.max(10, Math.round(basis + rauschen));
  const name = CLUB_NAMEN_POOL[Math.floor(Math.random() * CLUB_NAMEN_POOL.length)];
  return { id: 'relegationsgegner', name, gesamtwert, istSpieler: false };
};

export const generateSpielplan = (teams: Team[]): SpielEintrag[] => {
  const ids = teams.map((t) => t.id);
  const n = ids.length;
  const runden: [string, string][][] = [];
  const feste = ids[0];
  let rest = ids.slice(1);
  for (let r = 0; r < n - 1; r++) {
    const rundenPaare: [string, string][] = [];
    const aktuelle = [feste, ...rest];
    for (let i = 0; i < n / 2; i++) {
      const heim = aktuelle[i], auswaerts = aktuelle[n - 1 - i];
      rundenPaare.push(r % 2 === 0 ? [heim, auswaerts] : [auswaerts, heim]);
    }
    runden.push(rundenPaare);
    rest = [rest[rest.length - 1], ...rest.slice(0, rest.length - 1)];
  }
  const spielplan: SpielEintrag[] = [];
  let spieltagZaehler = 1;
  runden.forEach((paare) => { paare.forEach(([heim, auswaerts]) => { spielplan.push({ id: `${spieltagZaehler}-${heim}-${auswaerts}`, spieltag: spieltagZaehler, heimId: heim, auswaertsId: auswaerts, heimTore: null, auswaertsTore: null, gespielt: false }); }); spieltagZaehler++; });
  runden.forEach((paare) => { paare.forEach(([heim, auswaerts]) => { spielplan.push({ id: `${spieltagZaehler}-${auswaerts}-${heim}`, spieltag: spieltagZaehler, heimId: auswaerts, auswaertsId: heim, heimTore: null, auswaertsTore: null, gespielt: false }); }); spieltagZaehler++; });
  return spielplan;
};

export const getSpieltageProSaison = (ligaName: string): number => {
  const liga = LIGEN.find((l) => l.name === ligaName) || LIGEN[0];
  return (liga.teams - 1) * 2;
};

export const simuliereErgebnis = (gesamtwertHeim: number, gesamtwertAuswaerts: number): { heim: number; auswaerts: number } => {
  const heimVorteil = 4;
  const diffHeim = (gesamtwertHeim + heimVorteil - gesamtwertAuswaerts) / 14;
  const erwartetHeim = Math.max(0.3, 1.3 + diffHeim);
  const erwartetAuswaerts = Math.max(0.2, 1.1 - diffHeim);
  const zufallsTore = (erwartung: number) => { let tore = 0; let chance = erwartung; while (Math.random() < Math.min(chance, 0.85) && tore < 9) { tore++; chance *= 0.55; } return tore; };
  return { heim: zufallsTore(erwartetHeim), auswaerts: zufallsTore(erwartetAuswaerts) };
};

export const generateTickerEvents = (heimName: string, auswaertsName: string, heimTore: number, auswaertsTore: number): TickerEvent[] => {
  const events: TickerEvent[] = [];
  const belegteMinuten = new Set<number>();
  const zieheMinute = () => { let m = Math.floor(Math.random() * 88) + 2; while (belegteMinuten.has(m)) m = Math.floor(Math.random() * 88) + 2; belegteMinuten.add(m); return m; };
  const torTexte = ['⚽ TOOOR!', '⚽ Eingenetzt!', '⚽ Da ist der Ball drin!', '⚽ Was für ein Treffer!'];
  for (let i = 0; i < heimTore; i++) events.push({ minute: zieheMinute(), text: `${torTexte[Math.floor(Math.random() * torTexte.length)]} ${heimName} trifft!`, typ: 'heim' });
  for (let i = 0; i < auswaertsTore; i++) events.push({ minute: zieheMinute(), text: `${torTexte[Math.floor(Math.random() * torTexte.length)]} ${auswaertsName} trifft!`, typ: 'auswaerts' });
  const fillerTexte = ['Guter Spielzug, aber ohne Erfolg.', 'Der Schiedsrichter pfeift ein Foul ab.', 'Ecke für die Gastgeber.', 'Starke Parade des Torwarts!', 'Die Fans feuern ihr Team an.', 'Gelbe Karte nach hartem Einsteigen.', 'Beide Teams kämpfen um jeden Ball.', 'Der Trainer gibt Anweisungen von der Seitenlinie.'];
  const anzahlFiller = 6 + Math.floor(Math.random() * 4);
  for (let i = 0; i < anzahlFiller; i++) events.push({ minute: zieheMinute(), text: fillerTexte[Math.floor(Math.random() * fillerTexte.length)], typ: 'info' });
  events.push({ minute: 1, text: 'Anpfiff! Das Spiel läuft.', typ: 'info' });
  events.push({ minute: 90, text: 'Abpfiff! Das Spiel ist beendet.', typ: 'info' });
  return events.sort((a, b) => a.minute - b.minute);
};

export const berechneTabelle = (teams: Team[], spielplan: SpielEintrag[]): TabellenZeile[] => {
  const tabelle: Record<string, TabellenZeile> = {};
  teams.forEach((t) => { tabelle[t.id] = { teamId: t.id, name: t.name, spiele: 0, siege: 0, unentschieden: 0, niederlagen: 0, tore: 0, gegentore: 0, punkte: 0, istSpieler: t.istSpieler }; });
  spielplan.filter((s) => s.gespielt).forEach((s) => {
    const heim = tabelle[s.heimId], auswaerts = tabelle[s.auswaertsId];
    if (!heim || !auswaerts || s.heimTore === null || s.auswaertsTore === null) return;
    heim.spiele++; auswaerts.spiele++; heim.tore += s.heimTore; heim.gegentore += s.auswaertsTore; auswaerts.tore += s.auswaertsTore; auswaerts.gegentore += s.heimTore;
    if (s.heimTore > s.auswaertsTore) { heim.siege++; heim.punkte += 3; auswaerts.niederlagen++; }
    else if (s.heimTore < s.auswaertsTore) { auswaerts.siege++; auswaerts.punkte += 3; heim.niederlagen++; }
    else { heim.unentschieden++; auswaerts.unentschieden++; heim.punkte++; auswaerts.punkte++; }
  });
  return Object.values(tabelle).sort((a, b) => { if (b.punkte !== a.punkte) return b.punkte - a.punkte; const diffB = b.tore - b.gegentore, diffA = a.tore - a.gegentore; if (diffB !== diffA) return diffB - diffA; return b.tore - a.tore; });
};