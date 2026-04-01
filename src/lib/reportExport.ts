const PDF_MIME_TYPE = 'application/pdf';
const REPORT_URL_TTL_MS = 5 * 60 * 1000;

const padNumber = (value: number) => value.toString().padStart(2, '0');

export function createPortfolioReportFileName(date = new Date()): string {
  const dateStamp = `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
  const timeStamp = `${padNumber(date.getHours())}-${padNumber(date.getMinutes())}`;

  return `dividend-portfolio-report-${dateStamp}_${timeStamp}.pdf`;
}

export function presentPortfolioReport(blob: Blob, fileName: string): { openedInNewTab: boolean } {
  const reportFile = new File([blob], fileName, { type: PDF_MIME_TYPE });
  const reportUrl = URL.createObjectURL(reportFile);
  const previewWindow = window.open('', '_blank');

  if (previewWindow) {
    previewWindow.opener = null;
    previewWindow.location.href = reportUrl;
    previewWindow.focus();
  } else {
    const downloadLink = document.createElement('a');
    downloadLink.href = reportUrl;
    downloadLink.download = fileName;
    downloadLink.rel = 'noopener noreferrer';
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
  }

  window.setTimeout(() => {
    URL.revokeObjectURL(reportUrl);
  }, REPORT_URL_TTL_MS);

  return { openedInNewTab: previewWindow !== null };
}