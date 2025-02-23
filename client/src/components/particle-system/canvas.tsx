import { useEffect, useRef } from "react";
import { Particle } from "./particle";
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
  const frameRef = useRef(0);
  const isDraggingRef = useRef(false);

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

      // Filter wave sources more aggressively for better performance
      waveSourcesRef.current = waveSourcesRef.current.filter(source => {
        source.time += 1;
        return source.time < 100; // Reduced from 200 to 100 for better performance
      });

      // Update and draw threads
      particlesRef.current.forEach((thread) => {
        // Update particles
        thread.forEach(particle => {
          waveSourcesRef.current.forEach(source => {
            particle.update(
              source.x,
              source.y,
              isDraggingRef.current ? config.repulsionForce * 1.5 : config.repulsionForce,
              source.time,
              canvas.width,
              canvas.height
            );
          });
        });

        // Draw thread lines with interpolated colors
        if (thread.length >= 2) {
          ctx.beginPath();
          thread.forEach((particle, i) => {
            if (i === 0) {
              ctx.moveTo(particle.x, particle.y);
            } else {
              // Create line segments with interpolated colors
              const prevParticle = thread[i - 1];
              const gradient = ctx.createLinearGradient(
                prevParticle.x, prevParticle.y,
                particle.x, particle.y
              );
              gradient.addColorStop(0, prevParticle.color);
              gradient.addColorStop(1, particle.color);

              ctx.lineTo(particle.x, particle.y);
              ctx.strokeStyle = gradient;
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
            }
          });
        }

        // Draw particles with their individual colors
        thread.forEach(particle => {
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(frameRef.current);
  }, [config.repulsionForce]);

  return (
    <canvas ref={canvasRef} className="w-full h-full select-none" />
  );
}