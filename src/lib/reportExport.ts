const PDF_MIME_TYPE = 'application/pdf';

const padNumber = (value: number) => value.toString().padStart(2, '0');

export function createPortfolioReportFileName(date = new Date()): string {
  const dateStamp = `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
  const timeStamp = `${padNumber(date.getHours())}-${padNumber(date.getMinutes())}`;

  return `dividend-portfolio-report-${dateStamp}_${timeStamp}.pdf`;
}

export interface PortfolioReportPreviewData {
  fileName: string;
  url: string;
}

export function createPortfolioReportPreview(blob: Blob, fileName: string): PortfolioReportPreviewData {
  const reportFile = new File([blob], fileName, { type: PDF_MIME_TYPE });
  return {
    fileName,
    url: URL.createObjectURL(reportFile),
  };
}

export function downloadPortfolioReport(previewUrl: string, fileName: string): void {
  const downloadLink = document.createElement('a');
  downloadLink.href = previewUrl;
  downloadLink.download = fileName;
  downloadLink.rel = 'noopener noreferrer';
  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
}

export function revokePortfolioReportPreview(previewUrl: string): void {
  URL.revokeObjectURL(previewUrl);
}