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
    // Generate a vibrant color with high saturation
    const hue = Math.random() * 360;
    this.color = `hsla(${hue}, 100%, 70%, 0.8)`;
  }

  update(
    mouseX: number,
    mouseY: number,
    repulsionForce: number,
    time: number,
    canvasWidth: number,
    canvasHeight: number,
  ) {
    // Calculate distance from mouse
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Wave propagation parameters
    const waveSpeed = 5; // Increased speed
    const waveRadius = time * waveSpeed;
    const waveWidth = 150; // Wider wave effect

    // Apply wave force
    if (Math.abs(distance - waveRadius) < waveWidth) {
      const wavePosition = Math.abs(distance - waveRadius) / waveWidth;
      const waveIntensity = Math.exp(-wavePosition * 1.5) * Math.sin(wavePosition * Math.PI);
      const timeDecay = Math.exp(-time * 0.5); // Faster decay
      const distanceDecay = Math.exp(-distance * 0.001); // Longer range effect
      const waveForce = waveIntensity * timeDecay * distanceDecay * repulsionForce * 0.3; // Increased force

      const angle = Math.atan2(dy, dx);
      this.vx += Math.cos(angle) * waveForce;
      this.vy += Math.sin(angle) * waveForce;
    }

    // Strong spring force to return to home position
    const springStrength = 0.1; // Increased strength
    const homeForceX = (this.homeX - this.x) * springStrength;
    const homeForceY = (this.homeY - this.y) * springStrength;

    this.vx += homeForceX;
    this.vy += homeForceY;

    // Apply stronger damping for crisper movement
    const damping = 0.85; // Increased damping
    this.vx *= damping;
    this.vy *= damping;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Hard boundary constraints
    if (this.x < 0) this.x = 0;
    if (this.x > canvasWidth) this.x = canvasWidth;
    if (this.y < 0) this.y = 0;
    if (this.y > canvasHeight) this.y = canvasHeight;
  }
}