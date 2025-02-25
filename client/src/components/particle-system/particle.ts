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
      this.color = [1, 1, 1]; // White
    } else if (colorTheme === "black") {
      this.color = [0, 0, 0]; // Black
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
    // Calculate distance to wave source
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001;

    // Improved wave parameters for more realistic water ripple effect
    const waveSpeed = 5; // Faster wave propagation
    const waveRadius = time * waveSpeed;
    const waveWidth = 80; // Wider wave for smoother effect

    // Apply wave force if within range
    if (Math.abs(distance - waveRadius) < waveWidth) {
      // Calculate wave intensity with smooth falloff
      const wavePosition = Math.abs(distance - waveRadius) / waveWidth;
      const waveIntensity = Math.exp(-wavePosition * 2) * Math.sin(wavePosition * Math.PI * 2);

      // Time-based decay for natural wave dissipation
      const timeDecay = Math.exp(-time * 0.015);

      // Distance-based attenuation
      const distanceDecay = Math.exp(-distance * 0.002);

      // Combined force with smooth transition
      const waveForce = waveIntensity * timeDecay * distanceDecay * force * 0.015;

      const angle = Math.atan2(dy, dx);
      const forceX = Math.cos(angle) * waveForce;
      const forceY = Math.sin(angle) * waveForce;

      this.vx += Math.min(Math.max(forceX, -5), 5);
      this.vy += Math.min(Math.max(forceY, -5), 5);
    }

    // Apply spring force to return to home position
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

    if (tornadoMode) {
      this.updateTornado(time, canvasWidth, canvasHeight);
    }
  }

  updateTornado(time: number, canvasWidth: number, canvasHeight: number) {
    const centerX = canvasWidth / 2;

    // Calculate normalized height (0 at bottom, 1 at top)
    const normalizedHeight = 1 - (this.y / canvasHeight);

    // Base radius decreases with height using square root function
    const maxRadius = Math.min(canvasWidth, canvasHeight) * 0.3;
    const radius = maxRadius * Math.sqrt(1 - normalizedHeight);

    // Angular velocity increases with height
    const angularSpeed = 0.02 + normalizedHeight * 0.04;
    this.angle += angularSpeed;

    // Spiral motion
    const spiralX = centerX + radius * Math.cos(this.angle);
    const spiralY = this.y;

    // Vertical movement (faster at the top)
    const verticalSpeed = 2 + normalizedHeight * 3;

    // Update position with smooth transition
    const transitionSpeed = 0.1;
    this.x += (spiralX - this.x) * transitionSpeed;
    this.y -= verticalSpeed;

    // Reset particles that reach the top
    if (this.y < 0) {
      this.y = canvasHeight;
      this.x = this.homeX;
    }
  }

  // Get data for WebGL buffers
  getBufferData(): number[] {
    return [this.x, this.y, ...this.color, this.size];
  }
}