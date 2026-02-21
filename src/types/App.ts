export type CreateAppOptions = {
  backgroundColor?: number;
  mount?: boolean;
};

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

export type ResizePayload = {
  width: number;
  height: number;
  scale: number;
};

export type BackButtonOptions = {
  onClick: () => void;
};

export type ManagedScene = {
  resize: (payload: ResizePayload) => void;
  destroy: () => void;
};

