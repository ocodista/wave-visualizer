import { useEffect, useRef } from "react";
import { Particle } from "./particle";

interface Config {
  threadCount: number;
  particlesPerThread: number;
  repulsionForce: number;
}

interface ParticleCanvasProps {
  config: Config;
}

export default function ParticleCanvas({ config }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[][]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
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

    // Enhanced mouse/touch tracking
    const updateMousePosition = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updateMousePosition(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      updateMousePosition(touch.clientX, touch.clientY);
    };

    const handleStart = () => {
      isDraggingRef.current = true;
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
      mouseRef.current = { x: -1000, y: -1000 };
    };

    // Add touch and mouse event listeners
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleStart);
    canvas.addEventListener("mouseup", handleEnd);
    canvas.addEventListener("mouseleave", handleEnd);

    canvas.addEventListener("touchstart", handleStart);
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleStart);
      canvas.removeEventListener("mouseup", handleEnd);
      canvas.removeEventListener("mouseleave", handleEnd);

      canvas.removeEventListener("touchstart", handleStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleEnd);

      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  // Initialize particles when config changes
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

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const animate = () => {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 1;

      particlesRef.current.forEach(thread => {
        // Update particles
        thread.forEach(particle => {
          particle.update(
            mouseRef.current.x,
            mouseRef.current.y,
            isDraggingRef.current ? config.repulsionForce * 1.5 : config.repulsionForce
          );
        });

        // Draw thread lines
        ctx.beginPath();
        thread.forEach((particle, i) => {
          if (i === 0) {
            ctx.moveTo(particle.x, particle.y);
          } else {
            ctx.lineTo(particle.x, particle.y);
          }
        });
        ctx.stroke();

        // Draw particles with glow effect
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        thread.forEach(particle => {
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

  return <canvas ref={canvasRef} className="w-full h-full" />;
}