import { DollarSign, Minus, Plus, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BudgetMode } from '@/lib/budgetAllocator';
import { cn } from '@/lib/utils';

function formatMoney(value: number): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function isValidBudgetInput(budgetInput: string): boolean {
  const trimmed = budgetInput.trim();
  if (trimmed === '') return true; // empty = skipped, still valid
  const parsed = parseFloat(trimmed);
  return Number.isFinite(parsed) && parsed > 0;
}

interface BudgetSetupCardProps {
  budgetInput: string;
  onBudgetChange: (value: string) => void;
  mode: BudgetMode;
  onModeChange: (mode: BudgetMode) => void;
  targetYield: number;
}

/** Step right after the yield slider: ask the dollar amount and allocation style. */
export function BudgetSetupCard({
  budgetInput,
  onBudgetChange,
  mode,
  onModeChange,
  targetYield,
}: BudgetSetupCardProps) {
  const trimmed = budgetInput.trim();
  const parsed = trimmed === '' ? NaN : parseFloat(trimmed);
  const isInvalidInput = trimmed !== '' && (!Number.isFinite(parsed) || parsed <= 0);
  const hasBudget = Number.isFinite(parsed) && parsed > 0;

  const modes: { id: BudgetMode; label: string; hint: string }[] = [
    { id: 'even', label: 'Even Split', hint: 'Equal portions' },
    { id: 'aggressive', label: 'Aggressive', hint: 'Higher yield' },
    { id: 'conservative', label: 'Conservative', hint: `Near ${targetYield.toFixed(1)}% target` },
  ];

  return (
    <Card className="p-4 border-primary/30 bg-card/80 space-y-4">
      <div className="space-y-1">
        <label htmlFor="invest-budget-input" className="text-sm font-semibold">
          How much money do you have to invest?
        </label>
        <p className="text-xs text-muted-foreground">
          Enter a dollar amount and we'll work out whole shares for you — or skip this and type shares yourself later.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <DollarSign className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            id="invest-budget-input"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            placeholder="e.g. 4500"
            value={budgetInput}
            onChange={(e) => onBudgetChange(e.target.value)}
            className="pl-8 bg-background border-primary/40 focus-visible:border-primary"
          />
        </div>
        {trimmed !== '' && (
          <Button type="button" variant="outline" size="icon" onClick={() => onBudgetChange('')} aria-label="Clear dollar amount">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isInvalidInput && (
        <p className="text-xs text-yield-negative">Please enter a dollar amount greater than $0.</p>
      )}

      {hasBudget && (
        <div className="space-y-2 pt-1">
          <p className="text-xs font-medium text-foreground">How should we split it?</p>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Allocation style">
            {modes.map((m) => {
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onModeChange(m.id)}
                  className={cn(
                    'rounded-lg border px-2 py-2 text-left transition-colors',
                    active
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border/60 bg-background/50 text-muted-foreground hover:border-primary/40'
                  )}
                >
                  <div className="text-xs font-semibold leading-tight">{m.label}</div>
                  <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{m.hint}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

interface BudgetPlannerCardProps {
  budget: number;
  mode: BudgetMode;
  portions: number;
  maxPortions: number;
  onPortionsChange: (portions: number) => void;
  totalAllocated: number;
  weightedYield: number;
}

/** Shown on the Enter Shares step once stocks are picked: portions control and live totals. */
export function BudgetPlannerCard({
  budget,
  mode,
  portions,
  maxPortions,
  onPortionsChange,
  totalAllocated,
  weightedYield,
}: BudgetPlannerCardProps) {
  const remaining = Math.round((budget - totalAllocated) * 100) / 100;
  const isOverBudget = remaining < -0.005;
  const perPortion = portions > 0 ? budget / portions : 0;

  return (
    <Card className="p-4 border-primary/30 bg-card/80 space-y-4">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">
            Investing ${formatMoney(budget)}
          </span>
          <span className="text-xs text-muted-foreground">
            {mode === 'even' ? 'Even Split' : mode === 'aggressive' ? 'Aggressive' : 'Conservative'}
          </span>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        {maxPortions > 1 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-foreground">
                Split into portions
              </span>
              <div className="flex items-center gap-2">
                {mode === 'even' && (
                  <span className="text-xs font-mono text-muted-foreground">
                    {portions} × ${formatMoney(perPortion)}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={portions <= 1}
                    onClick={() => onPortionsChange(Math.max(1, portions - 1))}
                    aria-label="Decrease portions"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <span className="w-7 text-center text-sm font-mono font-semibold" aria-live="polite">
                    {portions}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={portions >= maxPortions}
                    onClick={() => onPortionsChange(Math.min(maxPortions, portions + 1))}
                    aria-label="Increase portions"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            {portions < maxPortions && (
              <p className="text-xs text-muted-foreground">
                Your {portions} highest-yielding stock{portions !== 1 ? 's' : ''} receive funding; the remaining {maxPortions - portions} {maxPortions - portions === 1 ? 'is' : 'are'} marked Not bought.
              </p>
            )}
          </div>
        )}

        <div
          className={cn(
            'rounded-lg border px-3 py-2.5 text-xs space-y-1',
            isOverBudget
              ? 'border-yield-negative bg-yield-negative/10 text-yield-negative'
              : 'border-border/60 bg-background/60 text-foreground'
          )}
        >
          <div className="font-mono font-medium">
            {isOverBudget
              ? `Allocated $${formatMoney(totalAllocated)} of $${formatMoney(budget)} — $${formatMoney(Math.abs(remaining))} over budget`
              : `Allocated $${formatMoney(totalAllocated)} of $${formatMoney(budget)} — $${formatMoney(remaining)} remaining`}
          </div>
          {weightedYield > 0 && (
            <div className={cn('text-[11px]', isOverBudget ? 'text-yield-negative/90' : 'text-muted-foreground')}>
              Estimated portfolio yield: <span className="font-mono font-semibold text-primary">{weightedYield.toFixed(2)}%</span>
            </div>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground">
          Whole shares only. You can edit any share count below — for planning only, no trades are placed automatically.
        </p>
      </div>
    </Card>
  );
}
