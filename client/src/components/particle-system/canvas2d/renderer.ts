import { Particle } from "../particle";

export class Canvas2DRenderer {
  private particles: Particle[] = [];
  private ctx: CanvasRenderingContext2D;
  private startTime: number;
  private mouseX: number = 0;
  private mouseY: number = 0;

  constructor(canvas: HTMLCanvasElement, particleCount: number) {
    console.log("Initializing Canvas2D renderer with", particleCount, "particles");

    // Get the 2D context with explicit error handling
    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true
    });

    if (!ctx) {
      console.error("Failed to get 2D context");
      throw new Error('Canvas 2D context not supported');
    }

    this.ctx = ctx;
    this.startTime = performance.now();

    // Create initial particles in a grid
    const cols = Math.ceil(Math.sqrt(particleCount));
    const rows = Math.ceil(particleCount / cols);
    const spacingX = canvas.width / cols;
    const spacingY = canvas.height / rows;

    for (let i = 0; i < particleCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = spacingX * (col + 0.5);
      const y = spacingY * (row + 0.5);
      this.particles.push(new Particle(x, y));
    }
    console.log("Created", this.particles.length, "particles");
  }

  public setMousePosition(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
  }

  public resize(width: number, height: number): void {
    console.log("Resizing canvas to", width, "x", height);
    this.ctx.canvas.width = width;
    this.ctx.canvas.height = height;
  }

  public render(repulsionForce: number = 50): void {
    const currentTime = (performance.now() - this.startTime) / 1000;

    // Clear canvas with slight fade effect
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // Update and draw particles
    this.ctx.globalCompositeOperation = 'lighter';

    this.particles.forEach((particle, index) => {
      // Update particle
      particle.update(
        this.mouseX,
        this.mouseY,
        repulsionForce,
        currentTime,
        this.ctx.canvas.width,
        this.ctx.canvas.height
      );

      // Draw particle with glow effect
      const radius = 2;
      const glowRadius = 4;

      // Draw the main particle
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.color;
      this.ctx.fill();

      // Draw the glow effect
      const gradient = this.ctx.createRadialGradient(
        particle.x, particle.y, radius,
        particle.x, particle.y, glowRadius
      );
      gradient.addColorStop(0, particle.color);
      gradient.addColorStop(1, particle.color.replace('0.8)', '0)'));

      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, glowRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    });

    // Reset composite operation
    this.ctx.globalCompositeOperation = 'source-over';
  }

  public destroy(): void {
    console.log("Canvas2D renderer destroyed");
  }
}