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
    // Calculate distance to wave source with safety check
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001; // Prevent division by zero

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
      const waveForce = Math.min(10, waveIntensity * timeDecay * distanceDecay * repulsionForce * 0.02);

      const angle = Math.atan2(dy, dx);
      const forceX = Math.cos(angle) * waveForce / this.mass;
      const forceY = Math.sin(angle) * waveForce / this.mass;

      // Add clamped forces
      this.vx += Math.min(Math.max(forceX, -10), 10);
      this.vy += Math.min(Math.max(forceY, -10), 10);
    }

    // Calculate pressure and density from neighbors
    this.pressure = 0;
    this.density = 0;
    const smoothingRadius = 30;

    neighbors.forEach(neighbor => {
      if (neighbor === this) return;

      const dx = neighbor.x - this.x;
      const dy = neighbor.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;

      if (dist < smoothingRadius) {
        // Calculate density with safety bounds
        const influence = Math.max(0, Math.min(1 - dist / smoothingRadius, 1));
        this.density += neighbor.mass * influence;

        // Add pressure-based forces with safety checks
        if (this.density > 1) {
          const pressureForce = Math.min((this.density - 1) * 0.1, 5);
          const normalizedDx = dx / dist;
          const normalizedDy = dy / dist;
          this.vx -= normalizedDx * pressureForce;
          this.vy -= normalizedDy * pressureForce;
        }

        // Add bounded viscosity
        const viscosity = 0.5;
        const dvx = (neighbor.vx - this.vx) * influence * viscosity;
        const dvy = (neighbor.vy - this.vy) * influence * viscosity;
        this.vx += Math.min(Math.max(dvx, -5), 5);
        this.vy += Math.min(Math.max(dvy, -5), 5);
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

    // Clamp velocities to prevent instability
    this.vx = Math.min(Math.max(this.vx, -20), 20);
    this.vy = Math.min(Math.max(this.vy, -20), 20);

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Boundary check with energy loss and mass-based bouncing
    const bounceEnergy = 0.6 * this.mass;
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