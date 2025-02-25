export class Particle {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number = 0;
  vy: number = 0;
  color: [number, number, number];
  size: number;
  angle: number = 0;

  constructor(x: number, y: number, colorTheme: "colored" | "white" | "black" = "colored") {
    this.x = x;
    this.y = y;
    this.homeX = x;
    this.homeY = y;

    // Set color based on theme
    if (colorTheme === "white") {
      this.color = [1, 1, 1];
    } else if (colorTheme === "black") {
      this.color = [0, 0, 0];
    } else {
      // Convert HSL to RGB for WebGL
      const hue = Math.random() * 360;
      const s = 0.8;
      const l = 0.7;

      // HSL to RGB conversion
      const h = hue / 360;
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      const hueToRGB = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const r = hueToRGB(p, q, h + 1/3);
      const g = hueToRGB(p, q, h);
      const b = hueToRGB(p, q, h - 1/3);

      this.color = [r, g, b];
    }
    this.size = 4;
  }

  update(mouseX: number, mouseY: number, force: number, time: number, canvasWidth: number, canvasHeight: number, tornadoMode: boolean = false) {
    if (tornadoMode) {
      this.updateTornado(time, canvasWidth, canvasHeight);
      return;
    }

    // Wave effect physics
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001;

    if (Math.abs(distance - time * 5) < 80) {
      const wavePosition = Math.abs(distance - time * 5) / 80;
      const waveIntensity = Math.exp(-wavePosition * 2) * Math.sin(wavePosition * Math.PI * 2);
      const timeDecay = Math.exp(-time * 0.015);
      const distanceDecay = Math.exp(-distance * 0.002);
      const waveForce = waveIntensity * timeDecay * distanceDecay * force * 0.015;

      const angle = Math.atan2(dy, dx);
      const forceX = Math.cos(angle) * waveForce;
      const forceY = Math.sin(angle) * waveForce;

      this.vx += Math.min(Math.max(forceX, -5), 5);
      this.vy += Math.min(Math.max(forceY, -5), 5);
    }

    // Return to home position
    const springStrength = 0.02;
    const homeForceX = (this.homeX - this.x) * springStrength;
    const homeForceY = (this.homeY - this.y) * springStrength;
    this.vx += homeForceX;
    this.vy += homeForceY;

    // Apply damping
    this.vx *= 0.96;
    this.vy *= 0.96;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Boundary check
    this.x = Math.max(0, Math.min(this.x, canvasWidth));
    this.y = Math.max(0, Math.min(this.y, canvasHeight));
  }

  updateTornado(time: number, canvasWidth: number, canvasHeight: number) {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight;

    // Calculate normalized height from bottom (0) to top (1)
    const normalizedHeight = this.y / canvasHeight;

    // Base radius is small (5 pixels) at bottom, grows linearly with height
    const baseRadius = 5;
    const maxRadius = Math.min(canvasWidth, canvasHeight) * 0.4;
    const radius = baseRadius + (maxRadius - baseRadius) * (1 - normalizedHeight);

    // Clockwise rotation (negative angle change)
    this.angle -= 0.05 + (1 - normalizedHeight) * 0.05; // Faster at top

    // Calculate target position on the spiral
    const targetX = centerX + radius * Math.cos(this.angle);
    const targetY = this.y;

    // Move towards target position
    const moveSpeed = 0.1;
    this.x += (targetX - this.x) * moveSpeed;

    // Upward movement, faster at the top
    const upwardSpeed = 2 + (1 - normalizedHeight) * 4;
    this.y -= upwardSpeed;

    // Reset position when reaching the top
    if (this.y < 0) {
      this.y = canvasHeight;
      this.x = this.homeX;
      this.angle = 0;
    }

    // Add repulsion effect to nearby particles
    const particles = (globalThis as any).particleSystem?.particles || [];
    particles.forEach((other: Particle) => {
      if (other === this) return;

      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < radius * 0.5 && distance > 0) {
        const repulsionForce = 0.5 * (1 - distance / (radius * 0.5));
        const angle = Math.atan2(dy, dx);

        other.vx += Math.cos(angle) * repulsionForce;
        other.vy += Math.sin(angle) * repulsionForce;

        // Wall bouncing
        if (other.x <= 0 || other.x >= canvasWidth) {
          other.vx *= -0.8; // Bounce with some energy loss
        }
        if (other.y <= 0 || other.y >= canvasHeight) {
          other.vy *= -0.8;
        }
      }
    });
  }

  // Get data for WebGL buffers
  getBufferData(): number[] {
    return [this.x, this.y, ...this.color, this.size];
  }
}