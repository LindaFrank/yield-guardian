import { forwardRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

const TERMS_DOCUMENT_URL = '/terms';
const PRIVACY_DOCUMENT_URL = '/privacy';

interface TermsAgreementCheckboxProps {
  termsChecked: boolean;
  privacyChecked: boolean;
  onTermsChange: (checked: boolean) => void;
  onPrivacyChange: (checked: boolean) => void;
  termsId?: string;
  privacyId?: string;
}

export const TermsAgreementCheckbox = forwardRef<HTMLDivElement, TermsAgreementCheckboxProps>(function TermsAgreementCheckbox(
  {
    termsChecked,
    privacyChecked,
    onTermsChange,
    onPrivacyChange,
    termsId = 'terms-agreement',
    privacyId = 'privacy-agreement',
  },
  ref,
) {
  return (
    <div ref={ref} className="space-y-2 pt-1">
      <div className="flex items-start gap-2.5">
        <Checkbox
          id={termsId}
          checked={termsChecked}
          onCheckedChange={(v) => onTermsChange(v === true)}
          className="mt-0.5"
          aria-required="true"
        />
        <div className="text-xs text-muted-foreground leading-snug select-none">
          <label htmlFor={termsId} className="cursor-pointer">
            I have read and agree to the Yield Guardian{' '}
          </label>
          <a
            href={TERMS_DOCUMENT_URL}
            className="text-primary hover:underline"
          >
            Terms &amp; Conditions
          </a>
          <label htmlFor={termsId} className="cursor-pointer">
            .
          </label>
        </div>
      </div>

      <div className="flex items-start gap-2.5">
        <Checkbox
          id={privacyId}
          checked={privacyChecked}
          onCheckedChange={(v) => onPrivacyChange(v === true)}
          className="mt-0.5"
          aria-required="true"
        />
        <div className="text-xs text-muted-foreground leading-snug select-none">
          <label htmlFor={privacyId} className="cursor-pointer">
            I have read and acknowledge the Yield Guardian{' '}
          </label>
          <a
            href={PRIVACY_DOCUMENT_URL}
            className="text-primary hover:underline"
          >
            Privacy Policy
          </a>
          <label htmlFor={privacyId} className="cursor-pointer">
            .
          </label>
        </div>
      </div>
    </div>
  );
});
