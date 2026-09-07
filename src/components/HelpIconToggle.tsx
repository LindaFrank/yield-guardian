import { HelpCircle } from 'lucide-react';
import { useHelpWizard } from '@/contexts/HelpWizardContext';
import { cn } from '@/lib/utils';

export function HelpIconToggle() {
  const { enabled, toggle } = useHelpWizard();

  return (
    <button
      onClick={toggle}
      title={enabled ? 'Turn off Helper Wizard' : 'Turn on Helper Wizard'}
      className={cn(
        'relative p-2 rounded-lg transition-all duration-200',
        enabled
          ? 'border-2 border-primary text-primary bg-primary/10'
          : 'border-2 border-primary/60 text-primary bg-primary/5 hover:bg-primary/10'
      )}
    >
      <HelpCircle className="w-5 h-5" />
    </button>
  );
}
