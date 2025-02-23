export class Particle {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number = 0;
  vy: number = 0;
  mass: number;
  color: string;
  pressure: number = 0;
  density: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.homeX = x;
    this.homeY = y;
    this.mass = Math.random() * 0.5 + 0.5; // Random mass between 0.5 and 1
    const hue = Math.random() * 360;
    this.color = `hsl(${hue}, 80%, 70%)`;
  }

  update(
    mouseX: number,
    mouseY: number,
    repulsionForce: number,
    time: number,
    canvasWidth: number,
    canvasHeight: number,
    neighbors: Particle[] = []
  ) {
    // Calculate distance to wave source
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Wave parameters
    const waveSpeed = 3;
    const waveRadius = time * waveSpeed;
    const waveWidth = 40;

    // Apply wave force if within range
    if (Math.abs(distance - waveRadius) < waveWidth) {
      const wavePosition = Math.abs(distance - waveRadius) / waveWidth;
      const waveIntensity = Math.exp(-wavePosition * 1.5) * Math.sin(wavePosition * Math.PI);
      const timeDecay = Math.exp(-time * 0.02);
      const distanceDecay = Math.exp(-distance * 0.001);
      const waveForce = waveIntensity * timeDecay * distanceDecay * repulsionForce * 0.02;

      const angle = Math.atan2(dy, dx);
      this.vx += Math.cos(angle) * waveForce / this.mass;
      this.vy += Math.sin(angle) * waveForce / this.mass;
    }

    // Calculate pressure and density from neighbors
    this.pressure = 0;
    this.density = 0;
    const smoothingRadius = 30;

    neighbors.forEach(neighbor => {
      if (neighbor === this) return;

      const dx = neighbor.x - this.x;
      const dy = neighbor.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < smoothingRadius) {
        // Calculate density
        const influence = 1 - dist / smoothingRadius;
        this.density += neighbor.mass * influence;

        // Add pressure-based forces
        if (this.density > 1) {
          const pressureForce = (this.density - 1) * 0.1;
          this.vx -= (dx / dist) * pressureForce;
          this.vy -= (dy / dist) * pressureForce;
        }

        // Add viscosity
        const viscosity = 0.5;
        const dvx = neighbor.vx - this.vx;
        const dvy = neighbor.vy - this.vy;
        this.vx += dvx * influence * viscosity;
        this.vy += dvy * influence * viscosity;
      }
    });

    // Apply spring force to return to home position
    const springStrength = 0.025;
    const homeForceX = (this.homeX - this.x) * springStrength;
    const homeForceY = (this.homeY - this.y) * springStrength;

    this.vx += homeForceX / this.mass;
    this.vy += homeForceY / this.mass;

    // Apply damping
    const damping = 0.96;
    this.vx *= damping;
    this.vy *= damping;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Boundary check with energy loss and mass-based bouncing
    const bounceEnergy = 0.6 * this.mass; // Heavier particles bounce more
    if (this.x < 0 || this.x > canvasWidth) {
      this.vx *= -bounceEnergy;
      this.x = Math.max(0, Math.min(this.x, canvasWidth));
    }
    if (this.y < 0 || this.y > canvasHeight) {
      this.vy *= -bounceEnergy;
      this.y = Math.max(0, Math.min(this.y, canvasHeight));
    }
  }
}