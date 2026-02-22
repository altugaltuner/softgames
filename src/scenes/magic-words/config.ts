export const MagicWordsSceneConfig = {
  assets: {
    endpointUrl:
      "https://private-624120-softgamesassignment.apiary-mock.com/v2/magicwords",
    bubblePath: "/assets/ui/bubble.png",
  },
  labels: {
    root: "MagicWordsScene",
    nextButton: "NextDialogueButton",
  },
  button: {
    text: "Next Dialogue",
    width: 180,
    height: 48,
    radius: 12,
    fillColor: 0x2f5bd5,
    strokeColor: 0xffffff,
    strokeWidth: 1,
    emojiSize: 16,
    emojiCornerRadiusRatio: 1,
    strokeAlpha: 0.35,
    bottomOffset: 48,
    textStyle: {
      fill: 0xffffff,
      fontSize: 18,
      fontFamily: "Inter, Arial, sans-serif",
      fontWeight: "700",
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
      fontFamily: "Inter, Arial, sans-serif",
      fontWeight: "700",
      align: "center",
    } as const,
    slots: {
      Sheldon: {
        side: "left" as const,
        landscape: { xRatio: 0.15, yRatio: 0.5 },
        portrait: { xRatio: 0.2, yRatio: 0.5 },
      },
      Penny: {
        side: "right" as const,
        landscape: { xRatio: 0.6, yRatio: 0.5 },
        portrait: { xRatio: 0.6, yRatio: 0.5 }, // { xRatio: 0.75, yRatio: 0.30 }
      },
      Leonard: {
        side: "right" as const,
        landscape: { xRatio: 0.8, yRatio: 0.5 },
        portrait: { xRatio: 0.8, yRatio: 0.5 }, // { xRatio: 0.75, yRatio: 0.65 }
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
      fontSize: 9,
      fontFamily: "Inter, Arial, sans-serif",
      wordWrap: true,
      wordWrapWidth: 100,
    } as const,
    fallbackSpeaker: "Leonard",
  },
} as const;