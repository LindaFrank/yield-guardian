import { forwardRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const GlobalBackButton = forwardRef<HTMLButtonElement>(function GlobalBackButton(_, ref) {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/auth') return null;

  return (
    <Button
      ref={ref}
      type="button"
      onClick={() => navigate(-1)}
      aria-label="Go back"
      title="Go back"
      className="fixed right-0 top-0 z-[100] h-11 gap-2 rounded-bl-lg rounded-tr-none rounded-tl-none rounded-br-none border-2 border-primary bg-primary px-4 font-semibold text-primary-foreground shadow-lg hover:bg-primary/90"
    >
      <ArrowLeft className="h-5 w-5" />
      Back
    </Button>
  );
});
