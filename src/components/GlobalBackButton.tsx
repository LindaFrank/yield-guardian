import { forwardRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const GlobalBackButton = forwardRef<HTMLButtonElement>(function GlobalBackButton(_, ref) {
  const navigate = useNavigate();

  return (
    <Button
      ref={ref}
      type="button"
      onClick={() => navigate(-1)}
      aria-label="Go back"
      title="Go back"
      className="fixed right-0 top-0 z-[100] h-11 rounded-none rounded-bl-md border-2 border-t-0 border-r-0 border-primary bg-primary px-4 font-semibold text-primary-foreground shadow-lg hover:bg-primary/90"
    >
      <ArrowLeft className="h-5 w-5" />
      Back
    </Button>
  );
});