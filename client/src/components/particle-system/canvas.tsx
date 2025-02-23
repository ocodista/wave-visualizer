import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import p5 from "p5";
import { Particle } from "./particle";
import { AttractiveParticle } from "./attractive-particle";

interface Config {
  threadCount: number;
  particlesPerThread: number;
  repulsionForce: number;
}

interface ParticleCanvasProps {
  config: Config;
}

export default function ParticleCanvas({ config }: ParticleCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sketch, setSketch] = useState<p5 | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let particles: Particle[] = [];
    let attractiveParticles: AttractiveParticle[] = [];
    let startTime = Date.now();
    let isDragging = false;

    const s = new p5((p: p5) => {
      p.setup = () => {
        const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
        canvas.mousePressed(() => isDragging = true);
        canvas.mouseReleased(() => isDragging = false);

        // Initialize particles in a grid
        const totalParticles = config.threadCount * config.particlesPerThread;
        const cols = Math.ceil(Math.sqrt(totalParticles));
        const spacing = Math.min(p.width, p.height) / cols;

        for (let i = 0; i < totalParticles; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = col * spacing + spacing / 2;
          const y = row * spacing + spacing / 2;
          particles.push(new Particle(x, y));
        }

        p.frameRate(60);
        p.blendMode(p.ADD);
      };

      p.draw = () => {
        p.background(0);
        const time = (Date.now() - startTime) / 1000;

        // Handle drag interaction
        if (isDragging) {
          attractiveParticles.push(new AttractiveParticle(p.width, p.height));
        }

        // Update attractive particles
        attractiveParticles = attractiveParticles.filter(particle => 
          particle.update(p.width, p.height)
        );

        // Update and draw particles
        particles.forEach(particle => {
          particle.update(
            p.mouseX,
            p.mouseY,
            config.repulsionForce,
            time,
            p.width,
            p.height,
            attractiveParticles
          );

          // Draw particle
          p.fill(particle.color);
          p.noStroke();
          p.circle(particle.x, particle.y, 4);
        });

        // Draw magnetic particles
        attractiveParticles.forEach(particle => {
          p.fill(200, 200, 200, 50);
          p.noStroke();
          p.circle(particle.x, particle.y, 20);
        });
      };

      p.windowResized = () => {
        p.resizeCanvas(window.innerWidth, window.innerHeight);
      };
    });

    setSketch(s);

    return () => {
      s.remove();
    };
  }, [config.threadCount, config.particlesPerThread, config.repulsionForce]);

  const spawnMagneticParticle = () => {
    if (!sketch) return;
    const x = Math.random() * sketch.width;
    const y = Math.random() * sketch.height;
    const particle = new AttractiveParticle(sketch.width, sketch.height);
    particle.x = x;
    particle.y = y;
  };

  return (
    <>
      <div ref={containerRef} className="w-full h-full" />
      <Button
        className="fixed top-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30"
        onClick={spawnMagneticParticle}
      >
        Spawn Magnetic Particle
      </Button>
    </>
  );
}