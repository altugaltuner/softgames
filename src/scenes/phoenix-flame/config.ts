export const FlameConfig = {
  // Ekranda ayni anda aktif particle sayisi.
  maxParticles: 10,

  // Fire texture template ayarlari.
  fireTemplate: {
    // Uretilen dairenin yaricapi.
    radius: 150,
    // Parlak merkezi asagi kaydirir.
    hotspotOffsetY: 18,
  },

  // Tam ekran arka plan ayarlari.
  background: {
    // Dolu arka plan rengi.
    color: 0x0b0d12,
    // Resize'da kenar boslugu birakmamak icin buyutme katsayisi.
    overscanMultiplier: 3,
  },

  // Sabit flame sprite ayarlari.
  staticFlame: {
    // Sprite merkez anchor.
    anchor: 0.5,
    // Sabit flame saydamligi.
    alpha: 0.95,
    // Sabit flame olcegi.
    scale: 1.95,
    // Additive blend ile parlama etkisi.
    blendMode: "add",
    // Ekranin sagindan iceri ofset.
    offsetRight: 200,
    // Dikey konum orani.
    yRatio: 0.5,
  },

  // Particle emit merkezi ve spawn dagilimi.
  emitter: {
    // Emit merkezinin yatay orani.
    xRatio: 0.5,
    // Emit merkezinin dikey orani.
    yRatio: 0.5,
    // Dikey ek offset ust limiti.
    yOffsetMax: 80,
    // Ekran yuksekligine gore dikey offset orani.
    yOffsetHeightRatio: 0.1,
    // Dogus aninda yatay jitter araligi.
    spawnJitterX: { min: -18, max: 18 },
    // Dogus aninda dikey jitter araligi.
    spawnJitterY: { min: 4, max: 8 },
  },

  // Particle yasam ve hareket ayarlari.
  particle: {
    // Omrun sonuna gelmeden resetleme orani.
    resetEarlyRatio: 0.85,
    // Yasam suresi araligi (ms).
    lifeMs: { min: 400, max: 800 },
    // Ilk spawn'da omrun ne kadarina dagitilacagi.
    initialLifePortion: 0.1,
    // Yatay hiz araligi.
    velocityX: { min: -0.1, max: 0.1 },
    // Dikey hiz araligi.
    velocityY: { min: -0.6, max: -0.4 },
    // Dogus olcegi araligi.
    startScale: { min: 0.85, max: 0.95 },
    // Omur sonu olcegi araligi.
    endScale: { min: 0.05, max: 0.2 },
    // Dogus alpha tabani.
    initialAlpha: 0.1,
    // Particle sprite anchor.
    anchor: 0.5,
    // Ilk state icin varsayilan olcek.
    defaultScale: 1,
    // Additive blend ile alev etkisi.
    blendMode: "add",
  },

  // Alpha fade egirisi ayarlari.
  fade: {
    // Ulasilan en yuksek alpha.
    peakAlpha: 0.9,
    // Baslangic alpha degeri.
    startAlpha: 0.1,
    // Peak'e cikis icin kullanilan omur orani.
    peakUntilRatio: 0.25,
  },
} as const;

