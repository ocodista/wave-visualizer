export class Particle {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number = 0;
  vy: number = 0;
  color: [number, number, number];
  size: number;
  time: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.homeX = x;
    this.homeY = y;

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
    this.size = 4;
  }

  update(mouseX: number, mouseY: number, force: number, time: number, canvasWidth: number, canvasHeight: number, vibration: number = 0, threadSpacing: number = 100) {
    this.time += 0.05; // Increment internal time for vibration animation

    // Calculate vibration offsets
    let vibrateX = 0;
    let vibrateY = 0;

    if (vibration > 0) {
      const vibrationAmplitude = (threadSpacing * 0.5) * (vibration / 10);

      if (vibration <= 5) {
        // Horizontal movement only
        vibrateX = Math.sin(this.time) * vibrationAmplitude * (vibration / 5);
      } else {
        // Circular movement
        const circleIntensity = (vibration - 5) / 5; // 0 to 1 for circular motion
        const angle = this.time;
        vibrateX = Math.cos(angle) * vibrationAmplitude * circleIntensity;
        vibrateY = Math.sin(angle) * vibrationAmplitude * circleIntensity;
      }
    }

    // Calculate distance to wave source from the vibrated position
    const dx = (this.x + vibrateX) - mouseX;
    const dy = (this.y + vibrateY) - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001;

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
      const waveForce = Math.min(10, waveIntensity * timeDecay * distanceDecay * force * 0.02);

      const angle = Math.atan2(dy, dx);
      const forceX = Math.cos(angle) * waveForce;
      const forceY = Math.sin(angle) * waveForce;

      // Add wave forces to velocity
      this.vx += Math.min(Math.max(forceX, -10), 10);
      this.vy += Math.min(Math.max(forceY, -10), 10);
    }

    // Apply spring force to return to vibrated home position
    const springStrength = 0.025;
    const homeForceX = ((this.homeX + vibrateX) - this.x) * springStrength;
    const homeForceY = ((this.homeY + vibrateY) - this.y) * springStrength;
    this.vx += homeForceX;
    this.vy += homeForceY;

    // Apply damping
    this.vx *= 0.95;
    this.vy *= 0.95;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Apply vibration to final position
    this.x += vibrateX;
    this.y += vibrateY;

    // Boundary check
    this.x = Math.max(0, Math.min(this.x, canvasWidth));
    this.y = Math.max(0, Math.min(this.y, canvasHeight));
  }

  // Get data for WebGL buffers
  getBufferData(): number[] {
    return [this.x, this.y, ...this.color, this.size];
  }
}