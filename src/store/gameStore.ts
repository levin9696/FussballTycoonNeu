import { REDEEM_CODES } from '../config/RedeemCodes';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Team, SpielEintrag, TickerEvent, LIGEN, LIGEN_ORDNUNG,
  generateTeams, generateSpielplan, getSpieltageProSaison, generateEinzelGegner,
  simuliereErgebnis, generateTickerEvents, berechneTabelle,
} from '../utils/ligaSystem';

export interface Player {
  id: string; name: string; country: string; flag: string; rating: number;
  position: 'ST' | 'MF' | 'DF' | 'TW';
  rarity: { name: string; color: string; effect: string; sellPrice: number };
}

interface NationPool { flag: string; first: string[]; last: string[]; }

const NAME_POOL: Record<string, NationPool> = {
  Deutschland: { flag: '🇩🇪', first: ['Lukas', 'Maximilian', 'Finn', 'Leon', 'Jonas', 'Ben', 'Felix', 'Elias', 'Noah', 'Paul', 'Julian', 'Tim', 'Mats', 'Niklas', 'Bastian', 'Thomas', 'Manuel', 'Florian', 'Alexander', 'Sebastian'], last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Neumann', 'Korell', 'Lange', 'Zimmermann'] },
  Österreich: { flag: '🇦🇹', first: ['David', 'Tobias', 'Marcel', 'Jakob', 'Sebastian', 'Konrad'], last: ['Gruber', 'Huber', 'Pfeifer', 'Hofer', 'Pichler', 'Alaba'] },
  Schweiz: { flag: '🇨🇭', first: ['Yann', 'Granit', 'Xherdan', 'Nico', 'Silvan', 'Remo'], last: ['Sommer', 'Akanji', 'Elvedi', 'Freuler', 'Xhaka', 'Shaqiri'] },
  Japan: { flag: '🇯🇵', first: ['Takumi', 'Daichi', 'Wataru', 'Kaoru', 'Takefusa', 'Kyogo', 'Hiroki', 'Shoya'], last: ['Kamada', 'Mitoma', 'Kubo', 'Endo', 'Furuhashi', 'Minamino', 'Sakai', 'Tomiyasu'] },
  Südkorea: { flag: '🇰🇷', first: ['Heung-min', 'Min-jae', 'Kang-in', 'Gue-sung', 'Hee-chan'], last: ['Son', 'Kim', 'Lee', 'Cho', 'Hwang'] },
  England: { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', first: ['Harry', 'Jude', 'Bukayo', 'Phil', 'Declan', 'Jack', 'Marcus', 'Trent', 'Ollie'], last: ['Kane', 'Bellingham', 'Saka', 'Foden', 'Rice', 'Grealish', 'Rashford', 'Alexander-Arnold', 'Watkins'] },
  Frankreich: { flag: '🇫🇷', first: ['Kylian', 'Antoine', 'Ousmane', 'Aurélien', 'Eduardo', 'Dayot', 'Kingsley'], last: ['Mbappé', 'Griezmann', 'Dembélé', 'Tchouaméni', 'Camavinga', 'Upamecano', 'Coman'] },
  Brasilien: { flag: '🇧🇷', first: ['Vinícius', 'Rodrygo', 'Neymar', 'Gabriel', 'Casemiro', 'Bruno', 'Lucas'], last: ['Júnior', 'Silva', 'Guimarães', 'Paquetá', 'Jesus', 'Marquinhos', 'Alisson'] },
  USA: { flag: '🇺🇸', first: ['Christian', 'Weston', 'Timothy', 'Tyler', 'Gio', 'Antonee', 'Folarin'], last: ['Pulisic', 'McKennie', 'Weah', 'Adams', 'Reyna', 'Robinson', 'Balogun'] }
};

export interface PackDef {
  id: string; name: string; emoji: string; ligaIndex: number; basePreis: number; growthProKauf: number;
  min: number; max: number; chances: number[]; garantieRating: number;
}

export const getRarityByRating = (rating: number) => {
  if (rating >= 180) return { name: 'Ultimativ', color: '#ffffff', effect: 'ultimate', sellPrice: 2000000 };
  if (rating >= 140) return { name: 'Göttlich', color: '#ffd700', effect: 'divine', sellPrice: 500000 };
  if (rating >= 115) return { name: 'Universal', color: '#4a9eff', effect: 'intense', sellPrice: 150000 };
  if (rating >= 95) return { name: 'Rainbow', color: '#ff6b6b', effect: 'rainbow', sellPrice: 40000 };
  if (rating >= 80) return { name: 'Legende', color: '#f5a623', effect: 'gold', sellPrice: 12000 };
  if (rating >= 68) return { name: 'Mythisch', color: '#e74c3c', effect: 'pulse', sellPrice: 3500 };
  if (rating >= 55) return { name: 'Episch', color: '#9c27b0', effect: 'glow', sellPrice: 1000 };
  if (rating >= 42) return { name: 'Selten', color: '#2196f3', effect: 'shimmer', sellPrice: 300 };
  if (rating >= 30) return { name: 'Ungewöhnlich', color: '#4caf50', effect: 'light', sellPrice: 80 };
  return { name: 'Gewöhnlich', color: '#8d8d8d', effect: 'none', sellPrice: 20 };
};

const POSITION_WEIGHTS: Array<{ pos: 'ST' | 'MF' | 'DF' | 'TW'; weight: number }> = [
  { pos: 'DF', weight: 0.293 }, { pos: 'MF', weight: 0.293 }, { pos: 'ST', weight: 0.293 }, { pos: 'TW', weight: 0.121 },
];
const zieheGewichtetePosition = (): 'ST' | 'MF' | 'DF' | 'TW' => {
  const r = Math.random(); let cum = 0;
  for (const { pos, weight } of POSITION_WEIGHTS) { cum += weight; if (r <= cum) return pos; }
  return 'ST';
};

export const generateRandomPlayer = (forcedRating: number): Omit<Player, 'id'> => {
  const position = zieheGewichtetePosition();
  const laender = Object.keys(NAME_POOL);
  const gewähltesLand = Math.random() > 0.5 ? 'Deutschland' : laender[Math.floor(Math.random() * laender.length)];
  const pool = NAME_POOL[gewähltesLand];
  const vorname = pool.first[Math.floor(Math.random() * pool.first.length)];
  const nachname = pool.last[Math.floor(Math.random() * pool.last.length)];
  const rarity = getRarityByRating(forcedRating);
  return { name: `${vorname} ${nachname}`, country: gewähltesLand, flag: pool.flag, rating: forcedRating, position, rarity };
};

export const FORMATIONS = {
  '4-3-3': { DF: ['DF1', 'DF2', 'DF3', 'DF4'], MF: ['MF1', 'MF2', 'MF3'], ST: ['ST1', 'ST2', 'ST3'] },
  '4-4-2': { DF: ['DF1', 'DF2', 'DF3', 'DF4'], MF: ['MF1', 'MF2', 'MF3', 'MF4'], ST: ['ST1', 'ST2'] },
  '3-4-3': { DF: ['DF1', 'DF2', 'DF3'], MF: ['MF1', 'MF2', 'MF3', 'MF4'], ST: ['ST1', 'ST2', 'ST3'] },
  '3-5-2': { DF: ['DF1', 'DF2', 'DF3'], MF: ['MF1', 'MF2', 'MF3', 'MF4', 'MF5'], ST: ['ST1', 'ST2'] },
  '5-3-2': { DF: ['DF1', 'DF2', 'DF3', 'DF4', 'DF5'], MF: ['MF1', 'MF2', 'MF3'], ST: ['ST1', 'ST2'] },
};
export type FormationType = keyof typeof FORMATIONS;

export const getBenoetigteSlots = (formation: FormationType): string[] => {
  const config = FORMATIONS[formation];
  return ['TW1', ...config.DF, ...config.MF, ...config.ST];
};
export const istAufstellungKomplett = (aufstellungSlots: Record<string, Player | null>, formation: FormationType): boolean =>
  getBenoetigteSlots(formation).every((s) => !!aufstellungSlots[s]);

export const berechneGesamtwert = (aufstellungSlots: Record<string, Player | null>, formation: FormationType): number => {
  const slots = getBenoetigteSlots(formation);
  const FUELLWERT = 15;
  const summe = slots.reduce((acc, s) => acc + (aufstellungSlots[s]?.rating ?? FUELLWERT), 0);
  return Math.round(summe / slots.length);
};

// ============ GROSSE-ZAHLEN FORMATIERUNG ============
export const formatGeld = (x: number): string => {
  const einheiten = [
    { wert: 1e15, suffix: 'Billiarden' }, { wert: 1e12, suffix: 'Billionen' },
    { wert: 1e9, suffix: 'Milliarden' }, { wert: 1e6, suffix: 'Millionen' }, { wert: 1e3, suffix: 'Tsd.' },
  ];
  for (const e of einheiten) {
    if (Math.abs(x) >= e.wert) return `${(x / e.wert).toLocaleString('de-DE', { maximumFractionDigits: 2 })} ${e.suffix} €`;
  }
  return `${Math.round(x).toLocaleString('de-DE')} €`;
};

// ============ UPGRADE-VERDOPPLUNG (alle 50 Stufen x2 Bonus) ============
export const UPGRADE_STUFEN_INTERVALL = 50;
export const getUpgradeMultiplikator = (count: number): number => Math.pow(2, Math.floor(count / UPGRADE_STUFEN_INTERVALL));
export const getUpgradeStufenProgress = (count: number): { stufe: number; inStufe: number; benoetigt: number } => ({
  stufe: Math.floor(count / UPGRADE_STUFEN_INTERVALL),
  inStufe: count % UPGRADE_STUFEN_INTERVALL,
  benoetigt: UPGRADE_STUFEN_INTERVALL,
});

// ============ PASSIVE UPGRADES (18, Liga-gated) ============
export interface UpgradeDef { id: string; name: string; basePrice: number; bonus: number; growth: number; minLigaIndex: number; }

export const UPGRADES: UpgradeDef[] = [
  { id: 'bratwurst', name: '🌭 Bratwurstbude', basePrice: 26, bonus: 0.35, growth: 1.055, minLigaIndex: 0 },
  { id: 'bandenwerbung', name: '📣 Bandenwerbung', basePrice: 88, bonus: 0.73, growth: 1.061, minLigaIndex: 0 },
  { id: 'jugendtrainer', name: '👨‍🏫 Jugendtrainer', basePrice: 296, bonus: 1.54, growth: 1.067, minLigaIndex: 1 },
  { id: 'talentscout', name: '🕵️‍♂️ Talentscout', basePrice: 996, bonus: 3.24, growth: 1.073, minLigaIndex: 2 },
  { id: 'flutlicht', name: '💡 Flutlicht', basePrice: 3346, bonus: 6.81, growth: 1.079, minLigaIndex: 2 },
  { id: 'mannschaftsbus', name: '🚌 Mannschaftsbus', basePrice: 11242, bonus: 14.29, growth: 1.085, minLigaIndex: 3 },
  { id: 'vereinsheim', name: '🏛️ Vereinsheim', basePrice: 37772, bonus: 30.02, growth: 1.091, minLigaIndex: 4 },
  { id: 'trainingszentrum', name: '🏋️ Trainingszentrum', basePrice: 126912, bonus: 63.04, growth: 1.097, minLigaIndex: 5 },
  { id: 'rasenheizung', name: '🌡️ Rasenheizung', basePrice: 426426, bonus: 132.38, growth: 1.103, minLigaIndex: 6 },
  { id: 'videoanalyse', name: '📹 Video-Analyse-Zentrum', basePrice: 1432791, bonus: 278.00, growth: 1.109, minLigaIndex: 7 },
  { id: 'akademie', name: '🎓 Akademie', basePrice: 4814177, bonus: 583.80, growth: 1.115, minLigaIndex: 8 },
  { id: 'scoutingai', name: '🤖 Scouting-Software AI', basePrice: 16175636, bonus: 1225.97, growth: 1.121, minLigaIndex: 9 },
  { id: 'privatjet', name: '✈️ Privatjet', basePrice: 54350136, bonus: 2574.54, growth: 1.127, minLigaIndex: 10 },
  { id: 'sportwissenschaft', name: '🔬 Sportwissenschaft-Zentrum', basePrice: 182616457, bonus: 5406.53, growth: 1.133, minLigaIndex: 11 },
  { id: 'scoutingnetzwerk', name: '🌍 Globales Scouting-Netzwerk', basePrice: 613591297, bonus: 11353.72, growth: 1.139, minLigaIndex: 12 },
  { id: 'trainingscampus', name: '🏟️ Mega-Trainingscampus', basePrice: 2061666758, bonus: 23842.81, growth: 1.145, minLigaIndex: 13 },
  { id: 'flugzeugflotte', name: '🛩️ Vereins-Flugzeugflotte', basePrice: 6927200309, bonus: 50069.90, growth: 1.151, minLigaIndex: 14 },
  { id: 'singularitaet', name: '♾️ Fußball-Singularität', basePrice: 23275393037, bonus: 105146.80, growth: 1.157, minLigaIndex: 15 },
];

// ============ MATCHDAY-UPGRADES (10, Liga-gated, Verdopplung ebenfalls alle 50 Stufen) ============
export interface MatchdayUpgradeDef { id: string; name: string; type: 'kapazitaet' | 'umsatzProZuschauer'; basePrice: number; wert: number; growth: number; minLigaIndex: number; }

export const MATCHDAY_UPGRADES: MatchdayUpgradeDef[] = [
  { id: 'tribuene_a', name: '🏟️ Tribüne A', type: 'kapazitaet', basePrice: 1100, wert: 90, growth: 1.12, minLigaIndex: 0 },
  { id: 'bratwurst_spieltag', name: '🌭 Bratwurstbude (Spieltag)', type: 'umsatzProZuschauer', basePrice: 90, wert: 0.4, growth: 1.10, minLigaIndex: 0 },
  { id: 'tribuene_b', name: '🏟️ Tribüne B', type: 'kapazitaet', basePrice: 1800, wert: 150, growth: 1.13, minLigaIndex: 2 },
  { id: 'fanshop', name: '🎽 Fanshop', type: 'umsatzProZuschauer', basePrice: 170, wert: 1.3, growth: 1.11, minLigaIndex: 3 },
  { id: 'ueberdachung', name: '🏟️ Überdachte Tribüne', type: 'kapazitaet', basePrice: 2900, wert: 240, growth: 1.14, minLigaIndex: 5 },
  { id: 'bierstand', name: '🍺 Bierstand', type: 'umsatzProZuschauer', basePrice: 340, wert: 2.2, growth: 1.12, minLigaIndex: 7 },
  { id: 'arena_ausbau', name: '🏟️ Arena-Ausbau', type: 'kapazitaet', basePrice: 4900, wert: 410, growth: 1.15, minLigaIndex: 8 },
  { id: 'vip_logen', name: '🥂 VIP-Logen', type: 'umsatzProZuschauer', basePrice: 650, wert: 3.1, growth: 1.13, minLigaIndex: 10 },
  { id: 'mega_arena', name: '🏟️ Mega-Arena', type: 'kapazitaet', basePrice: 8200, wert: 680, growth: 1.16, minLigaIndex: 12 },
  { id: 'business_lounge', name: '💼 Business-Lounge', type: 'umsatzProZuschauer', basePrice: 1300, wert: 4.0, growth: 1.14, minLigaIndex: 13 },
];

const BASIS_KAPAZITAET = 150;
const BASIS_UMSATZ_PRO_ZUSCHAUER = 2;

// ============ PACKS (18, jetzt mit growthProKauf -> Preis steigt bei Wiederholungskauf) ============
export interface PackDef {
  id: string; name: string; emoji: string; ligaIndex: number; basePreis: number; growthProKauf: number;
  min: number; max: number; chances: number[];
}

export const PACKS: PackDef[] = [
  { id: 'bolzplatz', name: 'Bolzplatz-Pack', emoji: '🥅', ligaIndex: 0, basePreis: 150, growthProKauf: 1.35, min: 20, max: 35, chances: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0], garantieRating: 20 },
  { id: 'kiez', name: 'Kiez-Pack', emoji: '🏘️', ligaIndex: 0, basePreis: 450, growthProKauf: 1.35, min: 20, max: 48, chances: [80, 20, 0, 0, 0, 0, 0, 0, 0, 0], garantieRating: 20 },
  { id: 'kreisel', name: 'Kreisel-Pack', emoji: '🌀', ligaIndex: 0, basePreis: 1200, growthProKauf: 1.35, min: 20, max: 62, chances: [73.6, 20.6, 5.8, 0, 0, 0, 0, 0, 0, 0], garantieRating: 20 },
  { id: 'aufstiegs', name: 'Aufstiegs-Pack', emoji: '📈', ligaIndex: 1, basePreis: 3500, growthProKauf: 1.35, min: 20, max: 78, chances: [70.6, 21.2, 6.4, 1.9, 0, 0, 0, 0, 0, 0], garantieRating: 20 },
  { id: 'fokus', name: 'Fokus-Pack', emoji: '🎯', ligaIndex: 2, basePreis: 18600, growthProKauf: 1.35, min: 30, max: 78, chances: [0, 70.3, 22.5, 7.2, 0, 0, 0, 0, 0, 0], garantieRating: 42 },
  { id: 'ambitions', name: 'Ambitions-Pack', emoji: '🔥', ligaIndex: 3, basePreis: 98800, growthProKauf: 1.35, min: 30, max: 92, chances: [0, 66.9, 22.7, 7.7, 2.6, 0, 0, 0, 0, 0], garantieRating: 55 },
  { id: 'adrenalin', name: 'Adrenalin-Pack', emoji: '⚡', ligaIndex: 4, basePreis: 525000, growthProKauf: 1.35, min: 42, max: 92, chances: [0, 0, 67.9, 23.8, 8.3, 0, 0, 0, 0, 0], garantieRating: 68 },
  { id: 'fusion', name: 'Fusion-Pack', emoji: '🌐', ligaIndex: 5, basePreis: 2790000, growthProKauf: 1.35, min: 42, max: 108, chances: [0, 0, 64.2, 23.8, 8.8, 3.3, 0, 0, 0, 0], garantieRating: 68 },
  { id: 'prestige', name: 'Prestige-Pack', emoji: '💎', ligaIndex: 6, basePreis: 14820000, growthProKauf: 1.35, min: 55, max: 108, chances: [0, 0, 0, 65.6, 24.9, 9.5, 0, 0, 0, 0], garantieRating: 80 },
  { id: 'elite', name: 'Elite-Pack', emoji: '⭐', ligaIndex: 7, basePreis: 78740000, growthProKauf: 1.35, min: 55, max: 125, chances: [0, 0, 0, 61.6, 24.6, 9.9, 3.9, 0, 0, 0], garantieRating: 80 },
  { id: 'titan', name: 'Titan-Pack', emoji: '🗿', ligaIndex: 8, basePreis: 418330000, growthProKauf: 1.35, min: 68, max: 125, chances: [0, 0, 0, 0, 63.4, 26.0, 10.7, 0, 0, 0], garantieRating: 95 },
  { id: 'phoenix', name: 'Phoenix-Pack', emoji: '🔥', ligaIndex: 9, basePreis: 2223000000, growthProKauf: 1.35, min: 68, max: 150, chances: [0, 0, 0, 0, 59.9, 25.1, 10.6, 4.4, 0, 0], garantieRating: 95 },
  { id: 'galaxie', name: 'Galaxie-Pack', emoji: '🌌', ligaIndex: 10, basePreis: 11809000000, growthProKauf: 1.35, min: 80, max: 150, chances: [0, 0, 0, 0, 0, 61.2, 26.9, 11.9, 0, 0], garantieRating: 115 },
  { id: 'zenit', name: 'Zenit-Pack', emoji: '☀️', ligaIndex: 11, basePreis: 62744000000, growthProKauf: 1.35, min: 80, max: 190, chances: [0, 0, 0, 0, 0, 56.5, 26.0, 12.0, 5.5, 0], garantieRating: 115 },
  { id: 'kosmos', name: 'Kosmos-Pack', emoji: '🌠', ligaIndex: 12, basePreis: 333365000000, growthProKauf: 1.35, min: 95, max: 190, chances: [0, 0, 0, 0, 0, 0, 58.5, 28.1, 13.5, 0], garantieRating: 140 },
  { id: 'olymp', name: 'Olymp-Pack', emoji: '🏛️', ligaIndex: 13, basePreis: 1771209000000, growthProKauf: 1.35, min: 95, max: 250, chances: [0, 0, 0, 0, 0, 0, 53.3, 26.7, 13.3, 6.7], garantieRating: 140 },
  { id: 'legenden', name: 'Legenden-Pack', emoji: '👑', ligaIndex: 14, basePreis: 9410655000000, growthProKauf: 1.35, min: 115, max: 250, chances: [0, 0, 0, 0, 0, 0, 0, 54.0, 29.7, 16.3], garantieRating: 180 },
  { id: 'unendlichkeit', name: 'Unendlichkeits-Pack', emoji: '♾️', ligaIndex: 15, basePreis: 50000000000000, growthProKauf: 1.35, min: 140, max: 250, chances: [0, 0, 0, 0, 0, 0, 0, 0, 60.6, 39.4], garantieRating: 180 },
];

export const RARITY_INTERVALS = [
  { min: 20, max: 35 }, { min: 30, max: 48 }, { min: 42, max: 62 }, { min: 55, max: 78 }, { min: 68, max: 92 },
  { min: 80, max: 108 }, { min: 95, max: 125 }, { min: 115, max: 150 }, { min: 140, max: 190 }, { min: 180, max: 250 },
];

export const getPackPreis = (pack: PackDef, _anzahlGekauft: number): number =>
  pack.basePreis

// ============ SPONSOREN (12) ============
export interface SponsorDef { id: string; ligaIndex: number; name: string; benoetigteFans: number; antrittspraemie: number; bonusProSekunde: number; }

export const SPONSOREN: SponsorDef[] = [
  { id: 'sp1a', ligaIndex: 2, name: 'Dorfbäckerei Krümel', benoetigteFans: 300, antrittspraemie: 540, bonusProSekunde: 0.07 },
  { id: 'sp1b', ligaIndex: 2, name: 'Getränkemarkt Frisch', benoetigteFans: 930, antrittspraemie: 1670, bonusProSekunde: 0.23 },
  { id: 'sp2a', ligaIndex: 5, name: 'Autohaus Mustermann', benoetigteFans: 2910, antrittspraemie: 5240, bonusProSekunde: 0.73 },
  { id: 'sp2b', ligaIndex: 5, name: 'Elektronik-Kette VoltPlus', benoetigteFans: 9060, antrittspraemie: 16310, bonusProSekunde: 2.27 },
  { id: 'sp3a', ligaIndex: 8, name: 'Regionalbank Nordkreis', benoetigteFans: 28200, antrittspraemie: 50760, bonusProSekunde: 7.05 },
  { id: 'sp3b', ligaIndex: 8, name: 'Versicherung SicherPlus', benoetigteFans: 87800, antrittspraemie: 158040, bonusProSekunde: 21.95 },
  { id: 'sp4a', ligaIndex: 11, name: 'Reisebüro Horizon', benoetigteFans: 273360, antrittspraemie: 492050, bonusProSekunde: 68.34 },
  { id: 'sp4b', ligaIndex: 11, name: 'Sportartikel-Riese Vento', benoetigteFans: 851160, antrittspraemie: 1532090, bonusProSekunde: 212.79 },
  { id: 'sp5a', ligaIndex: 14, name: 'Streaming-Dienst PlayNow', benoetigteFans: 2650000, antrittspraemie: 4770000, bonusProSekunde: 662.50 },
  { id: 'sp5b', ligaIndex: 14, name: 'Automobilkonzern MotorCorp', benoetigteFans: 8252000, antrittspraemie: 14853600, bonusProSekunde: 2063.00 },
  { id: 'sp6a', ligaIndex: 15, name: 'Galaktisches Konsortium', benoetigteFans: 25693000, antrittspraemie: 46247400, bonusProSekunde: 6423.25 },
  { id: 'sp6b', ligaIndex: 15, name: 'Interkontinental-Empire', benoetigteFans: 80000000, antrittspraemie: 144000000, bonusProSekunde: 20000.00 },
];

export interface KampagneDef { id: string; name: string; preis: number; hypeBoost: number; fansBoost: number; cooldownMs: number; icon: string; }
export const KAMPAGNEN: KampagneDef[] = [
  { id: 'social_media', name: 'Social-Media-Kampagne', preis: 500, hypeBoost: 8, fansBoost: 15, cooldownMs: 10 * 60 * 1000, icon: '📱' },
  { id: 'werbung', name: 'Werbekampagne', preis: 5000, hypeBoost: 20, fansBoost: 60, cooldownMs: 45 * 60 * 1000, icon: '📣' },
];

export const CLICK_WERTE = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987];
export const CLICK_LEVELS = [200, 300, 450, 675, 1012, 1519, 2278, 3417, 5126, 7689, 11533, 17300, 25949, 38924, 58386];

