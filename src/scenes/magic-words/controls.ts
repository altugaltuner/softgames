import { gsap } from "gsap";
import { Container, Graphics } from "pixi.js";
import { MagicWordsSceneConfig } from "./config";
import type { MagicWordsControlsOptions } from "./type";

export class MagicWordsControls {
  private readonly options: MagicWordsControlsOptions;
  private isAutoPlaying = false;
  private hasAutoPlayStarted = false;
  private autoPlayFallbackTimerId: number | null = null;
  private autoPlayCycleId = 0;

  constructor(options: MagicWordsControlsOptions) {
    this.options = options;
  }

  setup(): void {
    this.setupNextButton();
    this.setupPlayPauseButton();
  }

  destroy(): void {
    this.options.nextButton.off("pointertap", this.onNextButtonTap);
    this.options.playPauseButton.off("pointertap", this.togglePlayPause);
    this.stopAutoPlay();
  }

  private setupNextButton(): void {
    this.options.nextButton.label = MagicWordsSceneConfig.labels.nextButton;
    this.options.nextButton.eventMode = "static";
    this.options.nextButton.cursor = "pointer";
    this.options.nextButton.pivot.set(
      MagicWordsSceneConfig.button.width * 0.5,
      MagicWordsSceneConfig.button.height * 0.5,
    );

    this.options.nextButtonBg
      .roundRect(
        0,
        0,
        MagicWordsSceneConfig.button.width,
        MagicWordsSceneConfig.button.height,
        MagicWordsSceneConfig.button.radius,
      )
      .fill({ color: MagicWordsSceneConfig.button.fillColor })
      .stroke({
        color: MagicWordsSceneConfig.button.strokeColor,
        width: MagicWordsSceneConfig.button.strokeWidth,
        alpha: MagicWordsSceneConfig.button.strokeAlpha,
      });

    this.options.nextButtonText.anchor.set(0.5);
    this.options.nextButtonText.position.set(
      MagicWordsSceneConfig.button.width * 0.5,
      MagicWordsSceneConfig.button.height * 0.5,
    );

    this.options.nextButton.addChild(
      this.options.nextButtonBg,
      this.options.nextButtonText,
    );
    this.options.nextButton.on("pointertap", this.onNextButtonTap);
    this.setupButtonInteractions(
      this.options.nextButton,
      this.options.nextButtonBg,
      MagicWordsSceneConfig.button.width,
      MagicWordsSceneConfig.button.height,
      MagicWordsSceneConfig.button.fillColor,
      MagicWordsSceneConfig.interaction.nextButton.hoverFillColor,
      MagicWordsSceneConfig.interaction.nextButton.pressedFillColor,
    );
  }

  private setupPlayPauseButton(): void {
    const size = MagicWordsSceneConfig.button.height;
    this.options.playPauseButton.label = MagicWordsSceneConfig.labels.playPauseButton;
    this.options.playPauseButton.eventMode = "static";
    this.options.playPauseButton.cursor = "pointer";
    this.options.playPauseButton.pivot.set(size * 0.5, size * 0.5);

    this.options.playPauseButtonBg
      .roundRect(0, 0, size, size, MagicWordsSceneConfig.button.radius)
      .fill({ color: MagicWordsSceneConfig.interaction.playPauseButton.normalFillColor })
      .stroke({
        color: MagicWordsSceneConfig.button.strokeColor,
        width: MagicWordsSceneConfig.button.strokeWidth,
        alpha: MagicWordsSceneConfig.button.strokeAlpha,
      });

    this.options.playIcon.anchor.set(0.5);
    this.options.playIcon.position.set(size * 0.5, size * 0.5);
    this.options.playIcon.width = MagicWordsSceneConfig.button.icon.size;
    this.options.playIcon.height = MagicWordsSceneConfig.button.icon.size;
    this.options.playIcon.tint = MagicWordsSceneConfig.button.icon.tint;

    this.options.pauseIcon.anchor.set(0.5);
    this.options.pauseIcon.position.set(size * 0.5, size * 0.5);
    this.options.pauseIcon.width = MagicWordsSceneConfig.button.icon.size;
    this.options.pauseIcon.height = MagicWordsSceneConfig.button.icon.size;
    this.options.pauseIcon.tint = MagicWordsSceneConfig.button.icon.tint;
    this.options.pauseIcon.visible = false;

    this.options.playPauseButton.addChild(
      this.options.playPauseButtonBg,
      this.options.playIcon,
      this.options.pauseIcon,
    );
    this.options.playPauseButton.on("pointertap", this.togglePlayPause);
    this.updatePlayPauseIcon();
    this.setupButtonInteractions(
      this.options.playPauseButton,
      this.options.playPauseButtonBg,
      size,
      size,
      MagicWordsSceneConfig.interaction.playPauseButton.normalFillColor,
      MagicWordsSceneConfig.interaction.playPauseButton.hoverFillColor,
      MagicWordsSceneConfig.interaction.playPauseButton.pressedFillColor,
    );
  }

