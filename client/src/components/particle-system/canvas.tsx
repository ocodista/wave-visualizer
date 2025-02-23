import { useEffect, useRef } from "react";
import { Particle } from "./particle";
import { AttractiveParticle } from "./attractive-particle";
import { Button } from "@/components/ui/button";

interface Config {
  threadCount: number;
  particlesPerThread: number;
  repulsionForce: number;
}

interface ParticleCanvasProps {
  config: Config;
}

interface WaveSource {
  x: number;
  y: number;
  time: number;
}

export default function ParticleCanvas({ config }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[][]>([]);
  const waveSourcesRef = useRef<WaveSource[]>([]);
  const attractiveParticlesRef = useRef<AttractiveParticle[]>([]);
  const frameRef = useRef(0);
  const isDraggingRef = useRef(false);

  const spawnAttractiveParticle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    attractiveParticlesRef.current.push(
      new AttractiveParticle(canvas.width, canvas.height)
    );
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const addWaveSource = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      waveSourcesRef.current.push({
        x: clientX - rect.left,
        y: clientY - rect.top,
        time: 0,
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      if (isDraggingRef.current) {
        addWaveSource(e.clientX, e.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (isDraggingRef.current) {
        Array.from(e.touches).forEach(touch => {
          addWaveSource(touch.clientX, touch.clientY);
        });
      }
    };

    const handleStart = (clientX: number, clientY: number) => {
      isDraggingRef.current = true;
      addWaveSource(clientX, clientY);
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      Array.from(e.touches).forEach(touch => {
        handleStart(touch.clientX, touch.clientY);
      });
    };

    canvas.addEventListener("mousedown", (e) => handleStart(e.clientX, e.clientY));
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleEnd);
    canvas.addEventListener("mouseleave", handleEnd);

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleEnd);
      canvas.removeEventListener("mouseleave", handleEnd);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleEnd);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const threads: Particle[][] = [];
    const spacing = canvas.width / (config.threadCount + 1);

    for (let i = 0; i < config.threadCount; i++) {
      const thread: Particle[] = [];
      const x = spacing * (i + 1);

      for (let j = 0; j < config.particlesPerThread; j++) {
        const y = (canvas.height / (config.particlesPerThread - 1)) * j;
        thread.push(new Particle(x, y));
      }

      threads.push(thread);
    }

    particlesRef.current = threads;
  }, [config.threadCount, config.particlesPerThread]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const animate = () => {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      waveSourcesRef.current = waveSourcesRef.current.filter(source => {
        source.time += 1;
        return source.time < 200;
      });

      attractiveParticlesRef.current = attractiveParticlesRef.current.filter(particle => {
        return particle.update(canvas.width, canvas.height);
      });

      // Draw magnetic fields first (under the particles)
      attractiveParticlesRef.current.forEach(particle => {
        particle.drawField(ctx);
      });

      particlesRef.current.forEach(thread => {
        thread.forEach(particle => {
          waveSourcesRef.current.forEach(source => {
            particle.update(
              source.x,
              source.y,
              isDraggingRef.current ? config.repulsionForce * 1.5 : config.repulsionForce,
              source.time,
              canvas.width,
              canvas.height,
              attractiveParticlesRef.current
            );
          });
        });

        if (thread.length >= 2) {
          const gradient = ctx.createLinearGradient(
            thread[0].x,
            thread[0].y,
            thread[thread.length - 1].x,
            thread[thread.length - 1].y
          );

          thread.forEach((particle, i) => {
            gradient.addColorStop(i / (thread.length - 1), particle.color);
          });

          ctx.strokeStyle = gradient;
          ctx.beginPath();
          thread.forEach((particle, i) => {
            if (i === 0) {
              ctx.moveTo(particle.x, particle.y);
            } else {
              ctx.lineTo(particle.x, particle.y);
            }
          });
          ctx.stroke();
        }

        thread.forEach(particle => {
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      // Draw magnetic particles on top
      attractiveParticlesRef.current.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(frameRef.current);
  }, [config.repulsionForce]);

  return (
    <>
      <canvas ref={canvasRef} className="w-full h-full select-none" />
      <Button
        className="fixed top-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30"
        onClick={spawnAttractiveParticle}
      >
        Spawn Magnetic Particle
      </Button>
    </>
  );
}