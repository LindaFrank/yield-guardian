import { useEffect, useRef, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Target } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface YieldTargetSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const MIN = 1;
const MAX = 10;
const STEP = 0.5;

export function YieldTargetSlider({ value, onChange }: YieldTargetSliderProps) {
  const [inputValue, setInputValue] = useState(value.toFixed(1));
  const isEditingRef = useRef(false);

  useEffect(() => {
    if (!isEditingRef.current) setInputValue(value.toFixed(1));
  }, [value]);

  const commitInput = (rawValue: string) => {
    const parsedValue = Number(rawValue);
    if (!Number.isFinite(parsedValue)) {
      setInputValue(value.toFixed(1));
      return;
    }

    const clampedValue = Math.min(MAX, Math.max(MIN, parsedValue));
    const steppedValue = Math.round(clampedValue / STEP) * STEP;
    const nextValue = Number(steppedValue.toFixed(1));
    setInputValue(nextValue.toFixed(1));
    onChange(nextValue);
  };

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
      <div className="relative z-20 flex justify-between items-center mt-4 text-[15px] text-muted-foreground">
        <span>1%</span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={MIN}
            max={MAX}
            step={STEP}
            inputMode="decimal"
            value={inputValue}
            onChange={(event) => {
              const nextInput = event.target.value;
              setInputValue(nextInput);
              const parsedValue = Number(nextInput);
              if (nextInput !== '' && Number.isFinite(parsedValue) && parsedValue >= MIN && parsedValue <= MAX) {
                const steppedValue = Math.round(parsedValue / STEP) * STEP;
                onChange(Number(steppedValue.toFixed(1)));
              }
            }}
            onFocus={() => { isEditingRef.current = true; }}
            onBlur={() => {
              isEditingRef.current = false;
              commitInput(inputValue);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
            aria-label="Desired dividend yield percentage"
            className="h-8 w-[5.5rem] text-center font-mono font-semibold text-primary text-sm"
          />
          <span className="font-semibold text-primary">10%</span>
        </div>
      </div>
    </div>
  );
}
