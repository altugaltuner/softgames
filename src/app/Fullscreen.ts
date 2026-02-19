type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
};

function requestFullscreen(element: FullscreenElement): void {
  if (document.fullscreenElement) {
    return;
  }

  const request =
    element.requestFullscreen?.bind(element) ??
    element.webkitRequestFullscreen?.bind(element);

  if (!request) {
    return;
  }

  void request().catch(() => undefined);
}

export function enableFullscreen(element: HTMLElement): () => void {
  requestFullscreen(element as FullscreenElement);

  const onPointer = () => requestFullscreen(element as FullscreenElement);
  element.addEventListener("pointerdown", onPointer, { once: true });

  return () => {
    element.removeEventListener("pointerdown", onPointer);
  };
}
