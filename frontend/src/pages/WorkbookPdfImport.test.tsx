import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'

import { readPdfFields } from '../pdfImport/readFields'
import { routes } from '../routes'
import { HEALTH_OK, mockApi, project } from '../test/api'
import { renderRoutes } from '../test/render'

/** A small fillable PDF with made-up content, like the workbook's form. */
async function fillablePdf(name = 'Workbook_Velaria.pdf'): Promise<File> {
  const document = await PDFDocument.create()
  const page = document.addPage()
  const form = document.getForm()
  const text = form.createTextField('Text Field 2')
  text.setText('Troppi ticket ripetitivi')
  text.addToPage(page)
  form.createTextField('Text Field 3').addToPage(page, { y: 200 })
  const box = form.createCheckBox('Check Box 1')
  box.addToPage(page, { y: 400 })
  box.check()
  form.createCheckBox('Check Box 2').addToPage(page, { y: 500 })
  const bytes = await document.save()
  return new File([bytes as BlobPart], name, { type: 'application/pdf' })
}

async function plainPdf(): Promise<File> {
  const document = await PDFDocument.create()
  document.addPage()
  return new File([(await document.save()) as BlobPart], 'scansione.pdf', {
    type: 'application/pdf',
  })
}

describe('Reading a PDF form in the browser', () => {
  it('returns texts and check boxes', async () => {
    expect(await readPdfFields(await fillablePdf())).toEqual({
      'Text Field 2': 'Troppi ticket ripetitivi',
      'Text Field 3': '',
      'Check Box 1': true,
      'Check Box 2': false,
    })
  })

  it('explains a PDF without fields and a file that is not a PDF', async () => {
    await expect(readPdfFields(await plainPdf())).rejects.toThrow(/non ha campi compilabili/)
    await expect(readPdfFields(new File(['ciao'], 'nota.pdf'))).rejects.toThrow(
      /non è un PDF leggibile/,
    )
  })
})

describe('Importing a workbook PDF', () => {
  // The modal is in a portal; the page also has the JSON import's file input.
  const pdfInput = () =>
    document.querySelector('input[accept="application/pdf,.pdf"]') as HTMLInputElement

  async function openImport() {
    const view = renderRoutes(routes, '/')
    await userEvent.click(await screen.findByRole('button', { name: 'Importa da workbook PDF' }))
    return view
  }

  it('sends only the fields and opens the new project with a summary', async () => {
    const calls = mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/projects?archived=false': Response.json([]),
      'POST /api/projects/import-workbook': Response.json(
        { project: project({ id: 7, name: 'Workbook Velaria' }), answers: 1 },
        { status: 201 },
      ),
      'GET /api/projects/7': Response.json(project({ id: 7, name: 'Workbook Velaria' })),
    })
    await openImport()
    await userEvent.upload(pdfInput(), await fillablePdf())
    expect(screen.getByLabelText(/Nome del progetto/)).toHaveValue('Workbook Velaria')
    await userEvent.type(screen.getByLabelText('Azienda cliente'), 'Velaria')
    await userEvent.click(screen.getByRole('button', { name: 'Importa' }))

    expect(await screen.findByText('Importata 1 risposta dal workbook PDF')).toBeVisible()
    const sent = calls.find((c) => c.path === '/api/projects/import-workbook')
    expect(sent?.body).toEqual({
      name: 'Workbook Velaria',
      client_name: 'Velaria',
      fields: {
        'Text Field 2': 'Troppi ticket ripetitivi',
        'Text Field 3': '',
        'Check Box 1': true,
        'Check Box 2': false,
      },
    })
  })

  it('explains a PDF that is not the workbook', async () => {
    mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/projects?archived=false': Response.json([]),
      'POST /api/projects/import-workbook': Response.json(
        { detail: 'PDF non riconosciuto: usa il workbook PDF compilabile.' },
        { status: 422 },
      ),
    })
    await openImport()
    await userEvent.upload(pdfInput(), await fillablePdf('altro.pdf'))
    await userEvent.click(screen.getByRole('button', { name: 'Importa' }))
    expect(await screen.findByText(/PDF non riconosciuto/)).toBeVisible()
  })
})
