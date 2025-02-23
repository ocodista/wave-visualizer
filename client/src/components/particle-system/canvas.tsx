import { useEffect, useRef, useState } from "react";
import { Particle } from "./particle";
import { SmokeParticle } from "./smoke-particle";
import type { VisualizationMode } from "./controls";

interface Config {
  threadCount: number;
  particlesPerThread: number;
  repulsionForce: number;
  mode: VisualizationMode;
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
  const smokeParticlesRef = useRef<SmokeParticle[]>([]);
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

      // Add smoke particles for smoke mode
      if (config.mode === "smoke") {
        const color = config.mode === "monochrome" ? "white" : `hsl(${Math.random() * 360}, 80%, 70%)`;
        for (let i = 0; i < 5; i++) {
          smokeParticlesRef.current.push(
            new SmokeParticle(clientX - rect.left, clientY - rect.top, color)
          );
        }
      }
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
  }, [config.mode]);

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
        const particle = new Particle(x, y);
        if (config.mode === "monochrome") {
          particle.color = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`;
        }
        thread.push(particle);
      }

      threads.push(thread);
    }

    particlesRef.current = threads;
    smokeParticlesRef.current = []; // Reset smoke particles when config changes
  }, [config.threadCount, config.particlesPerThread, config.mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const animate = () => {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (config.mode === "smoke") {
        // Update and draw smoke particles
        ctx.globalCompositeOperation = "screen";
        smokeParticlesRef.current = smokeParticlesRef.current.filter(particle => {
          const isAlive = particle.update(
            waveSourcesRef.current[0]?.x || 0,
            waveSourcesRef.current[0]?.y || 0,
            config.repulsionForce,
            canvas.width,
            canvas.height
          );

          if (isAlive) {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = `${particle.color.split(")")[0]}, ${particle.opacity})`;
            ctx.fill();
          }

          return isAlive;
        });
        ctx.globalCompositeOperation = "source-over";
      } else {
        // Filter wave sources
        waveSourcesRef.current = waveSourcesRef.current.filter(source => {
          source.time += 1;
          return source.time < 300;
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

          // Draw thread lines
          if (thread.length >= 2) {
            ctx.beginPath();
            thread.forEach((particle, i) => {
              if (i === 0) {
                ctx.moveTo(particle.x, particle.y);
              } else {
                const prevParticle = thread[i - 1];

                if (config.mode === "hair") {
                  // Create curved lines for hair-like effect
                  const cp1x = prevParticle.x + (particle.x - prevParticle.x) * 0.25;
                  const cp1y = prevParticle.y + (particle.y - prevParticle.y) * 0.25;
                  const cp2x = prevParticle.x + (particle.x - prevParticle.x) * 0.75;
                  const cp2y = prevParticle.y + (particle.y - prevParticle.y) * 0.75;
                  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, particle.x, particle.y);
                } else {
                  // Regular line drawing for other modes
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
              }
            });

            if (config.mode === "hair") {
              ctx.strokeStyle = config.mode === "monochrome" ? "rgba(255, 255, 255, 0.4)" : thread[0].color;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }

          // Draw particles
          if (config.mode !== "hair") {
            thread.forEach(particle => {
              ctx.fillStyle = particle.color;
              ctx.beginPath();
              ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
              ctx.fill();
            });
          }
        });
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(frameRef.current);
  }, [config.mode, config.repulsionForce]);

  return (
    <canvas ref={canvasRef} className="w-full h-full select-none" />
  );
}