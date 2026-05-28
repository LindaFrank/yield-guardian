import { Slider } from '@/components/ui/slider';
import { Target } from 'lucide-react';

interface YieldTargetSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const MIN = 1;
const MAX = 10;
const STEP = 0.5;

export function YieldTargetSlider({ value, onChange }: YieldTargetSliderProps) {
  return (
    <div className="p-5 rounded-xl gradient-card shadow-card border-[4px] border-muted-foreground/50 transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-elevated active:scale-[0.97]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <span className="font-medium">Desired Dividend Yield</span>
        </div>
        <span className="font-mono font-semibold text-lg text-primary min-w-[64px] text-center">
          {value.toFixed(1)}%
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={MIN}
        max={MAX}
        step={STEP}
        className="w-full"
      />
      <div className="flex justify-between mt-2 text-[15px] text-muted-foreground">
        <span>1%</span>
        <span>10%</span>
      </div>
    </div>
  );
}
