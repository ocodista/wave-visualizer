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

    // Create wave effect that spreads across the screen
    if (time > 0) {  // Only create waves when there's interaction
      const waveSpeed = 0.2;
      const waveLength = 150;

      // Calculate wave phase based on distance and time
      const wavePhase = (time * waveSpeed - distance / waveLength) * Math.PI;

      // Wave amplitude decreases with time and distance
      const timeDecay = Math.exp(-time * 0.01); // Slower time-based decay
      const distanceDecay = Math.exp(-distance * 0.001); // Gentler distance-based decay
      const waveAmplitude = Math.sin(wavePhase) * timeDecay * distanceDecay * repulsionForce * 0.05;

      // Apply force in radial direction
      const angle = Math.atan2(dy, dx);
      this.vx += Math.cos(angle) * waveAmplitude;
      this.vy += Math.sin(angle) * waveAmplitude;
    }

    // Apply spring force to return to home position
    const springStrength = 0.04;
    const homeForceX = (this.homeX - this.x) * springStrength;
    const homeForceY = (this.homeY - this.y) * springStrength;

    this.vx += homeForceX;
    this.vy += homeForceY;

    // Apply damping for smooth movement
    this.vx *= 0.97;
    this.vy *= 0.97;

    // Update position based on velocity
    this.x += this.vx;
    this.y += this.vy;

    // Add boundary reflection
    if (this.x < 0 || this.x > canvasWidth) {
      this.vx *= -0.5; // Reduce velocity on boundary hit
      this.x = Math.max(0, Math.min(this.x, canvasWidth));
    }
    if (this.y < 0 || this.y > canvasHeight) {
      this.vy *= -0.5; // Reduce velocity on boundary hit
      this.y = Math.max(0, Math.min(this.y, canvasHeight));
    }
  }
}