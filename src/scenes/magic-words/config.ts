export const MagicWordsSceneConfig = {
  assets: {
    // Dialogue payload includes avatars, emojis and dialogue lines.
    endpointUrl:
      "https://private-624120-softgamesassignment.apiary-mock.com/v2/magicwords",
    bubblePath: "/assets/ui/bubble.png",
  },
  labels: {
    root: "MagicWordsScene",
    nextButton: "NextDialogueButton",
  },
  header: {
    text: "Magic Words",
    topOffset: 88,
    resolution: 3,
    textStyle: {
      fill: 0xffffff,
      fontSize: 48,
      fontFamily: "Bungee, sans-serif",
      fontWeight: "400",
    } as const,
  },
  interaction: {
    controlsGap: 12,
    buttonHoverOffset: -5,
    buttonAnimDuration: 0.2,
    autoPlayIntervalMs: 3000,
    // Used when an audio complete callback does not fire.
    autoPlayAudioSafetyTimeoutMs: 15000,
    nextButton: {
      hoverFillColor: 0x004b08,
      pressedFillColor: 0x003d06,
    },
    playPauseButton: {
      normalFillColor: 0xffffff,
      hoverFillColor: 0xd9d9d9,
      pressedFillColor: 0xbfbfbf,
    },
  },
  button: {
    text: "Next Dialogue",
    resolution: 5,
    width: 180,
    height: 48,
    radius: 12,
    fillColor: 0x0005709,
    strokeColor: 0xffffff,
    strokeWidth: 1,
    emojiSize: 16,
    emojiCornerRadiusRatio: 1,
    strokeAlpha: 0.35,
    bottomOffset: 48,
    textStyle: {
      fill: 0xffffff,
      fontSize: 18,
      fontFamily: "Bungee, sans-serif",
      fontWeight: "400",
    } as const,
  },
  avatar: {
    minSize: 64,
    sizeRatioToViewport: 0.2,
    focusScale: 1.1,
    focusDuration: 0.4,
    nameOffsetY: 50,
    nameTextStyle: {
      fill: 0xffffff,
      fontSize: 12,
      fontFamily: "Bungee, sans-serif",
      fontWeight: "400",
      align: "center",
    } as const,
    slots: {
      // Slot coordinates are ratios so layout scales with viewport size/orientation.
      Sheldon: {
        side: "left" as const,
        landscape: { xRatio: 0.15, yRatio: 0.5 },
        portrait: { xRatio: 0.2, yRatio: 0.5 },
      },
      Penny: {
        side: "right" as const,
        landscape: { xRatio: 0.6, yRatio: 0.5 },
        portrait: { xRatio: 0.6, yRatio: 0.5 },
      },
      Leonard: {
        side: "right" as const,
        landscape: { xRatio: 0.8, yRatio: 0.5 },
        portrait: { xRatio: 0.8, yRatio: 0.5 },
      },
    },
  },
  bubble: {
    left: {
      x: 75,
      y: -60,
      scaleX: -0.2,
      scaleY: 0.2,
      textY: -68,
    },
    right: {
      x: -75,
      y: -60,
      scaleX: 0.2,
      scaleY: 0.2,
      textY: -68,
    },
  },
  dialogue: {
    resolution: 5,
    textStyle: {
      fill: 0x2a2a2a,
      fontSize: 8,
      fontFamily: "Aldrich, sans-serif",
      fontWeight: "400",
      wordWrap: true,
      // Keep text narrow enough to stay inside bubble graphics.
      wordWrapWidth: 105,
    } as const,
    fallbackSpeaker: "Leonard",
  },
} as const;