export const berechneGesamtPassivEinkommenProSekunde = (upgrades: Record<string, number>, sponsorenAktiv: string[]): number => {
  const upgradeEinkommen = UPGRADES.reduce((acc, u) => {
    const count = upgrades[u.id] || 0;
    return acc + count * u.bonus * getUpgradeMultiplikator(count);
  }, 0);
  const sponsorEinkommen = SPONSOREN.filter((s) => sponsorenAktiv.includes(s.id)).reduce((acc, s) => acc + s.bonusProSekunde, 0);
  return upgradeEinkommen + sponsorEinkommen;
};

const getKaufpreis = (basePrice: number, count: number, growth: number) => Math.floor(basePrice * Math.pow(growth, count));

const SPIELTAG_COOLDOWN_MS = 2 * 60 * 1000;
const OFFLINE_CAP_SEKUNDEN = 6 * 60 * 60;
const OFFLINE_MIN_SEKUNDEN = 30;
const HYPE_VERFALL_PRO_SEKUNDE = 1 / (5 * 60);
const HYPE_MINIMUM = 10;

export interface SpieltagErgebnis {
  events: TickerEvent[]; heimName: string; auswaertsName: string; heimTore: number; auswaertsTore: number;
  spielerIstHeim: boolean; praemie: number; spieltagEinnahmen: number; neuerHype: number; neueFans: number;
  saisonEndeNachricht: string | null; aufstiegsBonus: number; relegationAusgeloest: boolean;
}

