import type { Point } from "@/utils/geometry";

interface Particle {
  position: Point;
  velocity: Point;
  life: number;
  size: number;
  hue: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  constructor(private readonly limit: number) {}

  emit(origin: Point, count: number, scale = 1): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.limit) {
        break;
      }
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 80;
      this.particles.push({
        position: { x: origin.x, y: origin.y },
        velocity: {
          x: Math.cos(angle) * speed * scale,
          y: Math.sin(angle) * speed * scale,
        },
        life: 0.6,
        size: 2 + Math.random() * 4,
        hue: Math.floor(Math.random() * 60) + 300,
      });
    }
  }

  update(dt: number): void {
    this.particles = this.particles
      .map((particle) => ({
        ...particle,
        position: {
          x: particle.position.x + particle.velocity.x * dt,
          y: particle.position.y + particle.velocity.y * dt,
        },
        life: particle.life - dt,
      }))
      .filter((particle) => particle.life > 0);
  }

  draw(
    p: p5,
    reducedMotionScale = 1,
  ): void {
    const alphaScale = reducedMotionScale;
    this.particles.forEach((particle) => {
      p.push();
      p.noStroke();
      p.fill(`hsla(${particle.hue}, 85%, 70%, ${particle.life * 0.25 * alphaScale})`);
      p.ellipse(particle.position.x, particle.position.y, particle.size, particle.size);
      p.pop();
    });
  }

  clear(): void {
    this.particles = [];
  }
}
