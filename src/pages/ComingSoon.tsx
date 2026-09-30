import comingSoonGraphic from '@/assets/yield-guardian-coming-soon.png.asset.json';

export default function ComingSoon() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center overflow-hidden">
      <img
        src={comingSoonGraphic.url}
        alt="Yield Guardian — Coming Soon. Tools and education to help you understand your dividend portfolio. We're getting ready. Please check back soon. For educational purposes only."
        className="block w-full h-auto max-h-screen object-contain"
      />
    </main>
  );
}