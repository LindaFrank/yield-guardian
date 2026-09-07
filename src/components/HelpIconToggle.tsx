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
        'flex items-center gap-1.5 text-sm font-medium transition-colors duration-200',
        enabled ? 'text-primary' : 'text-primary/80 hover:text-primary'
      )}
    >
      <HelpCircle className="w-5 h-5" />
      <span>Helper Wizard</span>
    </button>
  );
}
