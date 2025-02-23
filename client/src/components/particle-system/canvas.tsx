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

  useEffect(() => {
    if (!canvasRef.current) return;

    // Set canvas size to match window
    canvasRef.current.width = window.innerWidth;
    canvasRef.current.height = window.innerHeight;

    // Initialize WebGL renderer
    const totalParticles = config.threadCount * config.particlesPerThread;
    rendererRef.current = new WebGLRenderer(canvasRef.current, totalParticles);

    // Animation loop
    let animationFrame: number;
    const animate = () => {
      if (rendererRef.current) {
        rendererRef.current.render(config.repulsionForce);
      }
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!canvasRef.current) return;
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
      if (rendererRef.current) {
        rendererRef.current.resize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // Add mouse interaction
    const handleMouseMove = (event: MouseEvent) => {
      if (!rendererRef.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      rendererRef.current.setMousePosition(x, y);
    };
    canvasRef.current.addEventListener('mousemove', handleMouseMove);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mousemove', handleMouseMove);
      }
      if (rendererRef.current) {
        rendererRef.current.destroy();
      }
    };
  }, [config.threadCount, config.particlesPerThread, config.repulsionForce]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ background: 'black' }}
    />
  );
}