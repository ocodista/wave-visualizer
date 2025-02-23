export class SmokeParticle {
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  opacity: number;
  size: number;
  color: string;
  decay: number;

  constructor(x: number, y: number, color: string = "white") {
    this.x = x;
    this.y = y;
    this.opacity = Math.random() * 0.5 + 0.3;
    this.size = Math.random() * 8 + 4;
    this.color = color;
    this.decay = 0.01 + Math.random() * 0.01;
  }

  update(
    mouseX: number,
    mouseY: number,
    force: number,
    canvasWidth: number,
    canvasHeight: number
  ): boolean {
    // Add turbulence
    this.vx += (Math.random() - 0.5) * 0.2;
    this.vy -= 0.1 + Math.random() * 0.1; // Gentle upward drift

    // Apply forces from mouse/touch
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 100) {
      const angle = Math.atan2(dy, dx);
      const pushForce = (1 - distance / 100) * force * 0.01;
      this.vx += Math.cos(angle) * pushForce;
      this.vy += Math.sin(angle) * pushForce;
    }

    // Apply damping
    this.vx *= 0.98;
    this.vy *= 0.98;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Update opacity and size
    this.opacity -= this.decay;
    this.size += 0.1;

    // Boundary checks
    this.x = Math.max(0, Math.min(this.x, canvasWidth));
    this.y = Math.max(0, Math.min(this.y, canvasHeight));

    // Return false when particle should be removed
    return this.opacity > 0;
  }
}
