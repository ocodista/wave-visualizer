export class Particle {
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  color: [number, number, number];
  size: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    // Convert HSL to RGB for WebGL
    const hue = Math.random() * 360;
    const s = 0.8;
    const l = 0.7;

    // HSL to RGB conversion
    const h = hue / 360;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    const hueToRGB = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const r = hueToRGB(p, q, h + 1/3);
    const g = hueToRGB(p, q, h);
    const b = hueToRGB(p, q, h - 1/3);

    this.color = [r, g, b];
    this.size = 4;
  }

  update(mouseX: number, mouseY: number, force: number, canvasWidth: number, canvasHeight: number) {
    // Calculate distance to mouse
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001;

    if (distance < 100) {
      const angle = Math.atan2(dy, dx);
      const pushForce = (1 - distance / 100) * force * 0.02;
      this.vx += Math.cos(angle) * pushForce;
      this.vy += Math.sin(angle) * pushForce;
    }

    // Apply damping
    this.vx *= 0.95;
    this.vy *= 0.95;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Boundary check
    this.x = Math.max(0, Math.min(this.x, canvasWidth));
    this.y = Math.max(0, Math.min(this.y, canvasHeight));
  }

  // Get data for WebGL buffers
  getBufferData(): number[] {
    return [this.x, this.y, ...this.color, this.size];
  }
}