import { Application, Container, Graphics, Sprite } from "pixi.js";
import { createFireCircle } from "./fire";
import type { ManagedScene } from "../../types/App";

export function createPhoenixFlameScene(app: Application): ManagedScene {
  // Sahne kok konteyneri.
  const container = new Container();
  // Tam ekran arka plan.
  const background = new Graphics();
  // Animasyonlu parcaciklar icin ayrik layer.
  const particleLayer = new Container();
  // Ekranda ayni anda gorunecek max parcacik sayisi.
  const maxParticles = 10;
  // Tek bir template sprite ureterek texture'i tum parcaciklarda paylasiyoruz.
  // Parlak merkezi biraz asagi almak icin 2. parametreyi artir (ornek: 18).
  const template = createFireCircle(150, 18);
  const particleTexture = template.texture;
  template.destroy();

  // Sag tarafta sabit duracak, animasyona girmeyecek tek flame sprite.
  const staticFlame = new Sprite(particleTexture);
  staticFlame.anchor.set(0.5);
  staticFlame.alpha = 0.95;
  staticFlame.scale.set(1.95);
  staticFlame.blendMode = "add";

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
    sprite.anchor.set(0.5);
    particleLayer.addChild(sprite);
    const particle: Particle = {
      sprite,
      lifeMs: 0,
      maxLifeMs: 0,
      vx: 0,
      vy: 0,
      startScale: 1,
      endScale: 1,
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
      if (p.lifeMs >= p.maxLifeMs * 0.85) {
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
      const size = Math.max(width, height) * 3;
      background.clear();
      background.fill({ color: 0x0b0d12 }).rect(-size, -size, size * 3, size * 3);

      // Particle emit merkezi (ekranin orta-alt bolgesi).
      centerX = width / 2;
      centerY = height / 2 + Math.min(80, height * 0.1);

      // Sabit flame: ekranin saginda, animasyonsuz durur.
      staticFlame.position.set(width - 200, height / 2);
    },
    destroy: () => {
      // Ticker listener'ini temizle.
      app.ticker.remove(update);
      // Tum display objelerini temizle.
      container.destroy({ children: true });
      // Paylasilan texture'i release et.
      particleTexture.destroy(true);
    },
  };

  function resetParticle(p: Particle, initialSpawn: boolean): void {
    // Yasam suresi.
    p.maxLifeMs = randomRange(400, 800);
    // Ilk acilista parcaciklarin cogu altta kalsin diye omrun sadece ilk kismina dagitiyoruz.
    p.lifeMs = initialSpawn ? randomRange(0, p.maxLifeMs * 0.1) : 0;
    // Hafif saga-sola sapma ve yukari akma (bazilari daha hizli yukselir).
    p.vx = randomRange(-0.1, 0.1);
    p.vy = randomRange(-0.60, -0.40);
    // Dogarken buyuk, sonda daha kucuk.
    p.startScale = randomRange(0.85, 0.95);
    p.endScale = randomRange(0.05, 0.20);
    // Emit merkezinin etrafinda jitter; y'yi biraz asagidan dogurtarak alevin tabanini dolu tutuyoruz.
    p.sprite.x = centerX + randomRange(-18, 18);
    p.sprite.y = centerY + randomRange(4, 8);
    // Yeni dogan parcacik aninda patlamasin diye 0.6 alpha ile baslat.
    p.sprite.alpha = initialSpawn ? Math.max(0.1, 1 - p.lifeMs / p.maxLifeMs) : 0.1;
    p.sprite.scale.set(p.startScale);
    // Additive blend, alev parlama hissi verir.
    p.sprite.blendMode = "add";
  }

  // Min-max arasi rastgele deger uretir.
  function randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  function initialPeakFade(t: number): number {
    const peak = 0.9;
    if (t < 0.25) {
      return 0.1 + ((peak - 0.1) * t) / 0.25;
    }
    return peak * (1 - (t - 0.25) / 0.75);
  }
}