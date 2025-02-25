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
  const [showInitialMessage, setShowInitialMessage] = useState(true);

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

  // Hide initial message after 5 seconds
  useEffect(() => {
    if (showInitialMessage) {
      const timer = setTimeout(() => setShowInitialMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showInitialMessage]);

  return (
    <div className="min-h-screen w-full bg-black flex flex-col">
      <div className="flex-1 relative">
        <ParticleCanvas config={config} />
        <Controls config={config} onChange={setConfig} visible={controlsVisible} />
        {showInitialMessage && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/80 text-center bg-black/50 backdrop-blur-sm p-4 rounded-lg">
            <p>Press Space to toggle controls</p>
            <p>Press Enter to toggle performance stats</p>
          </div>
        )}
      </div>
    </div>
  );
}