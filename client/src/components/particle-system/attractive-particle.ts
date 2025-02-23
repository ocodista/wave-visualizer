export type FieldType = 'attraction' | 'repulsion' | 'vortex';

export class AttractiveParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number = 5;
  color: string;
  fieldRadius: number = 100; // Increased radius for more visible effect
  fieldType: FieldType;
  strength: number;
  rotationSpeed: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    const border = Math.floor(Math.random() * 4);
    switch (border) {
      case 0: // Top
        this.x = Math.random() * canvasWidth;
        this.y = 0;
        break;
      case 1: // Right
        this.x = canvasWidth;
        this.y = Math.random() * canvasHeight;
        break;
      case 2: // Bottom
        this.x = Math.random() * canvasWidth;
        this.y = canvasHeight;
        break;
      default: // Left
        this.x = 0;
        this.y = Math.random() * canvasHeight;
        break;
    }

    // Random field type
    const fieldTypes: FieldType[] = ['attraction', 'repulsion', 'vortex'];
    this.fieldType = fieldTypes[Math.floor(Math.random() * fieldTypes.length)];

    // Set color based on field type
    this.color = this.fieldType === 'attraction' ? 'rgb(0, 255, 128)' : 
                 this.fieldType === 'repulsion' ? 'rgb(255, 64, 64)' : 
                 'rgb(64, 128, 255)'; // vortex

    // Random strength and rotation
    this.strength = Math.random() * 2 + 1;
    this.rotationSpeed = (Math.random() * 2 - 1) * 0.1;

    const targetX = border === 1 ? 0 : border === 3 ? canvasWidth : this.x;
    const targetY = border === 0 ? canvasHeight : border === 2 ? 0 : this.y;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const magnitude = Math.sqrt(dx * dx + dy * dy);

    const speed = 1;
    this.vx = (dx / magnitude) * speed;
    this.vy = (dy / magnitude) * speed;
  }

  update(canvasWidth: number, canvasHeight: number): boolean {
    this.x += this.vx;
    this.y += this.vy;

    // Add some wandering behavior
    this.vx += (Math.random() - 0.5) * 0.1;
    this.vy += (Math.random() - 0.5) * 0.1;

    // Normalize velocity
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > 2) {
      this.vx = (this.vx / speed) * 2;
      this.vy = (this.vy / speed) * 2;
    }

    return !(
      this.x < -this.fieldRadius ||
      this.x > canvasWidth + this.fieldRadius ||
      this.y < -this.fieldRadius ||
      this.y > canvasHeight + this.fieldRadius
    );
  }

  getAttractionForce(particleX: number, particleY: number): [number, number] {
    const dx = this.x - particleX;
    const dy = this.y - particleY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.fieldRadius) {
      return [0, 0];
    }

    const normalizedDist = distance / this.fieldRadius;
    let forceMagnitude = (1 - normalizedDist) * this.strength;

    // Calculate base force direction
    let forceX = (dx / distance) * forceMagnitude;
    let forceY = (dy / distance) * forceMagnitude;

    if (this.fieldType === 'repulsion') {
      // Reverse force direction for repulsion
      forceX *= -1;
      forceY *= -1;
    } else if (this.fieldType === 'vortex') {
      // Add rotational component for vortex
      const perpX = -dy / distance;
      const perpY = dx / distance;
      const rotationFactor = (1 - normalizedDist) * this.rotationSpeed;
      forceX = perpX * rotationFactor * this.strength;
      forceY = perpY * rotationFactor * this.strength;
    }

    // Add turbulence
    const turbulence = Math.sin(distance * 0.1 + performance.now() * 0.001) * 0.2;
    forceX += (Math.random() - 0.5) * turbulence;
    forceY += (Math.random() - 0.5) * turbulence;

    return [forceX, forceY];
  }

  drawField(ctx: CanvasRenderingContext2D) {
    // Draw the force field
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.fieldRadius
    );
    gradient.addColorStop(0, `${this.color.split(")")[0]}, 0.2)`);
    gradient.addColorStop(1, `${this.color.split(")")[0]}, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.fieldRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw the particle core
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Draw field type indicator
    if (this.fieldType === 'vortex') {
      const time = performance.now() * 0.001;
      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3 + time;
        const radius = this.fieldRadius * 0.3;
        const x = this.x + Math.cos(angle) * radius;
        const y = this.y + Math.sin(angle) * radius;

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = `${this.color.split(")")[0]}, 0.3)`;
        ctx.stroke();
      }
    }
  }
}