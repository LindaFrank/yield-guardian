import { useEffect, useMemo, useState } from 'react';
import { Download, FileWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';

const REPORT_STORAGE_KEY = 'yield-guardian-report-download';

interface StoredReport {
  filename: string;
  base64: string;
}

function readStoredReport(): StoredReport | null {
  try {
    const value = window.localStorage.getItem(REPORT_STORAGE_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<StoredReport>;
    if (typeof parsed.filename !== 'string' || typeof parsed.base64 !== 'string') return null;
    return { filename: parsed.filename, base64: parsed.base64 };
  } catch {
    return null;
  }
}

function base64ToBlob(base64: string): Blob {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: 'application/pdf' });
}

export default function DownloadReport() {
  const [report] = useState(readStoredReport);
  const objectUrl = useMemo(() => (report ? URL.createObjectURL(base64ToBlob(report.base64)) : null), [report]);

  useEffect(() => () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <section className="mx-auto max-w-xl text-center">
        {report && objectUrl ? (
          <>
            <Download className="mx-auto mb-5 h-10 w-10 text-primary" aria-hidden="true" />
            <h1 className="text-2xl font-semibold">Your portfolio report is ready</h1>
            <p className="mt-3 text-sm text-muted-foreground">Use the button below to save the generated PDF to your Downloads folder.</p>
            <Button asChild className="mt-7">
              <a href={objectUrl} download={report.filename}>
                <Download className="h-4 w-4" />
                Download portfolio report
              </a>
            </Button>
          </>
        ) : (
          <>
            <FileWarning className="mx-auto mb-5 h-10 w-10 text-yield-warning" aria-hidden="true" />
            <h1 className="text-2xl font-semibold">Report unavailable</h1>
            <p className="mt-3 text-sm text-muted-foreground">Return to Yield Guardian and create the report again.</p>
          </>
        )}
      </section>
    </main>
  );
}