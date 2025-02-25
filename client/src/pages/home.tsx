import ParticleCanvas from "@/components/particle-system/canvas";
import Controls from "@/components/particle-system/controls";
import { useState, useEffect } from "react";

export default function Home() {
  const [config, setConfig] = useState({
    threadCount: 20,
    particlesPerThread: 50,
    repulsionForce: 50,
    colorTheme: "colored" as const,
  });

  const [controlsVisible, setControlsVisible] = useState(true);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent page scroll
        setControlsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="min-h-screen w-full bg-black flex flex-col">
      <div className="flex-1 relative">
        <ParticleCanvas config={config} />
        <Controls config={config} onChange={setConfig} visible={controlsVisible} />
        {!controlsVisible && (
          <div className="fixed bottom-4 right-4 text-white/50 text-sm">
            Press Space to show controls
          </div>
        )}
      </div>
    </div>
  );
}