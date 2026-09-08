import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface HelpWizardContextType {
  enabled: boolean;
  toggle: () => void;
  enable: () => void;
  disable: () => void;
}

const HelpWizardContext = createContext<HelpWizardContextType>({
  enabled: false,
  toggle: () => {},
  enable: () => {},
  disable: () => {},
});

export function HelpWizardProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const toggle = () => setEnabled((prev) => !prev);
  const enable = useCallback(() => setEnabled(true), []);
  const disable = useCallback(() => setEnabled(false), []);

  return (
    <HelpWizardContext.Provider value={{ enabled, toggle, enable, disable }}>
      {children}
    </HelpWizardContext.Provider>
  );
}

export function useHelpWizard() {
  return useContext(HelpWizardContext);
}

