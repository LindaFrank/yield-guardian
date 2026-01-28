import { Slider } from '@/components/ui/slider';
import { Target } from 'lucide-react';

interface YieldTargetSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function YieldTargetSlider({ value, onChange }: YieldTargetSliderProps) {
  return (
    <div className="p-5 rounded-xl gradient-card shadow-card border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <span className="font-medium">Target Minimum Yield</span>
        </div>
        <span className="font-mono font-semibold text-lg text-primary">
          {value.toFixed(1)}%
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={1}
        max={10}
        step={0.5}
        className="w-full"
      />
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>1%</span>
        <span>10%</span>
      </div>
    </div>
  );
}
