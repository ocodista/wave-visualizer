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

    // Apply repulsion force with velocity-based movement
    if (distance < 150) {
      const force = (1 - distance / 150) * repulsionForce;
      // Add velocity instead of direct position change
      this.vx += (dx / distance) * force * 0.2;
      this.vy += (dy / distance) * force * 0.2;
    }

    // Apply spring force to return to home position with natural oscillation
    const homeForceX = (this.homeX - this.x) * 0.05;
    const homeForceY = (this.homeY - this.y) * 0.05;

    this.vx += homeForceX;
    this.vy += homeForceY;

    // Apply damping for more natural movement
    this.vx *= 0.95;
    this.vy *= 0.95;

    // Update position based on velocity
    this.x += this.vx;
    this.y += this.vy;
  }
}