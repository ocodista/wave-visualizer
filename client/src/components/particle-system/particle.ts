export class Particle {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number = 0;
  vy: number = 0;
  color: string;
  waveOffset: number = 0;
  wavePhase: number = Math.random() * Math.PI * 2;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.homeX = x;
    this.homeY = y;
    // Generate a random hue for HSL color
    const hue = Math.random() * 360;
    this.color = `hsl(${hue}, 80%, 70%)`;
  }

  update(mouseX: number, mouseY: number, repulsionForce: number, time: number, canvasWidth: number, canvasHeight: number) {
    // Calculate distance from touch point
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Wave propagation parameters
    const waveSpeed = 2; // Slower wave propagation
    const waveRadius = time * waveSpeed; // How far the wave has traveled
    const waveWidth = Math.max(30, distance * 0.1); // Dynamic wave width based on distance

    // Only apply force if the wave has reached this particle
    if (time > 0 && Math.abs(distance - waveRadius) < waveWidth) {
      // Calculate wave intensity based on position within the wave pulse
      const wavePosition = Math.abs(distance - waveRadius) / waveWidth;
      const waveIntensity = Math.exp(-wavePosition * 2) * Math.sin(wavePosition * Math.PI);

      // Time-based decay for overall wave strength
      const timeDecay = Math.exp(-time * 0.002); // Slower decay for longer-lasting waves
      const distanceDecay = Math.exp(-distance * 0.001); // Additional distance-based decay

      // Calculate final wave force
      const waveForce = waveIntensity * timeDecay * distanceDecay * repulsionForce * 0.015;

      // Apply force in radial direction
      const angle = Math.atan2(dy, dx);
      this.vx += Math.cos(angle) * waveForce;
      this.vy += Math.sin(angle) * waveForce;
    }

    // Apply spring force to return to home position
    const springStrength = 0.025; // Softer return to position
    const homeForceX = (this.homeX - this.x) * springStrength;
    const homeForceY = (this.homeY - this.y) * springStrength;

    this.vx += homeForceX;
    this.vy += homeForceY;

    // Apply damping for smooth movement
    const damping = 0.96; // Slightly increased damping
    this.vx *= damping;
    this.vy *= damping;

    // Update position based on velocity
    this.x += this.vx;
    this.y += this.vy;

    // Add boundary reflection with energy loss
    const bounceEnergy = 0.6; // Energy retained after bounce
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