// ============ RELEGATION ============
export type ElfmeterRichtung = 'links' | 'mitte' | 'rechts';

export interface RelegationsDuell {
  typ: 'aufstieg' | 'abstieg';
  gegnerName: string;
  gegnerGesamtwert: number;
  ligaIndexZiel: number; // Ziel-Liga bei Sieg (aufstieg) bzw. bei Niederlage (abstieg)
  hinspielGespielt: boolean;
  hinspielSpielerTore: number | null;
  hinspielGegnerTore: number | null;
  rueckspielGespielt: boolean;
  rueckspielSpielerTore: number | null;
  rueckspielGegnerTore: number | null;
  naechstesSpielZeitpunkt: number;
  elfmeterAktiv: boolean;
  elfmeterSpielerTore: number;
  elfmeterGegnerTore: number;
  elfmeterKickNummer: number;
  elfmeterAktuellSchuetzeIstSpieler: boolean;
  elfmeterAbgeschlossen: boolean;
  elfmeterLetzterKick: { schuetzeIstSpieler: boolean; tor: boolean } | null;
}

const zieheElfmeterRichtung = (): ElfmeterRichtung => {
  const arr: ElfmeterRichtung[] = ['links', 'mitte', 'rechts'];
  return arr[Math.floor(Math.random() * 3)];
};

