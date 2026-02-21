import { Application, Container, Graphics, Sprite } from "pixi.js";
import { createFireCircle } from "./fire";
import { FlameConfig } from "./config";
import type { ManagedScene } from "../../types/App";

export function createPhoenixFlameScene(app: Application): ManagedScene {
  // Sahne kok konteyneri.
  const container = new Container();
  // Tam ekran arka plan.
  const background = new Graphics();
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

  // Sag tarafta sabit duracak, animasyona girmeyecek tek flame sprite.
  const staticFlame = new Sprite(particleTexture);
  staticFlame.anchor.set(FlameConfig.staticFlame.anchor);
  staticFlame.alpha = FlameConfig.staticFlame.alpha;
  staticFlame.scale.set(FlameConfig.staticFlame.scale);
  staticFlame.blendMode = FlameConfig.staticFlame.blendMode;

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

  // Cizim sirasi: background -> sabit flame -> animasyonlu particles.
  container.addChild(background, staticFlame, particleLayer);
  app.stage.addChild(container);
  app.ticker.add(update);

  return {
    resize: ({ width, height }) => {
      // Rotate/resize'da bosluk gorunmemesi icin buyuk rect.
      const size =
        Math.max(width, height) * FlameConfig.background.overscanMultiplier;
      background.clear();
      background
        .fill({ color: FlameConfig.background.color })
        .rect(
          -size,
          -size,
          size * FlameConfig.background.overscanMultiplier,
          size * FlameConfig.background.overscanMultiplier,
        );

      // Particle emit merkezi (ekranin orta-alt bolgesi).
      centerX = width * FlameConfig.emitter.xRatio;
      centerY =
        height * FlameConfig.emitter.yRatio +
        Math.min(
          FlameConfig.emitter.yOffsetMax,
          height * FlameConfig.emitter.yOffsetHeightRatio,
        );

      // Sabit flame: ekranin saginda, animasyonsuz durur.
      staticFlame.position.set(
        width - FlameConfig.staticFlame.offsetRight,
        height * FlameConfig.staticFlame.yRatio,
      );
    },
    destroy: () => {
      // Ticker listener temizle.
      app.ticker.remove(update);
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
}