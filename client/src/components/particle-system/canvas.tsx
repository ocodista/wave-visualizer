import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { WebGLRenderer } from "./webgl/renderer";

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
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const isDraggingRef = useRef(false);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (rendererRef.current) {
        rendererRef.current.render(); // Re-render on resize
      }
    };

    try {
      // Initialize WebGL renderer
      const totalParticles = config.threadCount * config.particlesPerThread;
      rendererRef.current = new WebGLRenderer(canvas, totalParticles);

      resize();
      window.addEventListener("resize", resize);

      const addMagneticParticle = (clientX: number, clientY: number) => {
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        rendererRef.current?.addMagneticParticle(x, y);
      };

      const handleMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        if (isDraggingRef.current) {
          addMagneticParticle(e.clientX, e.clientY);
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        if (isDraggingRef.current) {
          Array.from(e.touches).forEach(touch => {
            addMagneticParticle(touch.clientX, touch.clientY);
          });
        }
      };

      const handleStart = (clientX: number, clientY: number) => {
        isDraggingRef.current = true;
        addMagneticParticle(clientX, clientY);
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

      // Animation loop
      const animate = () => {
        if (rendererRef.current) {
          rendererRef.current.render();
        }
        frameRef.current = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        window.removeEventListener("resize", resize);
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseup", handleEnd);
        canvas.removeEventListener("mouseleave", handleEnd);
        canvas.removeEventListener("touchmove", handleTouchMove);
        canvas.removeEventListener("touchend", handleEnd);
        cancelAnimationFrame(frameRef.current);
      };
    } catch (error) {
      console.error("WebGL initialization failed:", error);
      // Fallback to existing canvas-based rendering could be implemented here
    }
  }, [config.threadCount, config.particlesPerThread]);

  const spawnMagneticParticle = () => {
    if (!canvasRef.current || !rendererRef.current) return;

    const canvas = canvasRef.current;
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    rendererRef.current.addMagneticParticle(x, y);
  };

  return (
    <>
      <canvas ref={canvasRef} className="w-full h-full select-none" />
      <Button
        className="fixed top-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30"
        onClick={spawnMagneticParticle}
      >
        Spawn Magnetic Particle
      </Button>
    </>
  );
}