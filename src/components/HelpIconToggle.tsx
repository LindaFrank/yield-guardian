import { HelpCircle } from 'lucide-react';
import { useHelpWizard } from '@/contexts/HelpWizardContext';

export function HelpIconToggle() {
  const { enable } = useHelpWizard();

  return (
    <button
      onClick={enable}
      title="Turn on Helper Wizard"
      className="flex items-center gap-1.5 text-base font-medium rounded-lg px-2 py-1 transition-colors duration-200 text-primary hover:text-primary/90 hover:bg-primary/10"
    >
      <HelpCircle className="w-5 h-5" />
      <span>Helper Wizard</span>
    </button>
  );
}
