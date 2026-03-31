import { createContext, useContext, useState, ReactNode } from 'react';

interface HelpWizardContextType {
  enabled: boolean;
  toggle: () => void;
}

const HelpWizardContext = createContext<HelpWizardContextType>({
  enabled: false,
  toggle: () => {},
});

export function HelpWizardProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const toggle = () => setEnabled((prev) => !prev);

  return (
    <HelpWizardContext.Provider value={{ enabled, toggle }}>
      {children}
    </HelpWizardContext.Provider>
  );
}

export function useHelpWizard() {
  return useContext(HelpWizardContext);
}
