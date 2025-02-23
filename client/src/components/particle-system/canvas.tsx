import { useEffect, useRef, useState } from "react";
import { Particle } from "./particle";
import { SmokeParticle } from "./smoke-particle";
import { AttractiveParticle } from "./attractive-particle";
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
  const attractiveParticlesRef = useRef<AttractiveParticle[]>([]);
  const waveSourcesRef = useRef<WaveSource[]>([]);
  const frameRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastAttractiveParticleTimeRef = useRef(0);

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
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      waveSourcesRef.current.push({
        x,
        y,
        time: 0,
      });

      if (config.mode === "smoke") {
        const color = `hsl(${Math.random() * 360}, 80%, 70%)`;
        for (let i = 0; i < 5; i++) {
          smokeParticlesRef.current.push(
            new SmokeParticle(x, y, color)
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
      e.preventDefault();
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
      canvas.removeEventListener("mousedown", (e) => handleStart(e.clientX, e.clientY));
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleEnd);
      canvas.removeEventListener("mouseleave", handleEnd);
      canvas.removeEventListener("touchstart", handleTouchStart);
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
    smokeParticlesRef.current = [];
    attractiveParticlesRef.current = [];
    waveSourcesRef.current = [];
  }, [config.threadCount, config.particlesPerThread, config.mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const animate = () => {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const currentTime = performance.now();
      if (currentTime - lastAttractiveParticleTimeRef.current > 2000) {
        attractiveParticlesRef.current.push(new AttractiveParticle(canvas.width, canvas.height));
        lastAttractiveParticleTimeRef.current = currentTime;
      }

      attractiveParticlesRef.current = attractiveParticlesRef.current.filter(particle => {
        const isActive = particle.update(canvas.width, canvas.height);
        if (isActive) {
          particle.drawField(ctx);
        }
        return isActive;
      });

      if (config.mode === "smoke") {
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
        waveSourcesRef.current = waveSourcesRef.current.filter(source => {
          source.time += 1;
          return source.time < 300;
        });

        const allParticles = particlesRef.current.flat();

        particlesRef.current.forEach((thread) => {
          thread.forEach(particle => {
            if (waveSourcesRef.current.length > 0) {
              waveSourcesRef.current.forEach(source => {
                particle.update(
                  source.x,
                  source.y,
                  isDraggingRef.current ? config.repulsionForce * 1.5 : config.repulsionForce,
                  source.time,
                  canvas.width,
                  canvas.height,
                  allParticles
                );
              });
            } else {
              // Update with default values when no wave sources
              particle.update(
                particle.x,
                particle.y,
                config.repulsionForce,
                0,
                canvas.width,
                canvas.height,
                allParticles
              );
            }

            attractiveParticlesRef.current.forEach(attractor => {
              const [forceX, forceY] = attractor.getAttractionForce(particle.x, particle.y);
              particle.vx += forceX * 0.1;
              particle.vy += forceY * 0.1;
            });
          });

          if (thread.length >= 2) {
            ctx.beginPath();
            thread.forEach((particle, i) => {
              if (i === 0) {
                ctx.moveTo(particle.x, particle.y);
              } else {
                const prevParticle = thread[i - 1];

                if (config.mode === "hair") {
                  const cp1x = prevParticle.x + (particle.x - prevParticle.x) * 0.25;
                  const cp1y = prevParticle.y + (particle.y - prevParticle.y) * 0.25;
                  const cp2x = prevParticle.x + (particle.x - prevParticle.x) * 0.75;
                  const cp2y = prevParticle.y + (particle.y - prevParticle.y) * 0.75;
                  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, particle.x, particle.y);
                } else {
                  const gradient = ctx.createLinearGradient(
                    prevParticle.x, prevParticle.y,
                    particle.x, particle.y
                  );

                  const densityFactor = Math.min(particle.density, 2);
                  const alpha = 0.3 + densityFactor * 0.3;

                  gradient.addColorStop(0, prevParticle.color.replace(')', `, ${alpha})`));
                  gradient.addColorStop(1, particle.color.replace(')', `, ${alpha})`));

                  ctx.lineWidth = 1 + densityFactor;
                  ctx.lineTo(particle.x, particle.y);
                  ctx.strokeStyle = gradient;
                  ctx.stroke();
                  ctx.beginPath();
                  ctx.moveTo(particle.x, particle.y);
                }
              }
            });

            if (config.mode === "hair") {
              ctx.strokeStyle = thread[0].color;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }

          if (config.mode !== "hair") {
            thread.forEach(particle => {
              const particleSize = 2 + particle.density * 0.5;
              ctx.fillStyle = particle.color;
              ctx.beginPath();
              ctx.arc(particle.x, particle.y, particleSize, 0, Math.PI * 2);
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