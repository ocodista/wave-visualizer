export class Particle {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number = 0;
  vy: number = 0;
  color: [number, number, number];
  baseColor: [number, number, number];
  size: number;
  angle: number = 0;
  hue: number;
  saturation: number;
  lightness: number;

  constructor(x: number, y: number, colorTheme: "colored" | "white" | "black" = "colored") {
    this.x = x;
    this.y = y;
    this.homeX = x;
    this.homeY = y;

    // Initialize HSL values
    this.hue = Math.random() * 360;
    this.saturation = 0.8;
    this.lightness = 0.7;

    if (colorTheme === "white") {
      this.color = [1, 1, 1];
      this.baseColor = [1, 1, 1];
    } else if (colorTheme === "black") {
      this.color = [0, 0, 0];
      this.baseColor = [0, 0, 0];
    } else {
      // Store initial color
      this.baseColor = this.hslToRgb(this.hue, this.saturation, this.lightness);
      this.color = [...this.baseColor];
    }
    this.size = 4;
  }

  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    h = h / 360;
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

    return [r, g, b];
  }

  updateColor(velocity: number, normalizedHeight: number, isTornado: boolean = false) {
    if (this.baseColor[0] === 1 && this.baseColor[1] === 1 && this.baseColor[2] === 1) return; // Skip for white theme
    if (this.baseColor[0] === 0 && this.baseColor[1] === 0 && this.baseColor[2] === 0) return; // Skip for black theme

    // Calculate velocity-based hue shift
    const velocityFactor = Math.min(Math.sqrt(this.vx * this.vx + this.vy * this.vy) * 0.1, 1);

    if (isTornado) {
      // Tornado-specific color effects
      const heightHueShift = normalizedHeight * 120; // Full spectrum rotation based on height
      const newHue = (this.hue + heightHueShift) % 360;

      // Increase saturation and brightness with height
      const newSaturation = Math.min(this.saturation + normalizedHeight * 0.2, 1);
      const newLightness = Math.min(this.lightness + velocityFactor * 0.3, 0.9);

      this.color = this.hslToRgb(newHue, newSaturation, newLightness);
    } else {
      // Wave-based color effects
      const velocityHueShift = velocityFactor * 60; // Hue shift based on velocity
      const newHue = (this.hue + velocityHueShift) % 360;

      // Increase saturation with velocity
      const newSaturation = Math.min(this.saturation + velocityFactor * 0.2, 1);
      const newLightness = this.lightness;

      this.color = this.hslToRgb(newHue, newSaturation, newLightness);
    }
  }

  update(mouseX: number, mouseY: number, force: number, time: number, canvasWidth: number, canvasHeight: number) {
    // Wave effect physics
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001;

    // Wider wave width and slower decay for smoother propagation
    const waveWidth = 150;
    let waveActive = false;

    if (Math.abs(distance - time * 3) < waveWidth) {
      const wavePosition = Math.abs(distance - time * 3) / waveWidth;
      const waveIntensity = Math.exp(-wavePosition * 1.5) * Math.sin(wavePosition * Math.PI);
      const timeDecay = Math.exp(-time * 0.02);
      const distanceDecay = Math.exp(-distance * 0.001);
      const waveForce = waveIntensity * timeDecay * distanceDecay * force * 0.01;

      const angle = Math.atan2(dy, dx);
      const forceX = Math.cos(angle) * waveForce;
      const forceY = Math.sin(angle) * waveForce;

      this.vx += Math.min(Math.max(forceX, -5), 5);
      this.vy += Math.min(Math.max(forceY, -5), 5);
      waveActive = true;
    }

    // Weaker spring force when wave is active
    const springStrength = waveActive ? 0.005 : 0.02;
    const homeForceX = (this.homeX - this.x) * springStrength;
    const homeForceY = (this.homeY - this.y) * springStrength;
    this.vx += homeForceX;
    this.vy += homeForceY;

    // Progressive damping - stronger when moving fast
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const damping = 0.98 - Math.min(speed * 0.001, 0.03);
    this.vx *= damping;
    this.vy *= damping;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Update color based on velocity
    this.updateColor(Math.sqrt(this.vx * this.vx + this.vy * this.vy), 0);

    // Boundary check
    this.x = Math.max(0, Math.min(this.x, canvasWidth));
    this.y = Math.max(0, Math.min(this.y, canvasHeight));
  }

  updateTornado(time: number, canvasWidth: number, canvasHeight: number) {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight;

    // Calculate normalized height from bottom (0) to top (1)
    const normalizedHeight = 1 - (this.y / canvasHeight);

    // Base radius is small (5 pixels) at bottom, grows linearly to half screen width at top
    const baseRadius = 5;
    const maxRadius = canvasWidth * 0.25; // Quarter width each side = half width total
    const radius = baseRadius + (maxRadius - baseRadius) * normalizedHeight;

    // Clockwise rotation (negative angle change)
    this.angle -= 0.05 + normalizedHeight * 0.05; // Faster at top

    // Calculate target position on the spiral
    const targetX = centerX + radius * Math.cos(this.angle);
    const targetY = this.y;

    // Upward movement, faster at the top
    const upwardSpeed = 2 + normalizedHeight * 4;

    // Calculate velocity for color updates
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    this.vx = dx * 0.1;
    this.vy = -upwardSpeed;

    // Move towards target position
    const moveSpeed = 0.1;
    this.x += (targetX - this.x) * moveSpeed;
    this.y -= upwardSpeed;

    // Update color based on height and velocity
    this.updateColor(Math.sqrt(this.vx * this.vx + this.vy * this.vy), normalizedHeight, true);

    // Reset position when reaching the top
    if (this.y < 0) {
      this.y = canvasHeight;
      this.x = this.homeX;
      this.angle = 0;
      // Reset color to base color when recycling
      this.color = [...this.baseColor];
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

  getBufferData(): number[] {
    return [this.x, this.y, ...this.color, this.size];
  }
}