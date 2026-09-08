import { HelpCircle } from 'lucide-react';
import { useHelpWizard } from '@/contexts/HelpWizardContext';
import { cn } from '@/lib/utils';

export function HelpIconToggle() {
  const { enabled, enable } = useHelpWizard();

  return (
    <button
      onClick={enable}
      title="Turn on Helper Wizard"
      className={cn(
        'flex items-center gap-1.5 text-base font-medium transition-colors duration-200',
        enabled ? 'text-primary' : 'text-primary hover:text-primary/90'
      )}
    >
      <HelpCircle className="w-5 h-5" />
      <span>Helper Wizard</span>
    </button>
  );
}

