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
    slots: {
      Sheldon: { xRatio: 0.15, yRatio: 0.5, side: "left" as const },
      Penny: { xRatio: 0.6, yRatio: 0.5, side: "right" as const },
      Leonard: { xRatio: 0.8, yRatio: 0.5, side: "right" as const },
    },
  },
  bubble: {
    left: {
      x: 220,
      y: -150,
      scaleX: -0.5,
      scaleY: 0.5,
      textY: -175,
    },
    right: {
      x: -220,
      y: -150,
      scaleX: 0.5,
      scaleY: 0.5,
      textY: -175,
    },
  },
  dialogue: {
    textStyle: {
      fill: 0x2a2a2a,
      fontSize: 22,
      fontFamily: "Inter, Arial, sans-serif",
      wordWrap: true,
      wordWrapWidth: 260,
    } as const,
    fallbackSpeaker: "Leonard",
  },
} as const;