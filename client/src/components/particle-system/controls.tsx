import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";

export type ColorTheme = "colored" | "white" | "black";

interface Config {
  threadCount: number;
  particlesPerThread: number;
  repulsionForce: number;
  colorTheme: ColorTheme;
}

interface ControlsProps {
  config: Config;
  onChange: (config: Config) => void;
  visible: boolean;
}

export default function Controls({ config, onChange, visible }: ControlsProps) {
  if (!visible) return null;

  return (
    <Card className="fixed top-4 left-4 bg-black/80 border-white/20 backdrop-blur-sm w-[300px] transition-all duration-300">
      <div className="flex items-center justify-between p-2 border-b border-white/10">
        <span className="text-white text-sm font-medium">Controls</span>
        <div className="text-white/60 text-xs">Press Space to hide</div>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-white">Columns: {config.threadCount}</Label>
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
            Particles per Column: {config.particlesPerThread}
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
            Click repulsion force: {config.repulsionForce}
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

        <div className="space-y-2">
          <Label className="text-white">Color Theme</Label>
          <Select
            value={config.colorTheme}
            onValueChange={(value: ColorTheme) =>
              onChange({ ...config, colorTheme: value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select color theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="colored">Colored</SelectItem>
              <SelectItem value="white">White on Black</SelectItem>
              <SelectItem value="black">Black on White</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10">
          <h3 className="text-white text-sm font-medium mb-2">How to Use</h3>
          <ul className="text-white/70 text-xs space-y-1">
            <li>• Click or drag to create wave effects</li>
            <li>• Press Space to toggle controls</li>
            <li>• Press Enter to toggle performance stats</li>
            <li>• Adjust columns and particles for different resolutions</li>
            <li>• Modify click repulsion force to change wave intensity</li>
            <li>• Try different color themes for unique visuals</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}