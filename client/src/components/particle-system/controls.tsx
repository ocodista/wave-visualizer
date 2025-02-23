import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface Config {
  threadCount: number;
  particlesPerThread: number;
  repulsionForce: number;
}

interface ControlsProps {
  config: Config;
  onChange: (config: Config) => void;
}

export default function Controls({ config, onChange }: ControlsProps) {
  return (
    <Card className="p-4 bg-black/80 border-white/20 backdrop-blur-sm w-[300px]">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-white">Threads: {config.threadCount}</Label>
          <Slider
            value={[config.threadCount]}
            onValueChange={([value]) =>
              onChange({ ...config, threadCount: value })
            }
            min={5}
            max={50}
            step={1}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white">
            Particles per Thread: {config.particlesPerThread}
          </Label>
          <Slider
            value={[config.particlesPerThread]}
            onValueChange={([value]) =>
              onChange({ ...config, particlesPerThread: value })
            }
            min={10}
            max={200}
            step={5}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white">
            Repulsion Force: {config.repulsionForce}
          </Label>
          <Slider
            value={[config.repulsionForce]}
            onValueChange={([value]) =>
              onChange({ ...config, repulsionForce: value })
            }
            min={20}
            max={150}
            step={5}
            className="w-full"
          />
        </div>
      </div>
    </Card>
  );
}