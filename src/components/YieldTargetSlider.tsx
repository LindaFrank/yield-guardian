import { useEffect, useRef, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Target, ChevronUp, ChevronDown } from 'lucide-react';
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

  const adjust = (delta: number) => {
    const nextValue = Number((Math.min(MAX, Math.max(MIN, value + delta))).toFixed(1));
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
          <div className="flex items-center rounded-lg border-[3px] border-primary bg-primary/10 overflow-hidden">
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
              className="h-8 w-[4.5rem] border-0 bg-transparent px-1 text-center font-mono font-semibold text-primary shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <div className="flex flex-col border-l border-primary/30">
              <button
                type="button"
                onClick={() => adjust(STEP)}
                disabled={value >= MAX}
                aria-label="Increase desired yield"
                className="flex items-center justify-center h-4 w-6 text-primary hover:bg-primary/20 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => adjust(-STEP)}
                disabled={value <= MIN}
                aria-label="Decrease desired yield"
                className="flex items-center justify-center h-4 w-6 text-primary hover:bg-primary/20 disabled:opacity-30 disabled:hover:bg-transparent border-t border-primary/30"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
          <span className="font-semibold text-primary">10%</span>
        </div>
      </div>
    </div>
  );
}
