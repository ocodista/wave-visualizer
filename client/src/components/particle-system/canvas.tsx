import { useEffect, useRef, useState } from "react";
import { WebGLRenderer } from "./webgl/renderer";
import { Canvas2DRenderer } from "./canvas2d/renderer";
import { useToast } from "@/hooks/use-toast";

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
  const rendererRef = useRef<WebGLRenderer | Canvas2DRenderer | null>(null);
  const { toast } = useToast();
  const [is2DFallback, setIs2DFallback] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      // Set canvas size to match window
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;

      // Initialize renderer
      const totalParticles = config.threadCount * config.particlesPerThread;
      try {
        // Try WebGL first
        rendererRef.current = new WebGLRenderer(canvasRef.current, totalParticles);
      } catch (webglError) {
        console.log("WebGL not available, falling back to Canvas2D renderer", webglError);
        try {
          // Fallback to Canvas2D
          rendererRef.current = new Canvas2DRenderer(canvasRef.current, totalParticles);
          setIs2DFallback(true);
          toast({
            title: "Using Canvas 2D",
            description: "WebGL is not available. Using fallback renderer with reduced performance.",
            variant: "default",
          });
        } catch (canvas2dError) {
          console.error("Canvas2D initialization failed:", canvas2dError);
          throw new Error("Both WebGL and Canvas2D failed to initialize");
        }
      }

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
    } catch (error) {
      toast({
        title: "Rendering Error",
        description: "Failed to initialize particle system. Please try refreshing the page.",
        variant: "destructive",
      });
      console.error("Particle system initialization error:", error);
    }
  }, [config.threadCount, config.particlesPerThread, config.repulsionForce]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ 
        background: 'black',
        cursor: 'default'
      }}
    />
  );
}