  private setupButtonInteractions(
    button: Container,
    background: Graphics,
    width: number,
    height: number,
    normalColor: number,
    hoverColor: number,
    pressedColor: number,
  ): void {
    // Keep interaction animation/color logic in one place so both controls behave consistently.
    button.on("pointerover", () => {
      this.drawButtonBackground(background, width, height, hoverColor);
      gsap.to(button.position, {
        y: MagicWordsSceneConfig.interaction.buttonHoverOffset,
        duration: MagicWordsSceneConfig.interaction.buttonAnimDuration,
        ease: MagicWordsSceneConfig.interaction.buttonAnimEase,
        overwrite: true,
      });
    });

    button.on("pointerout", () => {
      this.drawButtonBackground(background, width, height, normalColor);
      gsap.to(button.position, {
        y: MagicWordsSceneConfig.interaction.buttonRestOffset,
        duration: MagicWordsSceneConfig.interaction.buttonAnimDuration,
        ease: MagicWordsSceneConfig.interaction.buttonAnimEase,
        overwrite: true,
      });
    });

    button.on("pointerdown", () => {
      this.drawButtonBackground(background, width, height, pressedColor);
    });

    button.on("pointerup", () => {
      this.drawButtonBackground(background, width, height, hoverColor);
    });

    button.on("pointerupoutside", () => {
      this.drawButtonBackground(background, width, height, normalColor);
      gsap.to(button.position, {
        y: MagicWordsSceneConfig.interaction.buttonRestOffset,
        duration: MagicWordsSceneConfig.interaction.buttonAnimDuration,
        ease: MagicWordsSceneConfig.interaction.buttonAnimEase,
        overwrite: true,
      });
    });
  }

  private drawButtonBackground(
    background: Graphics,
    width: number,
    height: number,
    color: number,
  ): void {
    background.clear();
    background
      .roundRect(0, 0, width, height, MagicWordsSceneConfig.button.radius)
      .fill({ color })
      .stroke({
        color: MagicWordsSceneConfig.button.strokeColor,
        width: MagicWordsSceneConfig.button.strokeWidth,
        alpha: MagicWordsSceneConfig.button.strokeAlpha,
      });
  }

  private togglePlayPause = (): void => {
    if (this.isAutoPlaying) {
      this.stopAutoPlay();
      return;
    }
    this.startAutoPlay();
  };

  private onNextButtonTap = (): void => {
    if (!this.isAutoPlaying) {
      this.options.onShowNextDialogue();
      return;
    }
    this.playAndAwaitCompletion();
  };

  private playAndAwaitCompletion(): void {
    this.clearAutoPlayFallbackTimer();
    // Cycle id invalidates stale callbacks when autoplay is paused/restarted mid-playback.
    const cycleId = ++this.autoPlayCycleId;
    const handlePlaybackComplete = () => {
      if (!this.isAutoPlaying || cycleId !== this.autoPlayCycleId) {
        return;
      }
      this.playAndAwaitCompletion();
    };

    const hasAudioPlayback = this.options.onShowNextDialogue({
      onPlaybackComplete: handlePlaybackComplete,
    });
    const fallbackWaitMs = hasAudioPlayback
      ? MagicWordsSceneConfig.interaction.autoPlayAudioSafetyTimeoutMs
      : MagicWordsSceneConfig.interaction.autoPlayIntervalMs;
    // Safety fallback continues autoplay even if the audio completion callback never fires.
    this.autoPlayFallbackTimerId = window.setTimeout(
      handlePlaybackComplete,
      fallbackWaitMs,
    );
  }

  private clearAutoPlayFallbackTimer(): void {
    if (this.autoPlayFallbackTimerId === null) {
      return;
    }
    window.clearTimeout(this.autoPlayFallbackTimerId);
    this.autoPlayFallbackTimerId = null;
  }

  private startAutoPlay(): void {
    if (!this.options.hasDialogues()) {
      return;
    }

    if (!this.hasAutoPlayStarted) {
      // Start autoplay from the first line on the very first run.
      this.options.onResetDialogueIndex();
      this.hasAutoPlayStarted = true;
    }

    this.isAutoPlaying = true;
    this.updatePlayPauseIcon();
    this.playAndAwaitCompletion();
  }

  private stopAutoPlay(): void {
    this.isAutoPlaying = false;
    this.updatePlayPauseIcon();
    this.autoPlayCycleId += 1;
    this.clearAutoPlayFallbackTimer();
  }

  private updatePlayPauseIcon(): void {
    this.options.playIcon.visible = !this.isAutoPlaying;
    this.options.pauseIcon.visible = this.isAutoPlaying;
  }
}
