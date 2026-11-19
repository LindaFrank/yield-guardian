import { ArrowLeft, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  acceptanceHeading,
  acceptanceIntro,
  acceptanceRetention,
  acceptanceStatement,
  acceptanceSupersedes,
  effectiveDateLine,
  acknowledgments,
  disclosures,
  disclosuresTitle,
  footerLines,
  sections,
  termsTitle,
} from '@/content/termsContent';

export default function Terms() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
          <Button asChild variant="outline" size="sm">
            <Link to="/auth"><ArrowLeft className="mr-2 h-4 w-4" />Back to sign up</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/Yield_Guardian_Terms_Privacy_Disclosures.pdf" download>
              <Download className="mr-2 h-4 w-4" />Download PDF
            </a>
          </Button>
        </div>

        <article className="space-y-8 text-sm leading-7 text-muted-foreground">
          <header className="space-y-3 text-center">
            <p className="text-sm font-semibold text-primary">Yield Guardian</p>
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{termsTitle}</h1>
            <p className="text-xs text-muted-foreground">{effectiveDateLine}</p>
          </header>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">{acceptanceHeading}</h2>
            <p>{acceptanceIntro}</p>
            <ul className="list-disc space-y-2 pl-6">
              {acknowledgments.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p className="border border-border bg-muted/40 px-4 py-3 font-medium text-foreground">{acceptanceStatement}</p>
            <p>{acceptanceRetention}</p>
            <p className="font-medium text-foreground">{acceptanceSupersedes}</p>
          </section>

          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">{disclosuresTitle}</h2>
            {disclosures.map((item) => (
              <p key={item.label}><strong className="text-foreground">{item.label}</strong> {item.text}</p>
            ))}
          </section>

          <footer className="space-y-2 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            {footerLines.map((line) => <p key={line}>{line}</p>)}
          </footer>
        </article>
      </div>
    </main>
  );
}
