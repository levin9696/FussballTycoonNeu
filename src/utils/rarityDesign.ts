import { Platform } from 'react-native';

// Farbverlauf, Textfarbe und Glow pro Rarity-Name (muss zu getRarityByRating() in gameStore.ts passen)
export interface RarityDesign {
  gradient: string[]; // 2+ Farben, dunkel -> hell oder Regenbogen
  textColor: string;
  glow: string;
  angle: number; // Verlaufswinkel in Grad
}

export const RARITY_DESIGN: Record<string, RarityDesign> = {
  'Gewöhnlich':   { gradient: ['#5b5b5b', '#2b2b2b'], textColor: '#ffffff', glow: '#8d8d8d', angle: 135 },
  'Ungewöhnlich': { gradient: ['#5cd65c', '#1f7a1f'], textColor: '#ffffff', glow: '#4caf50', angle: 135 },
  'Selten':       { gradient: ['#4dabf7', '#14508c'], textColor: '#ffffff', glow: '#2196f3', angle: 135 },
  'Episch':       { gradient: ['#c158dc', '#5c1777'], textColor: '#ffffff', glow: '#9c27b0', angle: 135 },
  'Mythisch':     { gradient: ['#ff7b5b', '#9c2115'], textColor: '#ffffff', glow: '#e74c3c', angle: 135 },
  'Legende':      { gradient: ['#ffd166', '#b56c00'], textColor: '#3a2400', glow: '#f5a623', angle: 135 },
  'Rainbow':      { gradient: ['#ff6b6b', '#ffd166', '#6bffb8', '#6bc1ff', '#c16bff'], textColor: '#ffffff', glow: '#ff6b6b', angle: 120 },
  'Universal':    { gradient: ['#7dc4ff', '#12295c'], textColor: '#ffffff', glow: '#4a9eff', angle: 135 },
  'Göttlich':     { gradient: ['#fff6c8', '#c99400'], textColor: '#3a2400', glow: '#ffd700', angle: 135 },
  'Ultimativ':    { gradient: ['#ffffff', '#c9d6e3', '#ffffff'], textColor: '#111111', glow: '#ffffff', angle: 120 },
};

export const getRarityDesign = (name: string): RarityDesign =>
  RARITY_DESIGN[name] || RARITY_DESIGN['Gewöhnlich'];

// Baut ein plattformabhängiges Style-Objekt für den Kartenhintergrund.
// Web: echter CSS-Verlauf. Native (iOS/Android): satte Grundfarbe als Fallback (keine zusätzliche Lib nötig).
export const getGradientBackgroundStyle = (design: RarityDesign): any => {
  if (Platform.OS === 'web') {
    return {
      backgroundImage: `linear-gradient(${design.angle}deg, ${design.gradient.join(', ')})`,
    };
  }
  return {
    backgroundColor: design.gradient[Math.floor(design.gradient.length / 2)],
  };
};

// Weicher Leucht-Schatten in der Rarity-Farbe (funktioniert auf Web + iOS; Android braucht elevation, siehe Komponente)
export const getGlowShadowStyle = (glowColor: string, intensity: number = 12): any => ({
  shadowColor: glowColor,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.9,
  shadowRadius: intensity,
});