interface GameState {
  geld: number;
  kader: Player[];
  formation: FormationType;
  aufstellungSlots: Record<string, Player | null>;
  aktuelleLigaIndex: number;
  upgrades: Record<string, number>;
  matchdayUpgrades: Record<string, number>;
  packKaeufe: Record<string, number>;
  clickLevel: number;
  clicksInCurrentLevel: number;

  hype: number;
  fans: number;
  letzteKampagne: Record<string, number>;
  sponsorenAktiv: string[];

  teams: Team[];
  spielplan: SpielEintrag[];
  aktuellerSpieltag: number;
  naechstesSpielZeitpunkt: number;
  relegationsDuell: RelegationsDuell | null;

  vereinsName: string;
  hatOnboardingAbgeschlossen: boolean;
  lastActiveTimestamp: number;

  gesamtKlicks: number;
  gesamtAusgegeben: number;
  gesamtPacksGekauft: number;
  gesamtSiege: number;
  gesamtRemis: number;
  gesamtNiederlagen: number;

 clickHome: () => void;
  addPlayerToKader: (player: Omit<Player, 'id'>) => void;
  verkaufeSpieler: (id: string, preis: number) => void;
  verkaufeSpielerBulk: (ids: string[]) => void;
  setFormation: (form: FormationType) => void;
  setzeInSlot: (slotId: string, player: Player | null) => void;
  buyUpgrade: (id: string) => void;
  buyMaxUpgrade: (id: string) => void;
  buyMatchdayUpgrade: (id: string) => void;
  kaufePack: (id: string) => boolean;
  addPassiveEinnahmen: (betrag: number) => void;
  aktualisiereZeitstempel: () => void;
  aktualisiereHypeVerfall: (deltaSekunden: number) => void;

  starteKampagne: (id: string) => { erfolg: boolean; verbleibendMs?: number };
  schliesseSponsorAb: (id: string) => void;
  aendereVereinsName: (name: string) => void;

  starteNeueSaison: () => void;
  simuliereNaechstenSpieltag: () => SpieltagErgebnis | null;
  simuliereRelegationsSpiel: () => { gespielt: boolean; istHinspiel: boolean; heimTore: number; auswaertsTore: number; heimName: string; auswaertsName: string; spielerIstHeim: boolean; benoetigtElfmeter: boolean } | null;
  elfmeterAktion: (richtung: ElfmeterRichtung) => { tor: boolean; abgeschlossen: boolean; spielerGewinnt: boolean | null };

  schliesseOnboardingAb: (vereinsName: string) => void;
  berechneUndGutschreibeOfflineEinkommen: () => number;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      geld: 0,
      kader: [],
      formation: '4-3-3',
      aufstellungSlots: { TW1: null },
      aktuelleLigaIndex: 0,
      upgrades: {},
      matchdayUpgrades: {},
      packKaeufe: {},
      clickLevel: 1,
      clicksInCurrentLevel: 0,

      hype: 30,
      fans: 0,
      letzteKampagne: {},
      sponsorenAktiv: [],

      teams: [],
      spielplan: [],
      aktuellerSpieltag: 1,
      naechstesSpielZeitpunkt: 0,
      relegationsDuell: null,

      vereinsName: '',
      hatOnboardingAbgeschlossen: false,
      lastActiveTimestamp: Date.now(),

      gesamtKlicks: 0,
      gesamtAusgegeben: 0,
      gesamtPacksGekauft: 0,
      gesamtSiege: 0,
      gesamtRemis: 0,
      gesamtNiederlagen: 0,

