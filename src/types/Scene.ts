export type GameTheme = "garden" | "sweet" | "tripeaks";

export type GameCard = {
  title: string;
  description: string;
  url: string;
  theme: GameTheme;
  glyph: string;
};

export type MenuSceneOptions = {
  onNavigate?: (url: string) => void;
};

