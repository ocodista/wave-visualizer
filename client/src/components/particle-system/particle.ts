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
    const waveSpeed = 3; // Slightly faster for more immediate feedback
    const waveRadius = time * waveSpeed; // How far the wave has traveled
    const waveWidth = 40; // Fixed width for more consistent ripples

    // Only apply force if the wave has reached this particle
    if (Math.abs(distance - waveRadius) < waveWidth) {
      // Calculate wave intensity with stronger initial pulse
      const wavePosition = Math.abs(distance - waveRadius) / waveWidth;
      const waveIntensity = Math.exp(-wavePosition * 1.5) * Math.sin(wavePosition * Math.PI);

      // More aggressive initial time decay that softens over time
      const timeDecay = Math.exp(-time * (time < 10 ? 0.01 : 0.003));
      const distanceDecay = Math.exp(-distance * 0.001);

      // Enhanced initial force for quick clicks
      const initialBoost = time < 5 ? 2.0 : 1.0;
      const waveForce = waveIntensity * timeDecay * distanceDecay * repulsionForce * 0.02 * initialBoost;

      // Apply force in radial direction
      const angle = Math.atan2(dy, dx);
      this.vx += Math.cos(angle) * waveForce;
      this.vy += Math.sin(angle) * waveForce;
    }

    // Apply spring force to return to home position
    const springStrength = 0.025;
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