      clickHome: () => set((state) => {
        const idx = Math.min(state.clickLevel - 1, CLICK_WERTE.length - 1);
        const basisWert = CLICK_WERTE[idx];
        const einkommenProSekunde = berechneGesamtPassivEinkommenProSekunde(state.upgrades, state.sponsorenAktiv);
        const wert = Math.round(basisWert + einkommenProSekunde * 0.15);
        const benoetigt = CLICK_LEVELS[Math.min(state.clickLevel - 1, CLICK_LEVELS.length - 1)];
        const neueKlicks = state.clicksInCurrentLevel + 1;
        const gesamtKlicks = state.gesamtKlicks + 1;
        if (neueKlicks >= benoetigt && state.clickLevel < CLICK_LEVELS.length) {
          return { geld: state.geld + wert, clickLevel: state.clickLevel + 1, clicksInCurrentLevel: 0, gesamtKlicks };
        }
        return { geld: state.geld + wert, clicksInCurrentLevel: neueKlicks, gesamtKlicks };
      }),

      addPlayerToKader: (player) => set((state) => ({ kader: [...state.kader, { ...player, id: `${Date.now()}-${Math.floor(Math.random() * 10000)}` }] })),

      verkaufeSpieler: (id, preis) => set((state) => {
        const neueSlots = { ...state.aufstellungSlots };
        Object.keys(neueSlots).forEach((slot) => { if (neueSlots[slot]?.id === id) neueSlots[slot] = null; });
        return { geld: state.geld + preis, kader: state.kader.filter((p) => p.id !== id), aufstellungSlots: neueSlots };
      }),

      verkaufeSpielerBulk: (ids) => set((state) => {
        const idSet = new Set(ids);
        const summe = state.kader
          .filter((p) => idSet.has(p.id))
          .reduce((acc, p) => acc + p.rarity.sellPrice, 0);
        const neueSlots = { ...state.aufstellungSlots };
        Object.keys(neueSlots).forEach((slot) => {
          if (neueSlots[slot] && idSet.has(neueSlots[slot]!.id)) neueSlots[slot] = null;
        });
        return {
          geld: state.geld + summe,
          kader: state.kader.filter((p) => !idSet.has(p.id)),
          aufstellungSlots: neueSlots,
        };
      }),

      setFormation: (formation) => set({ formation }),

      setzeInSlot: (slotId, player) => set((state) => {
        const neueSlots = { ...state.aufstellungSlots };
        if (player) { Object.keys(neueSlots).forEach((slot) => { if (neueSlots[slot]?.id === player.id) neueSlots[slot] = null; }); }
        neueSlots[slotId] = player;
        return { aufstellungSlots: neueSlots };
      }),

      buyUpgrade: (id) => set((state) => {
        const upgrade = UPGRADES.find((u) => u.id === id);
        if (!upgrade || state.aktuelleLigaIndex < upgrade.minLigaIndex) return state;
        const count = state.upgrades[id] || 0;
        const cost = getKaufpreis(upgrade.basePrice, count, upgrade.growth);
        if (state.geld < cost) return state;
        return { geld: state.geld - cost, upgrades: { ...state.upgrades, [id]: count + 1 }, gesamtAusgegeben: state.gesamtAusgegeben + cost };
      }),

      buyMaxUpgrade: (id) => set((state) => {
        const upgrade = UPGRADES.find((u) => u.id === id);
        if (!upgrade || state.aktuelleLigaIndex < upgrade.minLigaIndex) return state;
        let count = state.upgrades[id] || 0;
        let geld = state.geld;
        let ausgegeben = 0;
        let gekauft = 0;
        while (gekauft < 100000) {
          const cost = getKaufpreis(upgrade.basePrice, count, upgrade.growth);
          if (geld < cost) break;
          geld -= cost; ausgegeben += cost; count += 1; gekauft += 1;
        }
        if (gekauft === 0) return state;
        return { geld, upgrades: { ...state.upgrades, [id]: count }, gesamtAusgegeben: state.gesamtAusgegeben + ausgegeben };
      }),

      buyMatchdayUpgrade: (id) => set((state) => {
        const upgrade = MATCHDAY_UPGRADES.find((u) => u.id === id);
        if (!upgrade || state.aktuelleLigaIndex < upgrade.minLigaIndex) return state;
        const count = state.matchdayUpgrades[id] || 0;
        const cost = getKaufpreis(upgrade.basePrice, count, upgrade.growth);
        if (state.geld < cost) return state;
        return { geld: state.geld - cost, matchdayUpgrades: { ...state.matchdayUpgrades, [id]: count + 1 }, gesamtAusgegeben: state.gesamtAusgegeben + cost };
      }),

      kaufePack: (id) => {
        const state = get();
        const pack = PACKS.find((p) => p.id === id);
        if (!pack) return false;
        if (state.aktuelleLigaIndex < pack.ligaIndex) return false;
        const anzahlGekauft = state.packKaeufe[id] || 0;
        const preis = getPackPreis(pack, anzahlGekauft);
        if (state.geld < preis) return false;
        set({
          geld: state.geld - preis,
          packKaeufe: { ...state.packKaeufe, [id]: anzahlGekauft + 1 },
          gesamtAusgegeben: state.gesamtAusgegeben + preis,
          gesamtPacksGekauft: state.gesamtPacksGekauft + 1,
        });
        return true;
      },

      addPassiveEinnahmen: (betrag) => set((state) => ({ geld: state.geld + betrag })),
      aktualisiereZeitstempel: () => set({ lastActiveTimestamp: Date.now() }),
      aktualisiereHypeVerfall: (deltaSekunden) => set((state) => ({ hype: Math.max(HYPE_MINIMUM, state.hype - HYPE_VERFALL_PRO_SEKUNDE * deltaSekunden) })),

      starteKampagne: (id) => {
        const state = get();
        const kampagne = KAMPAGNEN.find((k) => k.id === id);
        if (!kampagne) return { erfolg: false };
        const jetzt = Date.now();
        const letzte = state.letzteKampagne[id] || 0;
        if (jetzt - letzte < kampagne.cooldownMs) return { erfolg: false, verbleibendMs: kampagne.cooldownMs - (jetzt - letzte) };
        if (state.geld < kampagne.preis) return { erfolg: false };
        set({
          geld: state.geld - kampagne.preis, hype: Math.min(100, state.hype + kampagne.hypeBoost),
          fans: state.fans + kampagne.fansBoost, letzteKampagne: { ...state.letzteKampagne, [id]: jetzt },
          gesamtAusgegeben: state.gesamtAusgegeben + kampagne.preis,
        });
        return { erfolg: true };
      },

      schliesseSponsorAb: (id) => set((state) => {
        const sponsor = SPONSOREN.find((s) => s.id === id);
        if (!sponsor) return state;
        if (state.aktuelleLigaIndex < sponsor.ligaIndex) return state;
        if (state.fans < sponsor.benoetigteFans) return state;
        if (state.sponsorenAktiv.includes(id)) return state;
        return { geld: state.geld + sponsor.antrittspraemie, sponsorenAktiv: [...state.sponsorenAktiv, id] };
      }),

      aendereVereinsName: (name) => set({ vereinsName: name.trim().slice(0, 24) || 'Mein Verein' }),

      starteNeueSaison: () => set((state) => {
        const ligaName = LIGEN_ORDNUNG[state.aktuelleLigaIndex];
        const spielerGesamtwert = berechneGesamtwert(state.aufstellungSlots, state.formation);
        const teams = generateTeams(ligaName, spielerGesamtwert);
        const spielplan = generateSpielplan(teams);
        return { teams, spielplan, aktuellerSpieltag: 1, naechstesSpielZeitpunkt: 0, relegationsDuell: null };
      }),

