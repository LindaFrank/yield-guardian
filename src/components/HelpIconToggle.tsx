import { HelpCircle } from 'lucide-react';
import { useHelpWizard } from '@/contexts/HelpWizardContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function HelpIconToggle() {
  const { enabled, enable } = useHelpWizard();

  const handleClick = () => {
    enable();
    toast.success('Helper Wizard is on', {
      description: 'Hover over any item on the page to see what it means.',
    });
  };

  return (
    <button
      onClick={handleClick}
      title={enabled ? 'Helper Wizard is on — hover any item for tips' : 'Turn on Helper Wizard'}
      className={cn(
        'flex items-center gap-1.5 text-base font-medium rounded-lg px-2 py-1 transition-colors duration-200',
        enabled
          ? 'text-primary bg-primary/15 ring-2 ring-primary/60'
          : 'text-primary hover:text-primary/90 hover:bg-primary/10'
      )}
    >
      <HelpCircle className="w-5 h-5" />
      <span>{enabled ? 'Helper Wizard: On' : 'Helper Wizard'}</span>
    </button>
  );
}
