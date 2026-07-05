export interface Player {
  id: number;
  name: string;
  rating: number;
  nationality: string;
}

const FIRST_NAMES = ["Maximilian", "Lukas", "Hiroshi", "Wei", "Luca", "Alexander", "Ji-hoon", "Mateo", "Sven", "Yuki", "Hans", "Kenji"];
const LAST_NAMES = ["Müller", "Schmidt", "Tanaka", "Li", "Rossi", "Garcia", "Kim", "Schneider", "Weber", "Sato", "Wagner", "Chen"];
const NATIONALITIES = ["Deutschland", "Japan", "China", "Italien", "Spanien", "Südkorea", "Brasilien", "Frankreich"];

export const PLAYERS: Player[] = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`,
  rating: Math.floor(Math.random() * (150 - 15 + 1)) + 15,
  nationality: NATIONALITIES[Math.floor(Math.random() * NATIONALITIES.length)],
}));