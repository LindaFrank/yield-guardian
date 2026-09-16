import { forwardRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

const TERMS_DOCUMENT_URL = '/Yield_Guardian_Terms_Privacy_Disclosures.pdf';

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
      <label htmlFor={id} className="text-xs text-muted-foreground leading-snug cursor-pointer select-none">
        I have read and agree to the Yield Guardian{' '}
        <a
          href={TERMS_DOCUMENT_URL}
          className="text-primary hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          Terms &amp; Conditions
        </a>{' '}
        and acknowledge the Privacy Policy.
      </label>
    </div>
  );
});
