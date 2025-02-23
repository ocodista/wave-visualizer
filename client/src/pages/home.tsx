import ParticleCanvas from "@/components/particle-system/canvas";
import Controls from "@/components/particle-system/controls";
import { useState } from "react";

export default function Home() {
  const [config, setConfig] = useState({
    threadCount: 20,
    particlesPerThread: 50,
    repulsionForce: 50,  // Reduced from 100 to match new range
  });

  return (
    <div className="min-h-screen w-full bg-black flex flex-col">
      <div className="flex-1 relative">
        <ParticleCanvas config={config} />
      </div>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
        <Controls config={config} onChange={setConfig} />
      </div>
    </div>
  );
}