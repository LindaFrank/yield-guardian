import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold text-lg">Privacy Policy</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl prose prose-invert prose-sm">
        <p className="text-muted-foreground text-sm">Last updated: March 17, 2026</p>

        <h2 className="text-foreground text-lg font-semibold mt-6">1. Information We Collect</h2>
        <p className="text-muted-foreground">
          We collect the information you voluntarily provide when using Yield Guardian, including your name, email address, age, and portfolio preferences. We also collect usage data to improve the service.
        </p>

        <h2 className="text-foreground text-lg font-semibold mt-6">2. How We Use Your Information</h2>
        <p className="text-muted-foreground">
          Your information is used solely for the purpose of providing and improving the Yield Guardian service. This includes:
        </p>
        <ul className="text-muted-foreground list-disc pl-5 space-y-1">
          <li>Displaying your portfolio and yield analysis</li>
          <li>Sending you email updates and stock tips if you opt in</li>
          <li>Personalizing your experience</li>
          <li>Improving our features and functionality</li>
        </ul>

        <h2 className="text-foreground text-lg font-semibold mt-6">3. We Do Not Sell Your Data</h2>
        <p className="text-muted-foreground">
          We will <strong className="text-foreground">never</strong> sell, rent, or trade your personal information to third parties. Your data belongs to you.
        </p>

        <h2 className="text-foreground text-lg font-semibold mt-6">4. Data Sharing</h2>
        <p className="text-muted-foreground">
          We do not share your personal information with third parties except when required by law or to protect our rights. We may use trusted service providers to help operate our platform, and they are bound by confidentiality obligations.
        </p>

        <h2 className="text-foreground text-lg font-semibold mt-6">5. Data Security</h2>
        <p className="text-muted-foreground">
          We take reasonable measures to protect your personal information from unauthorized access, alteration, or destruction. However, no method of electronic transmission or storage is 100% secure.
        </p>

        <h2 className="text-foreground text-lg font-semibold mt-6">6. Your Rights</h2>
        <p className="text-muted-foreground">
          You may update or delete your personal information at any time through your profile settings. You can also opt out of communications by unchecking the relevant preferences on your profile page.
        </p>

        <h2 className="text-foreground text-lg font-semibold mt-6">7. Changes to This Policy</h2>
        <p className="text-muted-foreground">
          We may update this privacy policy from time to time. Any changes will be reflected on this page with an updated revision date.
        </p>

        <h2 className="text-foreground text-lg font-semibold mt-6">8. Contact Us</h2>
        <p className="text-muted-foreground">
          If you have any questions about this privacy policy or feedback about the app, please{' '}
          <a href="/contact" className="text-primary hover:underline">contact us</a> or email us at{' '}
          <a href="mailto:lindafrank@aol.com" className="text-primary hover:underline">lindafrank@aol.com</a>.
        </p>
      </main>
    </div>
  );
}
