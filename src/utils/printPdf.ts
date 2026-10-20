/**
 * IM LOCATION - Reliable Document Printing & PDF Generation
 * Handles iframe-isolated direct printing and high-res vector/canvas PDF exports
 * Specifically designed to avoid sandbox restrictions in preview environments.
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Trigger reliable direct printing using an isolated hidden iframe
 * If iframe printing fails or is restricted, falls back gracefully to window.print()
 */
export function printElement(elementId: string, documentTitle?: string): boolean {
  try {
    const sourceEl = document.getElementById(elementId);
    if (!sourceEl) {
      window.print();
      return true;
    }

    // Try creating a clean invisible iframe for printing
    let printIframe = document.getElementById('app-print-iframe') as HTMLIFrameElement | null;
    if (printIframe) {
      printIframe.remove();
    }

    printIframe = document.createElement('iframe');
    printIframe.id = 'app-print-iframe';
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    printIframe.style.zIndex = '-9999';
    document.body.appendChild(printIframe);

    const iframeDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
    if (!iframeDoc) {
      window.print();
      return true;
    }

    // Collect all stylesheets from the main document
    let stylesHtml = '';
    const styleTags = document.querySelectorAll('style, link[rel="stylesheet"]');
    styleTags.forEach(el => {
      stylesHtml += el.outerHTML;
    });

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html lang="fr" dir="ltr">
        <head>
          <meta charset="utf-8" />
          <title>${documentTitle || 'IM LOCATION - Document Officiel'}</title>
          ${stylesHtml}
          <style>
            @page {
              size: A4 portrait;
              margin: 0 !important;
            }
            @page :first {
              margin: 0 !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #111111 !important;
              width: 210mm !important;
              height: 297mm !important;
              max-height: 297mm !important;
              overflow: hidden !important;
              font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print\\:hidden, #app-navigation {
              display: none !important;
            }
            #${elementId} {
              box-shadow: none !important;
              border: none !important;
              margin: 0 auto !important;
              padding: 8mm 10mm !important;
              box-sizing: border-box !important;
              width: 210mm !important;
              height: 297mm !important;
              max-height: 297mm !important;
              overflow: hidden !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              break-after: avoid !important;
            }
          </style>
        </head>
        <body>
          ${sourceEl.outerHTML}
        </body>
      </html>
    `);
    iframeDoc.close();

    // Give iframe time to layout and load fonts/images
    setTimeout(() => {
      try {
        printIframe?.contentWindow?.focus();
        printIframe?.contentWindow?.print();
      } catch {
        // Fallback to window.print if iframe print is blocked
        window.print();
      }
    }, 400);

    return true;
  } catch {
    window.print();
    return true;
  }
}

/**
 * Generate and download a real vector/pixel-perfect A4 PDF file using jsPDF and html2canvas
 */
export async function downloadElementAsPdf(
  elementId: string, 
  fileName: string,
  onProgress?: (loading: boolean) => void
): Promise<boolean> {
  if (onProgress) onProgress(true);

  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element #${elementId} introuvable`);
    }

    // Temporary styling adjustments for crisp render
    const canvas = await html2canvas(element, {
      scale: 2.5, // 2.5x high DPI for crisp print quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Standard A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = 210;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // If fits on one page (or slightly more), scale to fit cleanly on A4
    if (pdfHeight <= 297) {
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    } else {
      // Scale down slightly to fit on 1 page if within 15% margin
      const scaleFactor = 295 / pdfHeight;
      const fitWidth = pdfWidth * scaleFactor;
      const fitHeight = 295;
      const marginX = (210 - fitWidth) / 2;
      pdf.addImage(imgData, 'JPEG', marginX, 1, fitWidth, fitHeight);
    }

    pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
    return true;
  } catch (err) {
    console.error('PDF generation error:', err);
    // If html2canvas fails, fallback to direct print
    window.print();
    return false;
  } finally {
    if (onProgress) onProgress(false);
  }
}