      simuliereNaechstenSpieltag: () => {
        const state = get();
        if (state.relegationsDuell) return null;
        if (state.teams.length === 0) return null;
        if (Date.now() < state.naechstesSpielZeitpunkt) return null;

        const ligaName = LIGEN_ORDNUNG[state.aktuelleLigaIndex];
        const spieltageProSaison = getSpieltageProSaison(ligaName);
        const spielerGesamtwert = berechneGesamtwert(state.aufstellungSlots, state.formation);
        const gesamtwertMap: Record<string, number> = {};
        state.teams.forEach((t) => { gesamtwertMap[t.id] = t.istSpieler ? spielerGesamtwert : t.gesamtwert; });
        const nameMap: Record<string, string> = {};
        state.teams.forEach((t) => { nameMap[t.id] = t.name; });

        let spielerMatch: SpielEintrag | null = null;
        const neuerSpielplan = state.spielplan.map((s) => {
          if (s.spieltag !== state.aktuellerSpieltag) return s;
          const ergebnis = simuliereErgebnis(gesamtwertMap[s.heimId] ?? 40, gesamtwertMap[s.auswaertsId] ?? 40);
          const aktualisiert: SpielEintrag = { ...s, heimTore: ergebnis.heim, auswaertsTore: ergebnis.auswaerts, gespielt: true };
          if (s.heimId === 'spieler' || s.auswaertsId === 'spieler') spielerMatch = aktualisiert;
          return aktualisiert;
        });

        if (!spielerMatch) return null;
        const match = spielerMatch as SpielEintrag;
        const heimName = nameMap[match.heimId] || 'Heim';
        const auswaertsName = nameMap[match.auswaertsId] || 'Auswärts';
        const events = generateTickerEvents(heimName, auswaertsName, match.heimTore || 0, match.auswaertsTore || 0);
        const spielerIstHeim = match.heimId === 'spieler';
        const spielerTore = spielerIstHeim ? match.heimTore! : match.auswaertsTore!;
        const gegnerTore = spielerIstHeim ? match.auswaertsTore! : match.heimTore!;

        const ligaDef = LIGEN[state.aktuelleLigaIndex];
        let praemie = ligaDef.niederlagePraemie;
        let neuerHype = state.hype;
        let neueFans = state.fans;
        let deltaSiege = 0, deltaRemis = 0, deltaNiederlagen = 0;

        if (spielerTore > gegnerTore) {
          praemie = ligaDef.siegPraemie; neuerHype = Math.min(100, state.hype + 8);
          neueFans = state.fans + Math.round(3 + spielerGesamtwert * 0.05); deltaSiege = 1;
        } else if (spielerTore === gegnerTore) {
          praemie = ligaDef.remisPraemie; neuerHype = Math.min(100, state.hype + 2);
          neueFans = state.fans + Math.round(1 + spielerGesamtwert * 0.02); deltaRemis = 1;
        } else {
          praemie = ligaDef.niederlagePraemie; neuerHype = Math.max(HYPE_MINIMUM, state.hype - 6); deltaNiederlagen = 1;
        }

        let spieltagEinnahmen = 0;
        if (spielerIstHeim) {
          const kapazitaet = BASIS_KAPAZITAET + MATCHDAY_UPGRADES.filter((u) => u.type === 'kapazitaet').reduce((acc, u) => { const c = state.matchdayUpgrades[u.id] || 0; return acc + c * u.wert * getUpgradeMultiplikator(c); }, 0);
          const zuschauer = Math.round(kapazitaet * (neuerHype / 100));
          const umsatzProZuschauer = BASIS_UMSATZ_PRO_ZUSCHAUER + MATCHDAY_UPGRADES.filter((u) => u.type === 'umsatzProZuschauer').reduce((acc, u) => { const c = state.matchdayUpgrades[u.id] || 0; return acc + c * u.wert * getUpgradeMultiplikator(c); }, 0);
          spieltagEinnahmen = Math.round(zuschauer * umsatzProZuschauer);
        }

        const naechsterSpieltag = state.aktuellerSpieltag + 1;
        let saisonEndeNachricht: string | null = null;
        let aufstiegsBonus = 0;
        let relegationAusgeloest = false;

        if (naechsterSpieltag > spieltageProSaison) {
          const tabelle = berechneTabelle(state.teams, neuerSpielplan);
          const platz = tabelle.findIndex((t) => t.istSpieler) + 1;
          const teamAnzahl = state.teams.length;

          if (platz === 1) {
            if (state.aktuelleLigaIndex < LIGEN_ORDNUNG.length - 1) {
              const neueLigaIndex = state.aktuelleLigaIndex + 1;
              aufstiegsBonus = 500 * (neueLigaIndex + 1) * (neueLigaIndex + 1);
              saisonEndeNachricht = `🏆 Meisterschaft! Aufstieg in die ${LIGEN_ORDNUNG[neueLigaIndex]}!`;
              const neuerGesamtwert = berechneGesamtwert(state.aufstellungSlots, state.formation);
              const neueTeams = generateTeams(LIGEN_ORDNUNG[neueLigaIndex], neuerGesamtwert);
              set({ geld: state.geld + praemie + aufstiegsBonus + spieltagEinnahmen, spielplan: generateSpielplan(neueTeams), aktuellerSpieltag: 1, aktuelleLigaIndex: neueLigaIndex, teams: neueTeams, naechstesSpielZeitpunkt: Date.now() + SPIELTAG_COOLDOWN_MS, hype: neuerHype, fans: neueFans, gesamtSiege: state.gesamtSiege + deltaSiege, gesamtRemis: state.gesamtRemis + deltaRemis, gesamtNiederlagen: state.gesamtNiederlagen + deltaNiederlagen });
            } else {
              saisonEndeNachricht = '🏆 Meisterschaft! Du bist bereits in der höchsten Liga!';
              set({ geld: state.geld + praemie + spieltagEinnahmen, spielplan: neuerSpielplan, aktuellerSpieltag: naechsterSpieltag, naechstesSpielZeitpunkt: Date.now() + SPIELTAG_COOLDOWN_MS, hype: neuerHype, fans: neueFans, gesamtSiege: state.gesamtSiege + deltaSiege, gesamtRemis: state.gesamtRemis + deltaRemis, gesamtNiederlagen: state.gesamtNiederlagen + deltaNiederlagen });
            }
          } else if (platz === teamAnzahl) {
            if (state.aktuelleLigaIndex > 0) {
              const neueLigaIndex = state.aktuelleLigaIndex - 1;
              saisonEndeNachricht = `⬇️ Als Tabellenletzter steigst du ab in die ${LIGEN_ORDNUNG[neueLigaIndex]}.`;
              const neuerGesamtwert = berechneGesamtwert(state.aufstellungSlots, state.formation);
              const neueTeams = generateTeams(LIGEN_ORDNUNG[neueLigaIndex], neuerGesamtwert);
              set({ geld: state.geld + praemie + spieltagEinnahmen, spielplan: generateSpielplan(neueTeams), aktuellerSpieltag: 1, aktuelleLigaIndex: neueLigaIndex, teams: neueTeams, naechstesSpielZeitpunkt: Date.now() + SPIELTAG_COOLDOWN_MS, hype: neuerHype, fans: neueFans, gesamtSiege: state.gesamtSiege + deltaSiege, gesamtRemis: state.gesamtRemis + deltaRemis, gesamtNiederlagen: state.gesamtNiederlagen + deltaNiederlagen });
            } else {
              saisonEndeNachricht = '😮‍💨 Letzter Platz, aber du bist schon in der untersten Liga.';
              set({ geld: state.geld + praemie + spieltagEinnahmen, spielplan: neuerSpielplan, aktuellerSpieltag: naechsterSpieltag, naechstesSpielZeitpunkt: Date.now() + SPIELTAG_COOLDOWN_MS, hype: neuerHype, fans: neueFans, gesamtSiege: state.gesamtSiege + deltaSiege, gesamtRemis: state.gesamtRemis + deltaRemis, gesamtNiederlagen: state.gesamtNiederlagen + deltaNiederlagen });
            }
          } else if (platz === 2 && state.aktuelleLigaIndex < LIGEN_ORDNUNG.length - 1) {
            // Aufstiegs-Relegation: Gegner aus der HOEHEREN Liga, dessen Abstiegs-Relegationsplatz (unteres Ende der Spanne)
            const ligaIndexZiel = state.aktuelleLigaIndex + 1;
            const gegner = generateEinzelGegner(LIGEN_ORDNUNG[ligaIndexZiel], 0.15);
            relegationAusgeloest = true;
            saisonEndeNachricht = `⚔️ Relegation um den Aufstieg gegen ${gegner.name}!`;
            set({
              geld: state.geld + praemie + spieltagEinnahmen, hype: neuerHype, fans: neueFans,
              gesamtSiege: state.gesamtSiege + deltaSiege, gesamtRemis: state.gesamtRemis + deltaRemis, gesamtNiederlagen: state.gesamtNiederlagen + deltaNiederlagen,
              relegationsDuell: {
                typ: 'aufstieg', gegnerName: gegner.name, gegnerGesamtwert: gegner.gesamtwert, ligaIndexZiel,
                hinspielGespielt: false, hinspielSpielerTore: null, hinspielGegnerTore: null,
                rueckspielGespielt: false, rueckspielSpielerTore: null, rueckspielGegnerTore: null,
                naechstesSpielZeitpunkt: Date.now() + SPIELTAG_COOLDOWN_MS,
                elfmeterAktiv: false, elfmeterSpielerTore: 0, elfmeterGegnerTore: 0, elfmeterKickNummer: 0,
                elfmeterAktuellSchuetzeIstSpieler: Math.random() < 0.5, elfmeterAbgeschlossen: false, elfmeterLetzterKick: null,
              },
            });
          } else if (platz === teamAnzahl - 1 && state.aktuelleLigaIndex > 0) {
            // Abstiegs-Relegation: Gegner aus der NIEDRIGEREN Liga, dessen Aufstiegs-Relegationsplatz (oberes Ende der Spanne)
            const ligaIndexZiel = state.aktuelleLigaIndex - 1;
            const gegner = generateEinzelGegner(LIGEN_ORDNUNG[ligaIndexZiel], 0.85);
            relegationAusgeloest = true;
            saisonEndeNachricht = `⚔️ Abstiegs-Relegation gegen ${gegner.name}!`;
            set({
              geld: state.geld + praemie + spieltagEinnahmen, hype: neuerHype, fans: neueFans,
              gesamtSiege: state.gesamtSiege + deltaSiege, gesamtRemis: state.gesamtRemis + deltaRemis, gesamtNiederlagen: state.gesamtNiederlagen + deltaNiederlagen,
              relegationsDuell: {
                typ: 'abstieg', gegnerName: gegner.name, gegnerGesamtwert: gegner.gesamtwert, ligaIndexZiel,
                hinspielGespielt: false, hinspielSpielerTore: null, hinspielGegnerTore: null,
                rueckspielGespielt: false, rueckspielSpielerTore: null, rueckspielGegnerTore: null,
                naechstesSpielZeitpunkt: Date.now() + SPIELTAG_COOLDOWN_MS,
                elfmeterAktiv: false, elfmeterSpielerTore: 0, elfmeterGegnerTore: 0, elfmeterKickNummer: 0,
                elfmeterAktuellSchuetzeIstSpieler: Math.random() < 0.5, elfmeterAbgeschlossen: false, elfmeterLetzterKick: null,
              },
            });
          } else {
            saisonEndeNachricht = `Saison beendet auf Platz ${platz}. Kein Auf- oder Abstieg.`;
            set({ geld: state.geld + praemie + spieltagEinnahmen, spielplan: neuerSpielplan, aktuellerSpieltag: naechsterSpieltag, naechstesSpielZeitpunkt: Date.now() + SPIELTAG_COOLDOWN_MS, hype: neuerHype, fans: neueFans, gesamtSiege: state.gesamtSiege + deltaSiege, gesamtRemis: state.gesamtRemis + deltaRemis, gesamtNiederlagen: state.gesamtNiederlagen + deltaNiederlagen });
          }
        } else {
          set({ geld: state.geld + praemie + spieltagEinnahmen, spielplan: neuerSpielplan, aktuellerSpieltag: naechsterSpieltag, naechstesSpielZeitpunkt: Date.now() + SPIELTAG_COOLDOWN_MS, hype: neuerHype, fans: neueFans, gesamtSiege: state.gesamtSiege + deltaSiege, gesamtRemis: state.gesamtRemis + deltaRemis, gesamtNiederlagen: state.gesamtNiederlagen + deltaNiederlagen });
        }

        return { events, heimName, auswaertsName, heimTore: match.heimTore || 0, auswaertsTore: match.auswaertsTore || 0, spielerIstHeim, praemie, spieltagEinnahmen, neuerHype, neueFans, saisonEndeNachricht, aufstiegsBonus, relegationAusgeloest };
      },

