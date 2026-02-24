import { sound } from "@pixi/sound";
import { MagicWordsSceneConfig } from "./config";
import type { DialogueItem } from "./type";

export class MagicWordsDialogueAudio {
  private readonly dialogueSoundAliases: Array<string | null> = [];
  private readonly ownedDialogueSoundAliases = new Set<string>();
  private activeDialogueSoundAlias: string | null = null;

  setup(dialogues: DialogueItem[]): void {
    this.clearAll();
    const speakerCounts = new Map<string, number>();

    for (let i = 0; i < dialogues.length; i += 1) {
      const dialogue = dialogues[i];
      const normalizedSpeaker = this.getResolvedNormalizedSpeakerName(dialogue.name);

      const sequence = (speakerCounts.get(normalizedSpeaker) ?? 0) + 1;
      speakerCounts.set(normalizedSpeaker, sequence);

      const soundPath =
        `/assets/sounds/${normalizedSpeaker}/${normalizedSpeaker}_${sequence}.mp3`;
      const alias = `magicWordsDialogue_${normalizedSpeaker}_${sequence}_${i}`;
      this.dialogueSoundAliases.push(alias);

      if (sound.exists(alias)) {
        continue;
      }

      sound.add(alias, soundPath);
      this.ownedDialogueSoundAliases.add(alias);
    }
  }

  play(dialogueIndex: number): void {
    const alias = this.dialogueSoundAliases[dialogueIndex];
    if (!alias) {
      return;
    }

    try {
      sound.stop(alias);
      sound.play(alias);
      this.activeDialogueSoundAlias = alias;
    } catch {
      this.activeDialogueSoundAlias = null;
    }
  }

  stopActive(): void {
    if (!this.activeDialogueSoundAlias) {
      return;
    }

    sound.stop(this.activeDialogueSoundAlias);
    this.activeDialogueSoundAlias = null;
  }

  destroy(): void {
    this.stopActive();
    this.clearAll();
  }

  private clearAll(): void {
    for (const alias of this.ownedDialogueSoundAliases) {
      if (!sound.exists(alias)) {
        continue;
      }
      sound.remove(alias);
    }

    this.ownedDialogueSoundAliases.clear();
    this.dialogueSoundAliases.length = 0;
    this.activeDialogueSoundAlias = null;
  }

  private getResolvedNormalizedSpeakerName(name: string): string {
    const availableSpeakers = new Set(
      Object.keys(MagicWordsSceneConfig.avatar.slots).map((speaker) =>
        speaker.toLowerCase(),
      ),
    );
    const lowered = name.trim().toLowerCase();
    if (availableSpeakers.has(lowered)) {
      return lowered;
    }

    return MagicWordsSceneConfig.dialogue.fallbackSpeaker.toLowerCase();
  }
}