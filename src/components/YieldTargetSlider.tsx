import { Slider } from '@/components/ui/slider';
import { Target } from 'lucide-react';

interface YieldTargetSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function YieldTargetSlider({ value, onChange }: YieldTargetSliderProps) {
  return (
    <div className="p-5 rounded-xl gradient-card shadow-card border-[4px] border-muted-foreground/50 transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-elevated active:scale-[0.97]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <span className="font-medium">Income Goal</span>
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
      <div className="flex justify-between mt-2 text-[15px] text-muted-foreground">
        <span>1%</span>
        <span>10%</span>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Choose the yearly income rate you want from your portfolio.
      </p>
    </div>
  );
}