      simuliereRelegationsSpiel: () => {
        const state = get();
        const duell = state.relegationsDuell;
        if (!duell) return null;
        if (Date.now() < duell.naechstesSpielZeitpunkt) return null;

        const spielerGesamtwert = berechneGesamtwert(state.aufstellungSlots, state.formation);
        const istHinspiel = !duell.hinspielGespielt;

        // Hinspiel: Spieler zuhause. Rueckspiel: Spieler auswaerts.
        const heimGesamtwert = istHinspiel ? spielerGesamtwert : duell.gegnerGesamtwert;
        const auswaertsGesamtwert = istHinspiel ? duell.gegnerGesamtwert : spielerGesamtwert;
        const ergebnis = simuliereErgebnis(heimGesamtwert, auswaertsGesamtwert);
        const heimName = istHinspiel ? (state.vereinsName || 'Mein Verein') : duell.gegnerName;
        const auswaertsName = istHinspiel ? duell.gegnerName : (state.vereinsName || 'Mein Verein');
        const spielerTore = istHinspiel ? ergebnis.heim : ergebnis.auswaerts;
        const gegnerTore = istHinspiel ? ergebnis.auswaerts : ergebnis.heim;

        if (istHinspiel) {
          set({ relegationsDuell: { ...duell, hinspielGespielt: true, hinspielSpielerTore: spielerTore, hinspielGegnerTore: gegnerTore, naechstesSpielZeitpunkt: Date.now() + SPIELTAG_COOLDOWN_MS } });
          return { gespielt: true, istHinspiel: true, heimTore: ergebnis.heim, auswaertsTore: ergebnis.auswaerts, heimName, auswaertsName, spielerIstHeim: true, benoetigtElfmeter: false };
        }

        // Rueckspiel gespielt -> Gesamtergebnis pruefen
        const spielerGesamt = (duell.hinspielSpielerTore || 0) + spielerTore;
        const gegnerGesamt = (duell.hinspielGegnerTore || 0) + gegnerTore;

        if (spielerGesamt === gegnerGesamt) {
          set({ relegationsDuell: { ...duell, rueckspielGespielt: true, rueckspielSpielerTore: spielerTore, rueckspielGegnerTore: gegnerTore, elfmeterAktiv: true } });
          return { gespielt: true, istHinspiel: false, heimTore: ergebnis.heim, auswaertsTore: ergebnis.auswaerts, heimName, auswaertsName, spielerIstHeim: false, benoetigtElfmeter: true };
        }

        const spielerGewinnt = spielerGesamt > gegnerGesamt;
        const neuerGesamtwert = berechneGesamtwert(state.aufstellungSlots, state.formation);
        if (spielerGewinnt && duell.typ === 'aufstieg') {
          const neueTeams = generateTeams(LIGEN_ORDNUNG[duell.ligaIndexZiel], neuerGesamtwert);
          set({ aktuelleLigaIndex: duell.ligaIndexZiel, teams: neueTeams, spielplan: generateSpielplan(neueTeams), aktuellerSpieltag: 1, naechstesSpielZeitpunkt: Date.now() + SPIELTAG_COOLDOWN_MS, relegationsDuell: null });
        } else if (!spielerGewinnt && duell.typ === 'abstieg') {
          const neueTeams = generateTeams(LIGEN_ORDNUNG[duell.ligaIndexZiel], neuerGesamtwert);
          set({ aktuelleLigaIndex: duell.ligaIndexZiel, teams: neueTeams, spielplan: generateSpielplan(neueTeams), aktuellerSpieltag: 1, naechstesSpielZeitpunkt: Date.now() + SPIELTAG_COOLDOWN_MS, relegationsDuell: null });
        } else {
          // Bleibt in der aktuellen Liga (Aufstieg verpasst bzw. Abstieg verhindert)
          const neueTeams = generateTeams(LIGEN_ORDNUNG[state.aktuelleLigaIndex], neuerGesamtwert);
          set({ teams: neueTeams, spielplan: generateSpielplan(neueTeams), aktuellerSpieltag: 1, naechstesSpielZeitpunkt: Date.now() + SPIELTAG_COOLDOWN_MS, relegationsDuell: null });
        }

        return { gespielt: true, istHinspiel: false, heimTore: ergebnis.heim, auswaertsTore: ergebnis.auswaerts, heimName, auswaertsName, spielerIstHeim: false, benoetigtElfmeter: false };
      },

