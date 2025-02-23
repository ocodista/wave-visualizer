export class AttractiveParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number = 5;
  color: string = "rgb(192, 192, 192)"; // Silver color
  fieldRadius: number = 10; // Reduced to 10px for very focused effect

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

    const targetX = border === 1 ? 0 : border === 3 ? canvasWidth : this.x;
    const targetY = border === 0 ? canvasHeight : border === 2 ? 0 : this.y;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const magnitude = Math.sqrt(dx * dx + dy * dy);

    const speed = 2;
    this.vx = (dx / magnitude) * speed;
    this.vy = (dy / magnitude) * speed;
  }

  update(canvasWidth: number, canvasHeight: number): boolean {
    this.x += this.vx;
    this.y += this.vy;

    return !(
      this.x < -10 ||
      this.x > canvasWidth + 10 ||
      this.y < -10 ||
      this.y > canvasHeight + 10
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
    const forceMagnitude = Math.min(8, 2 / (normalizedDist * normalizedDist)); // Stronger force in smaller area

    const perpX = -dy / distance;
    const perpY = dx / distance;

    const radialRatio = 0.8; // Increased radial force
    const tangentialRatio = 0.2; // Reduced tangential force for more direct pull

    const forceX = (dx / distance) * forceMagnitude * radialRatio + 
                   perpX * forceMagnitude * tangentialRatio;
    const forceY = (dy / distance) * forceMagnitude * radialRatio + 
                   perpY * forceMagnitude * tangentialRatio;

    return [forceX, forceY];
  }
}