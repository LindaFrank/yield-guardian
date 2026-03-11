import { HelpCircle } from 'lucide-react';
import { useHelpWizard } from '@/contexts/HelpWizardContext';
import { cn } from '@/lib/utils';

export function HelpIconToggle() {
  const { enabled, toggle } = useHelpWizard();

  return (
    <button
      onClick={toggle}
      title={enabled ? 'Turn off Help Wizard' : 'Turn on Help Wizard'}
      className={cn(
        'relative p-2 rounded-lg transition-all duration-200',
        enabled
          ? 'border-2 border-primary text-primary bg-primary/10'
          : 'border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground'
      )}
    >
      <HelpCircle className="w-5 h-5" />
    </button>
  );
}
