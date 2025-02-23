export class Particle {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number = 0;
  vy: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.homeX = x;
    this.homeY = y;
  }

  update(mouseX: number, mouseY: number, repulsionForce: number) {
    // Calculate distance from mouse
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Apply repulsion force
    if (distance < 100) {
      const force = (1 - distance / 100) * repulsionForce;
      this.vx += (dx / distance) * force * 0.1;
      this.vy += (dy / distance) * force * 0.1;
    }

    // Apply spring force to return to home position
    const homeForceX = (this.homeX - this.x) * 0.1;
    const homeForceY = (this.homeY - this.y) * 0.1;
    
    this.vx += homeForceX;
    this.vy += homeForceY;

    // Apply damping
    this.vx *= 0.8;
    this.vy *= 0.8;

    // Update position
    this.x += this.vx;
    this.y += this.vy;
  }
}
