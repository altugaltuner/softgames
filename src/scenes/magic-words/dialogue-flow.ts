import { gsap } from "gsap";
import { getEmojiTextureByName } from "./cache";
import { MagicWordsSceneConfig } from "./config";
import { renderInlineDialog } from "./dialog-renderer";
import type { MagicWordsDialogueAudio } from "./dialogue-audio";
import { magicWordsEvents } from "./events";
import type { AvatarSlot, DialogueItem, SpeakerName } from "./type";

type MagicWordsDialogueFlowOptions = {
  slots: Record<SpeakerName, AvatarSlot>;
  dialogueAudio: MagicWordsDialogueAudio;
};

type ShowNextDialogueOptions = {
  onPlaybackComplete?: () => void;
};

export class MagicWordsDialogueFlow {
  private readonly slots: Record<SpeakerName, AvatarSlot>;
  private readonly dialogueAudio: MagicWordsDialogueAudio;
  private dialogues: DialogueItem[] = [];
  private currentDialogueIndex = -1;
  private activeSpeaker: SpeakerName | null = null;

  constructor(options: MagicWordsDialogueFlowOptions) {
    this.slots = options.slots;
    this.dialogueAudio = options.dialogueAudio;
  }

  setDialogues(dialogues: DialogueItem[]): void {
    this.dialogues = dialogues;
  }

  hasDialogues(): boolean {
    return this.dialogues.length > 0;
  }

  resetIndex(): void {
    this.currentDialogueIndex = -1;
  }

  hideAllDialogues(): void {
    for (const slot of Object.values(this.slots)) {
      slot.bubble.visible = false;
      slot.dialogueContent.visible = false;
      slot.dialogueContent.removeChildren().forEach((child) => child.destroy());
      this.resetDialogueTransform(slot);
    }
  }

  showNextDialogue = (options: ShowNextDialogueOptions = {}): boolean => {
    if (this.dialogues.length === 0) {
      return false;
    }

    this.dialogueAudio.stopActive();
    this.hideAllDialogues();
    this.currentDialogueIndex = (this.currentDialogueIndex + 1) % this.dialogues.length;
    const dialogue = this.dialogues[this.currentDialogueIndex];
    magicWordsEvents.emit("dialogue:progress", {
      index: this.currentDialogueIndex,
      position: this.currentDialogueIndex + 1,
      total: this.dialogues.length,
      isFirst: this.currentDialogueIndex === 0,
      isLast: this.currentDialogueIndex === this.dialogues.length - 1,
      dialogue,
    });

    const speakerName = (dialogue.name in this.slots
      ? dialogue.name
      : MagicWordsSceneConfig.dialogue.fallbackSpeaker) as SpeakerName;
    const slot = this.slots[speakerName];
    this.activeSpeaker = speakerName;
    this.applyFocusScale(true);
    slot.bubble.visible = true;
    const inlineContent = renderInlineDialog(dialogue.text, getEmojiTextureByName, {
      textStyle: MagicWordsSceneConfig.dialogue.textStyle,
      resolution: MagicWordsSceneConfig.dialogue.resolution,
      maxWidth: MagicWordsSceneConfig.dialogue.textStyle.wordWrapWidth,
      emojiSize: Math.max(12, MagicWordsSceneConfig.dialogue.textStyle.fontSize * 1.25),
    });
    slot.dialogueContent.removeChildren().forEach((child) => child.destroy());
    slot.dialogueContent.addChild(inlineContent);
    slot.dialogueContent.visible = true;
    this.animateDialogueIn(slot);
    return this.dialogueAudio.play(this.currentDialogueIndex, {
      onComplete: options.onPlaybackComplete,
    });
  };

  resetDialogueTransform(slot: AvatarSlot): void {
    const base = this.getDialogueBasePosition(slot.side);
    gsap.killTweensOf(slot.dialogueContainer.scale);
    slot.dialogueContainer.pivot.set(0, 0);
    slot.dialogueContainer.position.set(base.x, base.y);
    slot.dialogueContainer.scale.set(1, 1);
  }

  applyFocusScale(animate: boolean): void {
    for (const [name, slot] of Object.entries(this.slots)) {
      const isActive = this.activeSpeaker === (name as SpeakerName);
      const targetScale =
        slot.baseScale * (isActive ? MagicWordsSceneConfig.avatar.focusScale : 1);

      if (!animate) {
        gsap.killTweensOf(slot.container.scale);
        slot.container.scale.set(targetScale);
        continue;
      }

      gsap.to(slot.container.scale, {
        x: targetScale,
        y: targetScale,
        duration: MagicWordsSceneConfig.avatar.focusDuration,
        ease: "power2.out",
        overwrite: true,
      });
    }
  }

  destroy(): void {
    for (const slot of Object.values(this.slots)) {
      gsap.killTweensOf(slot.container.scale);
      gsap.killTweensOf(slot.dialogueContainer.scale);
    }
  }

  private animateDialogueIn(slot: AvatarSlot): void {
    const base = this.getDialogueBasePosition(slot.side);
    const bounds = slot.dialogueContainer.getLocalBounds();
    const pivotX = slot.side === "left" ? bounds.x : bounds.x + bounds.width;
    const pivotY = bounds.y + bounds.height;

    slot.dialogueContainer.pivot.set(pivotX, pivotY);
    slot.dialogueContainer.position.set(base.x + pivotX, base.y + pivotY);

    gsap.killTweensOf(slot.dialogueContainer.scale);
    slot.dialogueContainer.scale.set(0.15, 0.15);
    gsap.to(slot.dialogueContainer.scale, {
      x: 1,
      y: 1,
      duration: 0.2,
      ease: "power2.out",
      overwrite: true,
    });
  }

  private getDialogueBasePosition(side: "left" | "right"): { x: number; y: number } {
    if (side === "left") {
      return {
        x: MagicWordsSceneConfig.bubble.left.x,
        y: MagicWordsSceneConfig.bubble.left.y,
      };
    }
    return {
      x: MagicWordsSceneConfig.bubble.right.x,
      y: MagicWordsSceneConfig.bubble.right.y,
    };
  }
}
