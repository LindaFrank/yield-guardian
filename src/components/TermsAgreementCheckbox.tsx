import { forwardRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

const TERMS_DOCUMENT_URL = '/terms';

interface TermsAgreementCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
}

export const TermsAgreementCheckbox = forwardRef<HTMLDivElement, TermsAgreementCheckboxProps>(function TermsAgreementCheckbox(
  { checked, onCheckedChange, id = 'terms-agreement' },
  ref,
) {
  return (
    <div ref={ref} className="flex items-start gap-2.5 pt-1">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className="mt-0.5"
        aria-required="true"
      />
      <div className="text-xs text-muted-foreground leading-snug select-none">
        <label htmlFor={id} className="cursor-pointer">
          I have read and agree to the Yield Guardian{' '}
        </label>
        <a
          href={TERMS_DOCUMENT_URL}
          className="text-primary hover:underline"
        >
          Terms &amp; Conditions
        </a>
        <label htmlFor={id} className="cursor-pointer">
          {' '}and acknowledge the Privacy Policy.
        </label>
      </div>
    </div>
  );
});
