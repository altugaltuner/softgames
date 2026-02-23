import { Application, Assets, Container, Sprite, Texture } from "pixi.js";
import { sound } from "@pixi/sound";
import { createFireCircle } from "./fire";
import { FlameConfig } from "./config";
import type { ManagedScene } from "../../types/App";

const fireBackgroundPath = "/assets/ui/fire-bg.webp";
const torchPath = "/assets/textures/torch.png";
const fireSoundPath = "/assets/sounds/fire-sound.mp3";
const fireSoundAlias = "phoenixFlameFireSound";

export function createPhoenixFlameScene(app: Application): ManagedScene {
  // Sahne kok konteyneri.
  const container = new Container();
  // Tam ekran image background (oran korunarak cover olur).
  const background = new Sprite(Texture.WHITE);
  background.anchor.set(0.5);
  background.alpha = 0;
  background.label = "fireBackground";
  const torch = new Sprite(Texture.WHITE);
  torch.anchor.set(0.5);
  torch.alpha = 0;
  torch.label = "torch";
  let viewportWidth = app.screen.width;
  let viewportHeight = app.screen.height;
  let ownsFireSoundAlias = false;
  // Animasyonlu parcaciklar icin ayrik layer.
  const particleLayer = new Container();
  // Ekranda ayni anda gorunecek max parcacik sayisi.
  const maxParticles = FlameConfig.maxParticles;
  // Tek bir template sprite ureterek texture'i tum parcaciklarda paylasiyoruz.
  // Parlak merkezi biraz asagi almak icin 2. parametreyi artir (ornek: 18).
  const template = createFireCircle(
    FlameConfig.fireTemplate.radius,
    FlameConfig.fireTemplate.hotspotOffsetY,
  );
  const particleTexture = template.texture;
  template.destroy();

  // Her parcacik icin runtime state.
  type Particle = {
    sprite: Sprite;
    lifeMs: number;
    maxLifeMs: number;
    vx: number;
    vy: number;
    startScale: number;
    endScale: number;
  };

  const particles: Particle[] = [];
  // Emit noktasi (resize ile guncellenir).
  let centerX = 0;
  let centerY = 0;

  // Pool: bastan 10 sprite olusturup reuse ediyoruz.
  for (let i = 0; i < maxParticles; i += 1) {
    const sprite = new Sprite(particleTexture);
    sprite.anchor.set(FlameConfig.particle.anchor);
    particleLayer.addChild(sprite);
    const particle: Particle = {
      sprite,
      lifeMs: 0,
      maxLifeMs: 0,
      vx: 0,
      vy: 0,
      startScale: FlameConfig.particle.defaultScale,
      endScale: FlameConfig.particle.defaultScale,
    };
    resetParticle(particle, true);
    particles.push(particle);
  }

  // Her frame particle hareket/alpha/scale guncellemesi.
  const update = () => {
    const dt = app.ticker.deltaMS;
    for (const p of particles) {
      p.lifeMs += dt;
      // Omrun sonuna gelmeden biraz erken resetleyerek taban boslugunu azaltiyoruz.
      if (p.lifeMs >= p.maxLifeMs * FlameConfig.particle.resetEarlyRatio) {
        resetParticle(p, false);
        continue;
      }

      // 0..1 normalized progress.
      const t = p.lifeMs / p.maxLifeMs;
      // Basit velocity tabanli hareket.
      p.sprite.x += p.vx * dt;
      p.sprite.y += p.vy * dt;
      // Dogusta 0.6 alpha ile baslar, sonra tepeye kadar hafif artip tekrar solar.
      p.sprite.alpha = initialPeakFade(t);
      // Omur ilerledikce kuculme.
      p.sprite.scale.set(p.startScale + (p.endScale - p.startScale) * t);
    }
  };

  // Cizim sirasi: background -> torch -> animasyonlu particles.
  container.addChild(background, torch, particleLayer);
  app.stage.addChild(container);
  app.ticker.add(update);
  if (!sound.exists(fireSoundAlias)) {
    sound.add(fireSoundAlias, fireSoundPath);
    ownsFireSoundAlias = true;
  }
  sound.play(fireSoundAlias, { loop: true, volume: 0.5 });
  Assets.load<Texture>(fireBackgroundPath)
    .then((texture) => {
      background.texture = texture;
      background.alpha = 1;
      layoutBackground(viewportWidth, viewportHeight);
    })
    .catch(() => {
      // Asset yuklenemezse sahne calismaya devam etsin.
      background.alpha = 0;
    });
  Assets.load<Texture>(torchPath)
    .then((texture) => {
      torch.texture = texture;
      torch.alpha = 1;
      layoutTorch(viewportWidth, viewportHeight);
    })
    .catch(() => {
      // Asset yuklenemezse sahne calismaya devam etsin.
      torch.alpha = 0;
    });

  return {
    resize: ({ width, height }) => {
      viewportWidth = width;
      viewportHeight = height;
      // Arka plani orani koruyarak tum ekrani kaplayacak sekilde olcekle.
      layoutBackground(width, height);
      // Torch sprite'ini merkeze oran koruyarak yerlestir.
      layoutTorch(width, height);

      // Particle emit merkezi (ekranin orta-alt bolgesi).
      centerX = width * FlameConfig.emitter.xRatio;
      centerY =
        height * FlameConfig.emitter.yRatio +
        Math.min(
          FlameConfig.emitter.yOffsetMax,
          height * FlameConfig.emitter.yOffsetHeightRatio,
        ) +
        FlameConfig.placement.yOffset;

    },
    destroy: () => {
      // Ticker listener temizle.
      app.ticker.remove(update);
      // Sahne kapanirken sesi durdur.
      sound.stop(fireSoundAlias);
      if (ownsFireSoundAlias && sound.exists(fireSoundAlias)) {
        sound.remove(fireSoundAlias);
      }
      // Tum display objelerini temizle.
      container.destroy({ children: true });
      // Paylasilan texture'i release et.
      particleTexture.destroy(true);
    },
  };

  function resetParticle(p: Particle, initialSpawn: boolean): void {
    // Yasam suresi.
    p.maxLifeMs = randomRange(
      FlameConfig.particle.lifeMs.min,
      FlameConfig.particle.lifeMs.max,
    );
    // Ilk acilista parcaciklarin cogu altta kalsin diye omrun sadece ilk kismina dagitiyoruz.
    p.lifeMs = initialSpawn
      ? randomRange(0, p.maxLifeMs * FlameConfig.particle.initialLifePortion)
      : 0;
    // Hafif saga-sola sapma ve yukari akma (bazilari daha hizli yukselir).
    p.vx = randomRange(
      FlameConfig.particle.velocityX.min,
      FlameConfig.particle.velocityX.max,
    );
    p.vy = randomRange(
      FlameConfig.particle.velocityY.min,
      FlameConfig.particle.velocityY.max,
    );
    // Dogarken buyuk, sonda daha kucuk.
    p.startScale = randomRange(
      FlameConfig.particle.startScale.min,
      FlameConfig.particle.startScale.max,
    );
    p.endScale = randomRange(
      FlameConfig.particle.endScale.min,
      FlameConfig.particle.endScale.max,
    );
    // Emit merkezinin etrafinda jitter; y'yi biraz asagidan dogurtarak alevin tabanini dolu tutuyoruz.
    p.sprite.x =
      centerX +
      randomRange(
        FlameConfig.emitter.spawnJitterX.min,
        FlameConfig.emitter.spawnJitterX.max,
      );
    p.sprite.y =
      centerY +
      randomRange(
        FlameConfig.emitter.spawnJitterY.min,
        FlameConfig.emitter.spawnJitterY.max,
      );
    // Yeni dogan parcacik aninda patlamasin diye 0.6 alpha ile baslat.
    p.sprite.alpha = initialSpawn
      ? Math.max(FlameConfig.particle.initialAlpha, 1 - p.lifeMs / p.maxLifeMs)
      : FlameConfig.particle.initialAlpha;
    p.sprite.scale.set(p.startScale);
    // Additive blend, alev parlama hissi verir.
    p.sprite.blendMode = FlameConfig.particle.blendMode;
  }

  // Min-max arasi rastgele deger uretir.
  function randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  function initialPeakFade(t: number): number {
    const peak = FlameConfig.fade.peakAlpha;
    if (t < FlameConfig.fade.peakUntilRatio) {
      return (
        FlameConfig.fade.startAlpha +
        ((peak - FlameConfig.fade.startAlpha) * t) /
        FlameConfig.fade.peakUntilRatio
      );
    }
    return (
      peak *
      (1 - (t - FlameConfig.fade.peakUntilRatio) /
        (1 - FlameConfig.fade.peakUntilRatio))
    );
  }

  function layoutBackground(width: number, height: number): void {
    const textureWidth = background.texture.width || 1;
    const textureHeight = background.texture.height || 1;
    const coverScale = Math.max(width / textureWidth, height / textureHeight);
    background.position.set(width / 2, height / 2);
    background.scale.set(coverScale);
  }

  function layoutTorch(width: number, height: number): void {
    const textureWidth = torch.texture.width || 1;
    const textureHeight = torch.texture.height || 1;
    const containScale = Math.min(width / textureWidth, height / textureHeight);
    torch.position.set(width / 2, height / 1.4 + FlameConfig.placement.yOffset);
    torch.scale.set(containScale / 2);
  }
}