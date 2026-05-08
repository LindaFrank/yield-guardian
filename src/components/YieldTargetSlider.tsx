import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Target, Minus, Plus } from 'lucide-react';

interface YieldTargetSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const MIN = 1;
const MAX = 10;
const STEP = 0.5;

export function YieldTargetSlider({ value, onChange }: YieldTargetSliderProps) {
  const clamp = (v: number) => Math.min(MAX, Math.max(MIN, Math.round(v * 10) / 10));
  const dec = () => onChange(clamp(value - STEP));
  const inc = () => onChange(clamp(value + STEP));

  return (
    <div className="p-5 rounded-xl gradient-card shadow-card border-[4px] border-muted-foreground/50 transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-elevated active:scale-[0.97]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <span className="font-medium">Income Goal</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={dec}
            disabled={value <= MIN}
            aria-label="Decrease yield target"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="font-mono font-semibold text-lg text-primary min-w-[64px] text-center">
            {value.toFixed(1)}%
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={inc}
            disabled={value >= MAX}
            aria-label="Increase yield target"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
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
      <p className="mt-3 text-sm text-muted-foreground">
        Choose the yearly income rate you want from your portfolio. Use the − / + buttons for fine adjustments.
      </p>
    </div>
  );
}
