/** Field values of a fillable PDF: text for text fields, true/false for check boxes. */
export type PdfFields = Record<string, string | boolean>

export class PdfReadError extends Error {}

/**
 * Reads the form of a PDF in the browser: the file itself never leaves the user's computer.
 * pdf-lib is loaded only here, so it stays out of the main bundle.
 */
export async function readPdfFields(file: Blob): Promise<PdfFields> {
  const { PDFDocument, PDFTextField, PDFCheckBox } = await import('pdf-lib')
  let document
  try {
    document = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false })
  } catch (error) {
    const encrypted = error instanceof Error && /encrypt/i.test(error.message)
    throw new PdfReadError(
      encrypted
        ? 'Il PDF è protetto da password: salvane una copia senza protezione e riprova.'
        : 'Il file non è un PDF leggibile.',
    )
  }
  const fields: PdfFields = {}
  for (const field of document.getForm().getFields()) {
    if (field instanceof PDFTextField) fields[field.getName()] = field.getText() ?? ''
    else if (field instanceof PDFCheckBox) fields[field.getName()] = field.isChecked()
  }
  if (Object.keys(fields).length === 0) {
    throw new PdfReadError(
      'Il PDF non ha campi compilabili: forse è stato stampato, scansionato o appiattito.',
    )
  }
  return fields
}
