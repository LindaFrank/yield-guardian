import { useMemo, useState } from 'react';
import { FileDown, FileWarning, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PdfReportPreview } from '@/components/PdfReportPreview';

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

function base64ToBytes(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export default function DownloadReport() {
  const [report] = useState(readStoredReport);
  const reportBytes = useMemo(() => (report ? base64ToBytes(report.base64) : null), [report]);

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground print:bg-background print:p-0">
      <section className="mx-auto flex max-w-5xl flex-col text-center">
        {report && reportBytes ? (
          <>
            <div className="mb-6 print:hidden">
              <FileDown className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden="true" />
              <h1 className="text-2xl font-semibold">Your portfolio report is ready</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Safari is blocking the temporary download. Use the button below, then choose <strong>PDF → Save as PDF</strong>.
              </p>
              <Button className="mt-6" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Print or save as PDF
              </Button>
            </div>
            <div className="h-[calc(100vh-15rem)] min-h-[540px] print:h-auto print:min-h-0">
              <PdfReportPreview bytes={reportBytes} />
            </div>
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