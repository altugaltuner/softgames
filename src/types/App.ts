export type CreateAppOptions = {
  backgroundColor?: number;
  mount?: boolean;
};

export type ResizePayload = {
  width: number;
  height: number;
  scale: number;
};

export type ManagedScene = {
  resize: (payload: ResizePayload) => void;
  destroy: () => void;
};

