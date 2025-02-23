import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

export type VisualizationMode = "threads" | "smoke" | "monochrome" | "hair";

interface Config {
  threadCount: number;
  particlesPerThread: number;
  repulsionForce: number;
  mode: VisualizationMode;
}

interface ControlsProps {
  config: Config;
  onChange: (config: Config) => void;
}

export default function Controls({ config, onChange }: ControlsProps) {
  const modes: VisualizationMode[] = ["threads", "smoke", "monochrome", "hair"];

  return (
    <Card className="p-4 bg-black/80 border-white/20 backdrop-blur-sm w-[300px]">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 mb-4">
          {modes.map((mode) => (
            <Button
              key={mode}
              variant={config.mode === mode ? "default" : "outline"}
              onClick={() => onChange({ ...config, mode })}
              className="capitalize"
            >
              {mode}
            </Button>
          ))}
        </div>

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
            Force: {config.repulsionForce}
          </Label>
          <Slider
            value={[config.repulsionForce]}
            onValueChange={([value]) =>
              onChange({ ...config, repulsionForce: value })
            }
            min={20}
            max={100}
            step={5}
            className="w-full"
          />
        </div>
      </div>
    </Card>
  );
}