      elfmeterAktion: (richtung) => {
        const state = get();
        const duell = state.relegationsDuell;
        if (!duell || !duell.elfmeterAktiv || duell.elfmeterAbgeschlossen) return { tor: false, abgeschlossen: false, spielerGewinnt: null };

        const spielerSchiesst = duell.elfmeterAktuellSchuetzeIstSpieler;
        // Gegnerische "Reaktion" (Torwart bzw. Schuetze) wird automatisch gewuerfelt, leicht beeinflusst von der Staerke.
        const gegnerReaktion = zieheElfmeterRichtung();
        const staerkeVorteil = spielerSchiesst
          ? Math.max(0, (1000 / (duell.gegnerGesamtwert + 50))) // schwacher Gegner-Torwart -> seltener richtig geraten
          : 0;

        let tor: boolean;
        if (spielerSchiesst) {
          // Spieler schiesst (richtung), Gegner haelt (gegnerReaktion)
          const gegnerRaetRichtig = gegnerReaktion === richtung;
          tor = gegnerRaetRichtig ? Math.random() < 0.15 : Math.random() < 0.9;
        } else {
          // Gegner schiesst (gegnerReaktion), Spieler haelt (richtung)
          const spielerRaetRichtig = richtung === gegnerReaktion;
          tor = spielerRaetRichtig ? Math.random() < 0.15 : Math.random() < 0.9;
        }

        let neuSpielerTore = duell.elfmeterSpielerTore;
        let neuGegnerTore = duell.elfmeterGegnerTore;
        if (tor) { if (spielerSchiesst) neuSpielerTore++; else neuGegnerTore++; }

        const neueKickNummer = duell.elfmeterKickNummer + 1;
        const istErsteSerieKomplett = neueKickNummer >= 10;

        let abgeschlossen = false;
        let spielerGewinnt: boolean | null = null;

        if (istErsteSerieKomplett && neueKickNummer % 2 === 0) {
          if (neuSpielerTore !== neuGegnerTore) { abgeschlossen = true; spielerGewinnt = neuSpielerTore > neuGegnerTore; }
        } else if (neueKickNummer > 10 && neueKickNummer % 2 === 0) {
          if (neuSpielerTore !== neuGegnerTore) { abgeschlossen = true; spielerGewinnt = neuSpielerTore > neuGegnerTore; }
        }

        if (abgeschlossen) {
          const neuerGesamtwert = berechneGesamtwert(state.aufstellungSlots, state.formation);
          if (spielerGewinnt && duell.typ === 'aufstieg') {
            const neueTeams = generateTeams(LIGEN_ORDNUNG[duell.ligaIndexZiel], neuerGesamtwert);
            set({ aktuelleLigaIndex: duell.ligaIndexZiel, teams: neueTeams, spielplan: generateSpielplan(neueTeams), aktuellerSpieltag: 1, naechstesSpielZeitpunkt: Date.now() + SPIELTAG_COOLDOWN_MS, relegationsDuell: { ...duell, elfmeterSpielerTore: neuSpielerTore, elfmeterGegnerTore: neuGegnerTore, elfmeterKickNummer: neueKickNummer, elfmeterAktuellSchuetzeIstSpieler: !spielerSchiesst, elfmeterAbgeschlossen: true, elfmeterLetzterKick: { schuetzeIstSpieler: spielerSchiesst, tor } } });
          } else if (!spielerGewinnt && duell.typ === 'abstieg') {
            const neueTeams = generateTeams(LIGEN_ORDNUNG[duell.ligaIndexZiel], neuerGesamtwert);
            set({ aktuelleLigaIndex: duell.ligaIndexZiel, teams: neueTeams, spielplan: generateSpielplan(neueTeams), aktuellerSpieltag: 1, naechstesSpielZeitpunkt: Date.now() + SPIELTAG_COOLDOWN_MS, relegationsDuell: { ...duell, elfmeterSpielerTore: neuSpielerTore, elfmeterGegnerTore: neuGegnerTore, elfmeterKickNummer: neueKickNummer, elfmeterAktuellSchuetzeIstSpieler: !spielerSchiesst, elfmeterAbgeschlossen: true, elfmeterLetzterKick: { schuetzeIstSpieler: spielerSchiesst, tor } } });
          } else {
            const neueTeams = generateTeams(LIGEN_ORDNUNG[state.aktuelleLigaIndex], neuerGesamtwert);
            set({ teams: neueTeams, spielplan: generateSpielplan(neueTeams), aktuellerSpieltag: 1, naechstesSpielZeitpunkt: Date.now() + SPIELTAG_COOLDOWN_MS, relegationsDuell: { ...duell, elfmeterSpielerTore: neuSpielerTore, elfmeterGegnerTore: neuGegnerTore, elfmeterKickNummer: neueKickNummer, elfmeterAktuellSchuetzeIstSpieler: !spielerSchiesst, elfmeterAbgeschlossen: true, elfmeterLetzterKick: { schuetzeIstSpieler: spielerSchiesst, tor } } });
          }
        } else {
          set({ relegationsDuell: { ...duell, elfmeterSpielerTore: neuSpielerTore, elfmeterGegnerTore: neuGegnerTore, elfmeterKickNummer: neueKickNummer, elfmeterAktuellSchuetzeIstSpieler: !spielerSchiesst, elfmeterLetzterKick: { schuetzeIstSpieler: spielerSchiesst, tor } } });
        }

        return { tor, abgeschlossen, spielerGewinnt };
      },

      schliesseOnboardingAb: (vereinsName) => set({ vereinsName: vereinsName.trim() || 'Mein Verein', hatOnboardingAbgeschlossen: true, lastActiveTimestamp: Date.now() }),

      berechneUndGutschreibeOfflineEinkommen: () => {
        const state = get();
        const jetzt = Date.now();
        const letzterZeitpunkt = state.lastActiveTimestamp || jetzt;
        const vergangeneSekunden = Math.max(0, (jetzt - letzterZeitpunkt) / 1000);
        if (vergangeneSekunden < OFFLINE_MIN_SEKUNDEN) { set({ lastActiveTimestamp: jetzt }); return 0; }
        const gecappteSekunden = Math.min(vergangeneSekunden, OFFLINE_CAP_SEKUNDEN);
        const einkommenProSekunde = berechneGesamtPassivEinkommenProSekunde(state.upgrades, state.sponsorenAktiv);
        const verdient = Math.round(einkommenProSekunde * gecappteSekunden);
        const neuerHype = Math.max(HYPE_MINIMUM, state.hype - HYPE_VERFALL_PRO_SEKUNDE * gecappteSekunden);
        set({ geld: state.geld + verdient, lastActiveTimestamp: jetzt, hype: neuerHype });
        return verdient;
      },
    }),
    { name: 'fussballtycoon-save-v3', storage: createJSONStorage(() => AsyncStorage) }
  )
);