import ParticleCanvas from "@/components/particle-system/canvas";
import Controls from "@/components/particle-system/controls";
import { useState } from "react";

export default function Home() {
  const [config, setConfig] = useState({
    threadCount: 20,
    particlesPerThread: 50,
    repulsionForce: 50,
    colorTheme: "colored" as const,
  });

  return (
    <div className="min-h-screen w-full bg-black flex flex-col">
      <div className="flex-1 relative">
        <ParticleCanvas config={config} />
        <Controls config={config} onChange={setConfig} />
      </div>
    </div>
  );
}