export class Particle {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number = 0;
  vy: number = 0;
  color: string;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.homeX = x;
    this.homeY = y;
    // Generate a random hue for HSL color
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
    attractiveParticles: { x: number; y: number; getAttractionForce: (x: number, y: number) => [number, number] }[] = []
  ) {
    // Calculate wave force
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Wave propagation parameters
    const waveSpeed = 3;
    const waveRadius = time * waveSpeed;
    const waveWidth = 40;

    // Apply wave force
    if (Math.abs(distance - waveRadius) < waveWidth) {
      const wavePosition = Math.abs(distance - waveRadius) / waveWidth;
      const waveIntensity = Math.exp(-wavePosition * 1.5) * Math.sin(wavePosition * Math.PI);
      const timeDecay = Math.exp(-time * (time < 10 ? 0.01 : 0.003));
      const distanceDecay = Math.exp(-distance * 0.001);
      const initialBoost = time < 5 ? 2.0 : 1.0;
      const waveForce = waveIntensity * timeDecay * distanceDecay * repulsionForce * 0.02 * initialBoost;

      const angle = Math.atan2(dy, dx);
      this.vx += Math.cos(angle) * waveForce;
      this.vy += Math.sin(angle) * waveForce;
    }

    // Apply magnetic forces from attractive particles
    let totalMagneticForceX = 0;
    let totalMagneticForceY = 0;

    attractiveParticles.forEach(particle => {
      const [forceX, forceY] = particle.getAttractionForce(this.x, this.y);
      totalMagneticForceX += forceX;
      totalMagneticForceY += forceY;
    });

    // Apply magnetic forces with strong initial influence
    this.vx += totalMagneticForceX * 1.2; // Increased magnetic influence
    this.vy += totalMagneticForceY * 1.2;

    // Apply spring force to return to home position with weaker effect when under magnetic influence
    const springStrength = attractiveParticles.length > 0 ? 0.01 : 0.025; // Even weaker spring when magnetic field present
    const homeForceX = (this.homeX - this.x) * springStrength;
    const homeForceY = (this.homeY - this.y) * springStrength;

    this.vx += homeForceX;
    this.vy += homeForceY;

    // Apply damping for smooth movement
    const damping = 0.96;
    this.vx *= damping;
    this.vy *= damping;

    // Update position based on velocity
    this.x += this.vx;
    this.y += this.vy;

    // Add boundary reflection with energy loss
    const bounceEnergy = 0.6;
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