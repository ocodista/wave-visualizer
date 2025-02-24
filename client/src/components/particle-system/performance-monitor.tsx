import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface PerformanceStats {
  fps: number;
  particleCount: number;
  drawCalls: number;
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
  };
}

interface PerformanceMonitorProps {
  particleCount: number;
  drawCalls: number;
}

export default function PerformanceMonitor({ particleCount, drawCalls }: PerformanceMonitorProps) {
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 0,
    particleCount,
    drawCalls,
    memory: {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
    },
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const updateStats = () => {
      const currentTime = performance.now();
      frameCount++;

      // Update FPS every second
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        const memory = (performance as any).memory || {
          usedJSHeapSize: 0,
          totalJSHeapSize: 0,
        };

        setStats({
          fps,
          particleCount,
          drawCalls,
          memory: {
            usedJSHeapSize: Math.round(memory.usedJSHeapSize / (1024 * 1024)),
            totalJSHeapSize: Math.round(memory.totalJSHeapSize / (1024 * 1024)),
          },
        });

        frameCount = 0;
        lastTime = currentTime;
      }

      animationFrameId = requestAnimationFrame(updateStats);
    };

    updateStats();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleCount, drawCalls]);

  return (
    <Card className="fixed top-4 right-4 p-4 bg-black/80 border-white/20 backdrop-blur-sm text-white space-y-2">
      <div className="text-sm font-mono">
        <div>FPS: {stats.fps}</div>
        <div>Particles: {stats.particleCount}</div>
        <div>Draw Calls: {stats.drawCalls}</div>
        {stats.memory.totalJSHeapSize > 0 && (
          <div>
            Memory: {stats.memory.usedJSHeapSize}MB / {stats.memory.totalJSHeapSize}MB
          </div>
        )}
      </div>
    </Card>
  );
}
