import { SharedFontDescriptors } from "./config";

export async function ensureSharedFontsReady(): Promise<void> {
  if (!("fonts" in document)) {
    return;
  }

  await Promise.all(
    SharedFontDescriptors.map((descriptor) => document.fonts.load(descriptor)),
  );
}
