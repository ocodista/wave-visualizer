export class Particle {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number = 0;
  vy: number = 0;
  color: string;
  waveOffset: number = 0;
  wavePhase: number = Math.random() * Math.PI * 2; // Random initial phase for varied movement

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
    // Calculate distance from mouse
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Apply repulsion force with wave-like propagation
    if (distance < 150) {  // Increased interaction radius
      const force = (1 - distance / 150) * repulsionForce;
      // Add velocity with wave propagation
      const waveSpeed = 0.3; // Slower wave speed
      this.waveOffset = Math.max(0, 1 - (distance / Math.max(canvasWidth, canvasHeight)));
      const waveForce = Math.sin(time * waveSpeed - distance * 0.01 + this.wavePhase) * this.waveOffset * force;

      this.vx += (dx / distance) * waveForce * 0.1;
      this.vy += (dy / distance) * waveForce * 0.1;
    }

    // Apply wave motion even without direct interaction
    const globalWaveAmplitude = 1.5;
    const globalWaveFrequency = 0.001;
    const waveSpread = Math.max(0.1, this.waveOffset); // Ensure some minimal wave motion

    // Create spreading waves
    const spreadSpeed = 0.2;
    const spreadDistance = time * spreadSpeed;
    const distanceFromCenter = Math.sqrt(
      Math.pow(this.x - canvasWidth/2, 2) + 
      Math.pow(this.y - canvasHeight/2, 2)
    );

    // Combine multiple wave patterns
    this.x += Math.sin(time * globalWaveFrequency + this.y * 0.01 + this.wavePhase) * 
              globalWaveAmplitude * waveSpread +
              Math.sin(distanceFromCenter - spreadDistance) * waveSpread;

    this.y += Math.cos(time * globalWaveFrequency + this.x * 0.01 + this.wavePhase) * 
              globalWaveAmplitude * waveSpread +
              Math.cos(distanceFromCenter - spreadDistance) * waveSpread;

    // Apply spring force to return to home position with natural oscillation
    const springStrength = 0.03; // Reduced for softer return
    const homeForceX = (this.homeX - this.x) * springStrength;
    const homeForceY = (this.homeY - this.y) * springStrength;

    this.vx += homeForceX;
    this.vy += homeForceY;

    // Apply damping for more natural movement
    this.vx *= 0.98; // Increased damping for smoother motion
    this.vy *= 0.98;

    // Update position based on velocity
    this.x += this.vx;
    this.y += this.vy;

    // Gradually decrease wave offset
    this.waveOffset *= 0.995; // Slower decay for longer-lasting waves
  }
}