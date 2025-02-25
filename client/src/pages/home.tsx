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

  const [tornadoActive, setTornadoActive] = useState(false);

  const handleTornado = () => {
    setTornadoActive(true);
    // Deactivate tornado after 5 seconds
    setTimeout(() => setTornadoActive(false), 5000);
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col">
      <div className="flex-1 relative">
        <ParticleCanvas config={config} tornadoActive={tornadoActive} />
        <Controls config={config} onChange={setConfig} onTornado={handleTornado} />
      </div>
    </div>
  );
}